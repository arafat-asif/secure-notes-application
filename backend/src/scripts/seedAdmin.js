import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

async function seed() {
  try {
    await connectDB();
    const name = process.env.ADMIN_NAME || 'System Admin';
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const existing = await User.findOne({ email }).select('+password');
    if (existing) {
      existing.name = name;
      existing.role = 'admin';
      existing.active = true;
      existing.password = password;
      await existing.save();
      console.log(`Admin account updated: ${email}`);
    } else {
      await User.create({ name, email, password, role: 'admin', active: true });
      console.log(`Admin account created: ${email}`);
    }
  } catch (error) {
    console.error('Admin seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
seed();
