import { Router } from "express";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import { authenticate } from "../middleware/auth.js";
import { getPagination } from "../utils/pagination.js";

const router = Router();

router.use(authenticate);

router.post("/", async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const post = await Post.create({
      userId: req.user.userId,
      title,
      content
    });

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [items, total] = await Promise.all([
      Post.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments({})
    ]);

    res.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/user/:userId", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { page, limit, skip } = getPagination(req.query);

    /*
     * Scenario 2:
     * One aggregation pipeline containing a $lookup.
     * Posts are visible to everyone.
     *
     * The lookup uses Posts.userId, which is indexed.
     */
    const result = await Post.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.params.userId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author"
        }
      },
      { $unwind: "$author" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          createdAt: 1,
          author: {
            _id: 1,
            name: 1,
            email: 1
          }
        }
      }
    ]);

    res.json({
      items: result,
      pagination: { page, limit }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
