import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const port = process.env.PORT || 5000;

await connectDB();

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Secure Notes API is running",
    status: "UP"
  });
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
