import express from "express";
import User from "../models/User.js";
import Bet from "../models/Bet.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Admin middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Get all users
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user
router.get("/user/:id", verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user wallet
router.put("/user/:id/wallet", verifyAdmin, async (req, res) => {
  try {
    const { wallet } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { wallet },
      { new: true }
    ).select("-password");
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ban/Unban user
router.put("/user/:id/ban", verifyAdmin, async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned },
      { new: true }
    ).select("-password");
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete("/user/:id", verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Bet.deleteMany({ userId: req.params.id });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all deposits
router.get("/deposits", verifyAdmin, async (req, res) => {
  try {
    // This would come from a Deposit model
    res.json({ success: true, deposits: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve deposit
router.put("/deposit/:id/approve", verifyAdmin, async (req, res) => {
  try {
    // Approve deposit logic
    res.json({ success: true, message: "Deposit approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all withdrawals
router.get("/withdrawals", verifyAdmin, async (req, res) => {
  try {
    res.json({ success: true, withdrawals: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve withdrawal
router.put("/withdrawal/:id/approve", verifyAdmin, async (req, res) => {
  try {
    res.json({ success: true, message: "Withdrawal approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Game settings
let gameSettings = {
  numcards: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    multiplier: 9
  },
  colorTrade: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    colors: ["GREEN", "VIOLET", "RED"]
  },
  mines: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    maxMines: 10
  },
  sky: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    maxMultiplier: 20
  },
  spin: {
    enabled: true,
    minBet: 10,
    maxBet: 10000
  },
  plinko: {
    enabled: true,
    minBet: 10,
    maxBet: 10000
  },
  lottery: {
    enabled: true,
    ticketPrice: 10,
    jackpot: 100000
  },
  trading: {
    enabled: true,
    minBet: 10,
    maxBet: 10000
  }
};

// Get game settings
router.get("/game-settings", verifyAdmin, async (req, res) => {
  res.json({ success: true, settings: gameSettings });
});

// Update game settings
router.put("/game-settings", verifyAdmin, async (req, res) => {
  try {
    gameSettings = { ...gameSettings, ...req.body };
    res.json({ success: true, settings: gameSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Platform settings
let platformSettings = {
  siteName: "Malik.XGO",
  maintenance: false,
  depositBonus: 10,
  referralBonus: 5,
  minDeposit: 100,
  maxDeposit: 100000,
  minWithdraw: 500,
  maxWithdraw: 50000
};

router.get("/platform-settings", verifyAdmin, async (req, res) => {
  res.json({ success: true, settings: platformSettings });
});

router.put("/platform-settings", verifyAdmin, async (req, res) => {
  try {
    platformSettings = { ...platformSettings, ...req.body };
    res.json({ success: true, settings: platformSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get platform stats
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isBanned: false });
    const totalBets = await Bet.countDocuments();
    const totalWins = await Bet.countDocuments({ isWin: true });
    const totalLosses = await Bet.countDocuments({ isWin: false });
    
    const bets = await Bet.find();
    const totalWagered = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalWon = bets.reduce((sum, bet) => sum + bet.winAmount, 0);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalBets,
        totalWins,
        totalLosses,
        totalWagered,
        totalWon,
        profit: totalWagered - totalWon
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;