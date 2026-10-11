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

async function connectDB() {
  const rawUri = process.env.MONGODB_URI;
  const uri = rawUri?.trim();

  console.log("MONGODB_URI exists:", rawUri !== undefined);
  console.log("MONGODB_URI is empty:", !uri);
  console.log(
    "MONGODB_URI scheme:",
    uri?.split(":")[0] ?? "MISSING"
  );

  if (
    !uri ||
    !(
      uri.startsWith("mongodb://") ||
      uri.startsWith("mongodb+srv://")
    )
  ) {
    throw new Error("MONGODB_URI is missing or invalid");
  }

  // Diagnostic: print hostname only, never credentials
  const parsed = new URL(uri);
  console.log("MongoDB hostname:", parsed.hostname);

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

export default connectDB;
