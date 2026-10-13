import { useEffect, useMemo, useState } from 'react';
import api from './api.js';

const emptyNote = { title: '', content: '' };
const emptyUser = { name: '', email: '', password: '', role: 'user', active: true };
const getError = (error) => error?.response?.data?.message || error.message || 'Something went wrong';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('secure_notes_token') || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('secure_notes_user') || 'null'); } catch { return null; }
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [page, setPage] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [editingNote, setEditingNote] = useState(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUser, setEditingUser] = useState(null);
  const [notePagination, setNotePagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === 'admin';
  const flashError = (e) => { setError(getError(e)); setMessage(''); };
  const flashMessage = (text) => { setMessage(text); setError(''); };

  function saveSession(data) {
    localStorage.setItem('secure_notes_token', data.token);
    localStorage.setItem('secure_notes_user', JSON.stringify(data.user));
    setToken(data.token); setUser(data.user); setPage('notes');
  }
  function logout() {
    localStorage.removeItem('secure_notes_token'); localStorage.removeItem('secure_notes_user');
    setToken(''); setUser(null); setNotes([]); setUsers([]); setPage('notes');
  }

  useEffect(() => {
    if (!token) return;
    api.get('/auth/me').then(({ data }) => {
      setUser(data.user); localStorage.setItem('secure_notes_user', JSON.stringify(data.user));
    }).catch(() => logout());
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    if (page === 'users' && isAdmin) loadUsers(userPagination.page, search);
    else if (page === 'all-notes' && isAdmin) loadNotes(notePagination.page, true);
    else if (page === 'notes') loadNotes(notePagination.page, false);
  }, [token, user?.id, page, notePagination.page, userPagination.page]);

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;
      const { data } = await api.post(endpoint, payload);
      saveSession(data); flashMessage('Welcome, ' + data.user.name + '!');
    } catch (e) { flashError(e); } finally { setBusy(false); }
  }

  async function loadNotes(pageNumber = 1, all = false) {
    try {
      const url = all && isAdmin ? '/notes/admin/all' : '/notes';
      const { data } = await api.get(url, { params: { page: pageNumber, limit: 8 } });
      setNotes(data.items || []); setNotePagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) { flashError(e); }
  }
  async function saveNote(event) {
    event.preventDefault(); setBusy(true);
    try {
      if (editingNote) await api.patch(`/notes/${editingNote}`, noteForm);
      else await api.post('/notes', noteForm);
      setNoteForm(emptyNote); setEditingNote(null);
      await loadNotes(notePagination.page, page === 'all-notes');
      flashMessage(editingNote ? 'Note updated.' : 'Note created.');
    } catch (e) { flashError(e); } finally { setBusy(false); }
  }
  async function deleteNote(id) {
    if (!window.confirm('Delete this note?')) return;
    try { await api.delete(`/notes/${id}`); await loadNotes(notePagination.page, page === 'all-notes'); flashMessage('Note deleted.'); }
    catch (e) { flashError(e); }
  }
  function startEditNote(note) { setEditingNote(note._id); setNoteForm({ title: note.title, content: note.content }); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function loadUsers(pageNumber = 1, query = search) {
    try {
      const { data } = await api.get('/users', { params: { page: pageNumber, limit: 8, search: query } });
      setUsers(data.items || []); setUserPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) { flashError(e); }
  }
  async function submitUser(event) {
    event.preventDefault(); setBusy(true);
    try {
      const payload = { ...userForm };
      if (editingUser && !payload.password) delete payload.password;
      if (editingUser) await api.patch(`/users/${editingUser}`, payload);
      else await api.post('/users', payload);
      setUserForm(emptyUser); setEditingUser(null);
      await loadUsers(userPagination.page, search);
      flashMessage(editingUser ? 'User updated.' : 'User created.');
    } catch (e) { flashError(e); } finally { setBusy(false); }
  }
  function startEditUser(item) {
    setEditingUser(item.id);
    setUserForm({ name: item.name, email: item.email, password: '', role: item.role, active: item.active });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function deleteUser(item) {
    if (!window.confirm(`Delete ${item.name} and all of their notes? This cannot be undone.`)) return;
    try { await api.delete(`/users/${item.id}`); await loadUsers(userPagination.page, search); flashMessage('User deleted.'); }
    catch (e) { flashError(e); }
  }
  async function toggleActive(item) {
    try { await api.patch(`/users/${item.id}`, { active: !item.active }); await loadUsers(userPagination.page, search); flashMessage('User status updated.'); }
    catch (e) { flashError(e); }
  }

  const visiblePages = useMemo(() => {
    const meta = page === 'users' ? userPagination : notePagination;
    return { current: meta.page || 1, total: meta.totalPages || 1, count: meta.total || 0 };
  }, [page, userPagination, notePagination]);

  if (!token || !user) {
    return <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">SN</div>
        <p className="eyebrow">PRIVATE BY DESIGN</p>
        <h1>Secure Notes</h1>
        <p className="muted">Your notes, organized and protected.</p>
        <div className="auth-tabs">
          <button className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setError(''); }}>Sign in</button>
          <button className={authMode === 'register' ? 'active' : ''} onClick={() => { setAuthMode('register'); setError(''); }}>Create account</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <form onSubmit={submitAuth} className="form-stack">
          {authMode === 'register' && <label>Full name<input required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name" /></label>}
          <label>Email address<input required type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input required minLength={8} type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 8 characters" /></label>
          <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="fine-print">Passwords are hashed on the server. Never share your password.</p>
      </section>
    </main>;
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark small">SN</div><span>Secure Notes</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${page === 'notes' ? 'selected' : ''}`} onClick={() => { setPage('notes'); setNotePagination(p => ({ ...p, page: 1 })); }}><span>▤</span> My Notes</button>
      {isAdmin && <>
        <div className="workspace-label admin-label">ADMINISTRATION</div>
        <button className={`nav-item ${page === 'users' ? 'selected' : ''}`} onClick={() => { setPage('users'); setUserPagination(p => ({ ...p, page: 1 })); }}><span>♙</span> Manage Users</button>
        <button className={`nav-item ${page === 'all-notes' ? 'selected' : ''}`} onClick={() => { setPage('all-notes'); setNotePagination(p => ({ ...p, page: 1 })); }}><span>▧</span> All Users' Notes</button>
      </>}
      <div className="sidebar-bottom">
        <div className="profile"><div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><span>{user.role}</span></div></div>
        <button className="nav-item logout" onClick={logout}><span>↪</span> Sign out</button>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div><p className="eyebrow">SECURE WORKSPACE</p><h1>{page === 'users' ? 'Manage Users' : page === 'all-notes' ? "All Users' Notes" : 'My Notes'}</h1></div>
        <div className="topbar-right"><span className={`role-pill ${isAdmin ? 'admin' : ''}`}>{isAdmin ? 'Administrator' : 'Standard user'}</span><div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div></div>
      </header>
      {(error || message) && <div className={`alert ${error ? 'error' : 'success'}`}>{error || message}<button onClick={() => { setError(''); setMessage(''); }}>×</button></div>}

      {page !== 'users' ? <>
        {page === 'notes' && <section className="panel note-editor">
          <div className="section-heading"><div><p className="eyebrow">{editingNote ? 'UPDATE ENTRY' : 'CAPTURE A THOUGHT'}</p><h2>{editingNote ? 'Edit note' : 'Create a note'}</h2></div><span className="soft-icon">＋</span></div>
          <form onSubmit={saveNote} className="form-stack">
            <label>Title<input required maxLength={160} value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} placeholder="Give your note a title" /></label>
            <label>Content<textarea required rows={4} maxLength={20000} value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} placeholder="Write something worth remembering…" /></label>
            <div className="form-actions"><button className="primary" disabled={busy}>{editingNote ? 'Save changes' : 'Create note'}</button>{editingNote && <button type="button" className="secondary" onClick={() => { setEditingNote(null); setNoteForm(emptyNote); }}>Cancel</button>}</div>
          </form>
        </section>}
        <section className="list-section">
          <div className="list-heading"><div><p className="eyebrow">{page === 'all-notes' ? 'ORGANIZATION-WIDE' : 'YOUR PRIVATE SPACE'}</p><h2>{page === 'all-notes' ? 'Every note' : 'Recent notes'} <span className="count">{notePagination.total || 0}</span></h2></div><button className="secondary" onClick={() => loadNotes(notePagination.page, page === 'all-notes')}>↻ Refresh</button></div>
          {notes.length === 0 ? <div className="empty-state"><div className="empty-icon">▤</div><h3>No notes here yet</h3><p>{page === 'notes' ? 'Create your first note using the form above.' : 'No notes have been created yet.'}</p></div> :
            <div className="notes-grid">{notes.map(note => <article className="note-card" key={note._id}>
              <div className="note-card-top"><span className="note-dot"></span><span className="date">{new Date(note.updatedAt).toLocaleDateString()}</span></div>
              <h3>{note.title}</h3><p className="note-content">{note.content}</p>
              {page === 'all-notes' && <p className="owner-label">By {note.owner?.name || 'Deleted user'} · {note.owner?.email || ''}</p>}
              <div className="note-card-footer"><span>Updated {new Date(note.updatedAt).toLocaleString()}</span><div><button className="icon-button" title="Edit note" onClick={() => startEditNote(note)}>Edit</button><button className="icon-button danger-text" title="Delete note" onClick={() => deleteNote(note._id)}>Delete</button></div></div>
            </article>)}</div>}
          <Pagination current={visiblePages.current} total={visiblePages.total} onChange={n => setNotePagination(p => ({ ...p, page: n }))} />
        </section>
      </> : <section className="list-section users-page">
        <section className="panel user-editor">
          <div className="section-heading"><div><p className="eyebrow">{editingUser ? 'ACCOUNT SETTINGS' : 'ADD TO WORKSPACE'}</p><h2>{editingUser ? 'Edit user' : 'Create a user'}</h2></div><span className="soft-icon">♙</span></div>
          <form onSubmit={submitUser} className="user-form-grid">
            <label>Full name<input required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} placeholder="Full name" /></label>
            <label>Email address<input required type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="user@example.com" /></label>
            <label>{editingUser ? 'New password (optional)' : 'Temporary password'}<input type="password" minLength={8} required={!editingUser} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder={editingUser ? 'Leave blank to keep current' : 'At least 8 characters'} /></label>
            <label>Role<select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}><option value="user">User</option><option value="admin">Admin</option></select></label>
            <label className="checkbox-label"><input type="checkbox" checked={userForm.active} onChange={e => setUserForm({ ...userForm, active: e.target.checked })} /> Account active</label>
            <div className="form-actions user-form-actions"><button className="primary" disabled={busy}>{editingUser ? 'Save user' : 'Add user'}</button>{editingUser && <button type="button" className="secondary" onClick={() => { setEditingUser(null); setUserForm(emptyUser); }}>Cancel</button>}</div>
          </form>
        </section>

        <div className="list-heading user-list-heading"><div><p className="eyebrow">ACCOUNT DIRECTORY</p><h2>All users <span className="count">{userPagination.total || 0}</span></h2></div>
          <form className="search-form" onSubmit={e => { e.preventDefault(); setUserPagination(p => ({ ...p, page: 1 })); loadUsers(1, search); }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" /><button className="secondary">Search</button></form>
        </div>
        <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Created</th><th className="actions-col">Actions</th></tr></thead>
          <tbody>{users.map(item => <tr key={item.id}><td><div className="table-user"><div className="avatar table-avatar">{item.name?.charAt(0)?.toUpperCase()}</div><div><strong>{item.name}</strong><span>{item.email}</span></div></div></td>
            <td><span className={`role-pill ${item.role === 'admin' ? 'admin' : ''}`}>{item.role}</span></td>
            <td><span className={`status-pill ${item.active ? 'active' : 'inactive'}`}><i></i>{item.active ? 'Active' : 'Inactive'}</span></td>
            <td className="date-cell">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
            <td><div className="table-actions"><button className="icon-button" onClick={() => startEditUser(item)}>Edit</button><button className="icon-button" onClick={() => toggleActive(item)}>{item.active ? 'Disable' : 'Enable'}</button><button className="icon-button danger-text" onClick={() => deleteUser(item)} disabled={item.id === user.id}>Delete</button></div></td>
          </tr>)}</tbody></table>
          {users.length === 0 && <div className="empty-state compact"><h3>No users found</h3><p>Try another search or add a user above.</p></div>}
        </div>
        <Pagination current={visiblePages.current} total={visiblePages.total} onChange={n => setUserPagination(p => ({ ...p, page: n }))} />
      </section>}
      <footer className="footer">Secure Notes <span>•</span> Keep important things safe.</footer>
    </main>
  </div>;
}

function Pagination({ current, total, onChange }) {
  if (!total || total <= 1) return null;
  return <div className="pagination"><span>Page {current} of {total}</span><div><button className="secondary" disabled={current <= 1} onClick={() => onChange(current - 1)}>Previous</button><button className="secondary" disabled={current >= total} onClick={() => onChange(current + 1)}>Next</button></div></div>;
}
