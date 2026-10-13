import User from '../models/User.js';
import Note from '../models/Note.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, pageMeta } from '../utils/pagination.js';

const publicUser = (user) => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  active: user.active, createdAt: user.createdAt
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.search?.trim()) {
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ items: users.map(publicUser), pagination: pageMeta(page, limit, total) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: publicUser(user) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user', active = true } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Role must be user or admin.' });
  const user = await User.create({ name, email, password, role, active: Boolean(active) });
  res.status(201).json({ user: publicUser(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const { name, email, password, role, active } = req.body;
  if (req.user._id.toString() === user._id.toString() && role && role !== 'admin') {
    return res.status(400).json({ message: 'You cannot remove your own administrator role.' });
  }
  if (req.user._id.toString() === user._id.toString() && active === false) {
    return res.status(400).json({ message: 'You cannot deactivate your own account.' });
  }
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Name cannot be empty.' });
    user.name = name.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ message: 'Email cannot be empty.' });
    user.email = email.trim().toLowerCase();
  }
  if (password !== undefined && password !== '') {
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    user.password = password;
  }
  if (role !== undefined) {
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Role must be user or admin.' });
    user.role = role;
  }
  if (active !== undefined) user.active = Boolean(active);
  await user.save();
  res.json({ user: publicUser(user) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }
  await Promise.all([
    Note.deleteMany({ owner: user._id }),
    user.deleteOne()
  ]);
  res.json({ message: 'User and their notes deleted successfully.' });
});
