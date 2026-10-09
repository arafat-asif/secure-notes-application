import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  }
}, { timestamps: true });

/*
 * Supports:
 * - user's paginated note list
 * - admin's paginated all-note list by createdAt
 * The compound index also supports equality on userId followed by sort.
 */
noteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Note", noteSchema);
