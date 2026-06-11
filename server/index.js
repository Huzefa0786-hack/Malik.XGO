import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matkaking';

// Define User Schema (if not already in models)
const UserSchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  wallet: { type: Number, default: 700 },
  isBanned: { type: Boolean, default: false },
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Bet Schema
const BetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  game: { type: String, required: true },
  betType: { type: String },
  selection: { type: String },
  amount: { type: Number, required: true },
  multiplier: { type: Number, default: 1 },
  result: { type: String },
  isWin: { type: Boolean, default: false },
  winAmount: { type: Number, default: 0 },
  roundId: { type: String },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const Bet = mongoose.models.Bet || mongoose.model("Bet", BetSchema);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date(), port: PORT });
});

// ============ AUTH ROUTES ============
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = "MX" + Math.floor(100000 + Math.random() * 900000);
    
    const user = new User({
      uid,
      name,
      email,
      password: hashedPassword,
      wallet: 700,
      role: "user"
    });
    
    await user.save();
    
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET || "secret123",
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
        isBanned: user.isBanned
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET || "secret123",
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
        isBanned: user.isBanned
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token" });
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id).select("-password");
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/auth/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/wallet/:id", async (req, res) => {
  try {
    const { wallet } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { wallet }, { new: true });
    res.json({ success: true, wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/ban/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/auth/delete/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ BET ROUTES ============
app.post("/api/bet/place", async (req, res) => {
  try {
    const { game, amount, selection, betType, multiplier, roundId } = req.body;
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (amount < 10) {
      return res.status(400).json({ error: "Minimum bet is ₹10" });
    }
    
    if (amount > user.wallet) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    // Deduct amount
    user.wallet -= amount;
    await user.save();
    
    // Save bet
    const bet = new Bet({
      userId: user._id,
      userName: user.name,
      game,
      betType: betType || "direct",
      selection: selection || "N/A",
      amount,
      multiplier: multiplier || 1,
      roundId: roundId || `round-${Date.now()}`,
      status: "pending"
    });
    await bet.save();
    
    res.json({
      success: true,
      wallet: user.wallet,
      betId: bet._id,
      message: "Bet placed successfully"
    });
  } catch (err) {
    console.error("Place bet error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bet/cashout", async (req, res) => {
  try {
    const { betId, winAmount, result, multiplier } = req.body;
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update bet
    if (betId) {
      await Bet.findByIdAndUpdate(betId, {
        isWin: winAmount > 0,
        winAmount: winAmount,
        result: result,
        multiplier: multiplier || 1,
        status: "completed"
      });
    }
    
    // Add winnings
    if (winAmount > 0) {
      user.wallet += winAmount;
      await user.save();
    }
    
    res.json({
      success: true,
      wallet: user.wallet,
      winAmount: winAmount
    });
  } catch (err) {
    console.error("Cashout error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bet/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token" });
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    
    const bets = await Bet.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(100);
    const stats = await Bet.aggregate([
      { $match: { userId: decoded.id, status: "completed" } },
      { $group: {
        _id: null,
        totalBets: { $sum: 1 },
        totalWins: { $sum: { $cond: ["$isWin", 1, 0] } },
        totalLosses: { $sum: { $cond: ["$isWin", 0, 1] } },
        totalWonAmount: { $sum: "$winAmount" },
        totalBetAmount: { $sum: "$amount" }
      }}
    ]);
    
    res.json({
      success: true,
      bets,
      stats: stats[0] || {
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        totalWonAmount: 0,
        totalBetAmount: 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/wallet/balance", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token" });
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);
    
    res.json({ success: true, balance: user?.wallet || 0 });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ============ ADMIN ROUTES ============
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/user/:id/wallet", async (req, res) => {
  try {
    const { wallet } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { wallet }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/user/:id/ban", async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/user/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root
app.get("/", (req, res) => {
  res.json({ message: "Malik.XGO API Running", port: PORT });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (without MongoDB)`);
    });
  });