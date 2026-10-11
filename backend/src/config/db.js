
import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  let hostname;

  try {
    hostname = new URL(uri).hostname;
  } catch {
    throw new Error("MONGODB_URI is not a valid URL");
  }

  console.log("MongoDB hostname being used:", hostname);

  await mongoose.connect(uri);
  console.log("MongoDB connected successfully");
}
