import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Helper function to generate unique UID
const generateUniqueUID = async () => {
  let uid;
  let isUnique = false;
  
  while (!isUnique) {
    uid = "MX" + Math.floor(100000 + Math.random() * 900000);
    const existingUser = await User.findOne({ uid });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return uid;
};

// Test endpoint to verify bcrypt is working
router.get("/test-bcrypt", (req, res) => {
  res.json({ 
    message: "bcrypt loaded", 
    hasCompare: typeof bcrypt.compare === 'function',
    hasHash: typeof bcrypt.hash === 'function'
  });
});

/* REGISTER */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Use bcrypt.hash correctly
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = await generateUniqueUID();

    const user = new User({
      uid: uid,
      name: name,
      email: email,
      password: hashedPassword,
      wallet: 700,
      isBanned: false,
      role: "user",
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET || "your_secret_key_here",
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "Your account has been banned. Contact support." });
    }

    // Use bcrypt.compare correctly
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET || "your_secret_key_here",
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* GET USER PROFILE */
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key_here");
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt
      }
    });
    
  } catch (err) {
    console.error("Profile error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

/* UPDATE USER PROFILE */
router.put("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key_here");
    
    const { name, email } = req.body;
    
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: decoded.id } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use by another account" });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    const user = await User.findByIdAndUpdate(
      decoded.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt
      }
    });
    
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* CHANGE PASSWORD */
router.put("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key_here");
    
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Use bcrypt.compare correctly
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ 
      success: true, 
      message: "Password changed successfully" 
    });
    
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* GET ALL USERS */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* BAN USER */
router.put("/ban/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    user.isBanned = !user.isBanned;
    await user.save();
    
    res.json({ 
      success: true, 
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      isBanned: user.isBanned
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE USER */
router.delete("/delete/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE WALLET */
router.put("/wallet/:id", async (req, res) => {
  try {
    const { wallet } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { wallet },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ success: true, wallet: user.wallet, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET USER BY UID */
router.get("/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;