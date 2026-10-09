import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
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
    maxlength: 20000
  }
}, { timestamps: true });

/*
 * Required by the user-posts $lookup:
 * foreignField = userId.
 */
postSchema.index({ userId: 1 });

export default mongoose.model("Post", postSchema);
