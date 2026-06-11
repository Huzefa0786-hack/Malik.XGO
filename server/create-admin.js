import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matkaking');
    console.log("Connected to MongoDB");

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email:", existingAdmin.email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const uid = "ADMIN001";
    
    const admin = new User({
      uid: uid,
      name: "Administrator",
      email: "admin@malikxgo.com",
      password: hashedPassword,
      wallet: 0,
      isBanned: false,
      role: "admin",
    });

    await admin.save();
    
    console.log("✅ Admin user created!");
    console.log("📧 Email: admin@malikxgo.com");
    console.log("🔑 Password: admin123");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();