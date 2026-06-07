```js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* REGISTER */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        error: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = "MK" + Math.floor(100000 + Math.random() * 900000);

    const user = new User({
      uid,
      name,
      email,
      password: hashedPassword,
      wallet: 700,
      isBanned: false,
      role: "user",
    });

    await user.save();

    // ADD THIS TOKEN GENERATION
    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Registration successful",
      token,  // Include token here
      user,
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    const match =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        error: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        uid: user.uid,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;
```
