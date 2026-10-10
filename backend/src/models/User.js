import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER"
  },
  interests: {
    type: [String],
    default: []
  }
}, { timestamps: true });

/*
 * Required indexes:
 * 1. Unique email supports login and user lookup.
 * 2. createdAt supports paginated admin user listing.
 */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);