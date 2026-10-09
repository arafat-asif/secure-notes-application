import { Router } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { getPagination } from "../utils/pagination.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [items, total] = await Promise.all([
      User.find({})
        .select("_id name email role interests createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({})
    ]);

    res.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/by-interests", async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    /*
     * Exactly ONE collection.aggregate() call for Scenario 1.
     * No find(), countDocuments(), or other User methods.
     *
     * $facet keeps the entire operation inside this one aggregate call
     * and provides pagination metadata.
     */
    const result = await User.aggregate([
      { $unwind: "$interests" },
      { $sort: { interests: 1, name: 1 } },
      {
        $group: {
          _id: "$interests",
          users: {
            $push: {
              id: "$_id",
              name: "$name",
              email: "$email"
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit }
          ],
          metadata: [
            { $count: "total" }
          ]
        }
      }
    ]);

    const data = result[0] || { items: [], metadata: [] };
    const total = data.metadata[0]?.total || 0;

    res.json({
      items: data.items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(req.params.id)
      .select("_id name email role interests createdAt updatedAt");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, email, password, role = "USER", interests = [] } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role,
      interests
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.role !== undefined) update.role = req.body.role;
    if (req.body.interests !== undefined) update.interests = req.body.interests;
    if (req.body.email !== undefined) update.email = req.body.email.toLowerCase().trim();
    if (req.body.password) update.password = await bcrypt.hash(req.body.password, 12);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("_id name email role interests createdAt updatedAt");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: "Admin cannot delete their own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
