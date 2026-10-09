import { Router } from "express";
import mongoose from "mongoose";
import Note from "../models/Note.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { getPagination } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = req.user.role === "ADMIN" ? {} : { userId: req.user.userId };

    const [items, total] = await Promise.all([
      Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Note.countDocuments(filter)
    ]);

    res.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid note id" });
    }

    const filter = { _id: req.params.id };
    if (req.user.role !== "ADMIN") filter.userId = req.user.userId;

    const note = await Note.findOne(filter);
    if (!note) return res.status(404).json({ message: "Note not found" });

    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const note = await Note.create({
      userId: req.user.userId,
      title,
      content
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "ADMIN") filter.userId = req.user.userId;

    const note = await Note.findOneAndUpdate(
      filter,
      { $set: { title: req.body.title, content: req.body.content } },
      { new: true, runValidators: true }
    );

    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "ADMIN") filter.userId = req.user.userId;

    const note = await Note.findOneAndDelete(filter);
    if (!note) return res.status(404).json({ message: "Note not found" });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
