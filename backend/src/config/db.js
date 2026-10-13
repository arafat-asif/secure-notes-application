// import mongoose from "mongoose";

// async function connectDB() {
//   const uri = process.env.MONGODB_URI?.trim();

//   if (
//     !uri ||
//     !(uri.startsWith("mongodb://") ||
//       uri.startsWith("mongodb+srv://"))
//   ) {
//     throw new Error(
//       "MONGODB_URI is missing or has an invalid MongoDB URI scheme"
//     );
//   }

//   try {
//     await mongoose.connect(uri);
//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     console.error("MongoDB connection failed:", error.message);
//     throw error;
//   }
// }

// export default connectDB;


import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Set it in backend/.env');
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('MONGODB_URI is not a valid URL. Check the full MongoDB connection string.');
  }
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
