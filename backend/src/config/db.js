import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (
    !uri ||
    !(uri.startsWith("mongodb://") ||
      uri.startsWith("mongodb+srv://"))
  ) {
    throw new Error(
      "MONGODB_URI is missing or has an invalid MongoDB URI scheme"
    );
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}