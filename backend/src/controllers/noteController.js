import Note from '../models/Note.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, pageMeta } from '../utils/pagination.js';

export const listNotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
  const [items, total] = await Promise.all([
    Note.find(filter).populate('owner', 'name email').sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Note.countDocuments(filter)
  ]);
  res.json({ items, pagination: pageMeta(page, limit, total) });
});

export const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id).populate('owner', 'name email');
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  if (req.user.role !== 'admin' && note.owner._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only access your own notes.' });
  }
  res.json({ note });
});

export const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }
  const note = await Note.create({ title, content, owner: req.user._id });
  res.status(201).json({ note });
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  if (req.user.role !== 'admin' && note.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only edit your own notes.' });
  }
  const { title, content } = req.body;
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ message: 'Title cannot be empty.' });
    note.title = title.trim();
  }
  if (content !== undefined) {
    if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ message: 'Content cannot be empty.' });
    note.content = content;
  }
  await note.save();
  res.json({ note });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  if (req.user.role !== 'admin' && note.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only delete your own notes.' });
  }
  await note.deleteOne();
  res.json({ message: 'Note deleted successfully.' });
});

export const listAllNotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    Note.find().populate('owner', 'name email').sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Note.countDocuments()
  ]);
  res.json({ items, pagination: pageMeta(page, limit, total) });
});
