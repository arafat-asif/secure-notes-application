import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API });

function setToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

function App() {
  const [token, setTokenState] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", name: "", interests: "" });
  const [note, setNote] = useState({ title: "", content: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(token);
    if (token) loadMe();
  }, [token]);

  async function loadMe() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      loadNotes();
    } catch {
      logout();
    }
  }

  async function loadNotes() {
    const { data } = await api.get("/notes?page=1&limit=20");
    setNotes(data.items);
  }

  async function submitAuth(e) {
    e.preventDefault();
    try {
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            interests: form.interests.split(",").map(x => x.trim()).filter(Boolean)
          };

      const { data } = await api.post(`/auth/${mode === "login" ? "login" : "register"}`, payload);
      localStorage.setItem("token", data.token);
      setTokenState(data.token);
      setMessage("Success");
    } catch (e) {
      setMessage(e.response?.data?.message || "Request failed");
    }
  }

  async function createNote(e) {
    e.preventDefault();
    try {
      await api.post("/notes", note);
      setNote({ title: "", content: "" });
      await loadNotes();
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not create note");
    }
  }

  async function deleteNote(id) {
    await api.delete(`/notes/${id}`);
    loadNotes();
  }

  function logout() {
    localStorage.removeItem("token");
    setTokenState(null);
    setUser(null);
    setNotes([]);
    setToken(null);
  }

  if (!token) {
    return (
      <main className="container">
        <h1>Secure Notes</h1>
        <form onSubmit={submitAuth} className="card">
          {mode === "register" && (
            <>
              <input placeholder="Name" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="Interests: chess, reading" value={form.interests}
                onChange={e => setForm({...form, interests: e.target.value})} />
            </>
          )}
          <input type="email" placeholder="Email" required value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="Password" required value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} />
          <button>{mode === "login" ? "Login" : "Register"}</button>
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            Switch to {mode === "login" ? "Register" : "Login"}
          </button>
          <p>{message}</p>
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      <header>
        <div>
          <h1>Secure Notes</h1>
          <p>{user?.name} — {user?.role}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="card">
        <h2>Create Note</h2>
        <form onSubmit={createNote}>
          <input placeholder="Title" required value={note.title}
            onChange={e => setNote({...note, title: e.target.value})} />
          <textarea placeholder="Content" required value={note.content}
            onChange={e => setNote({...note, content: e.target.value})} />
          <button>Create</button>
        </form>
      </section>

      <section>
        <h2>Notes</h2>
        {notes.map(n => (
          <article className="card" key={n._id}>
            <h3>{n.title}</h3>
            <p>{n.content}</p>
            <small>{new Date(n.createdAt).toLocaleString()}</small>
            <br />
            <button onClick={() => deleteNote(n._id)}>Delete</button>
          </article>
        ))}
      </section>

      {user?.role === "ADMIN" && (
        <section className="card">
          <h2>Admin</h2>
          <p>Use the REST API for user management, all-notes access and aggregation views.</p>
          <code>GET /api/users?page=1&amp;limit=10</code><br />
          <code>GET /api/users/by-interests?page=1&amp;limit=20</code>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
