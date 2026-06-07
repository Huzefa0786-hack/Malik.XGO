import express from "express";
import User from "../models/User.js";
import Bet from "../models/Bet.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Place bet
router.post("/place", verifyToken, async (req, res) => {
  try {
    const { game, amount, selection, betType, multiplier, roundId } = req.body;
    
    if (!amount || amount < 10) {
      return res.status(400).json({ error: "Minimum bet is ₹10" });
    }
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.wallet < amount) return res.status(400).json({ error: "Insufficient balance" });
    
    // Deduct bet amount
    user.wallet -= amount;
    await user.save();
    
    // Save bet to history
    const bet = new Bet({
      userId: user._id,
      userName: user.name,
      userUid: user.uid,
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

// Cashout / Win
router.post("/cashout", verifyToken, async (req, res) => {
  try {
    const { game, winAmount, betId, result, multiplier } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Add win amount to wallet
    if (winAmount > 0) {
      user.wallet += winAmount;
      await user.save();
    }
    
    // Update bet record
    if (betId) {
      await Bet.findByIdAndUpdate(betId, {
        isWin: winAmount > 0,
        winAmount: winAmount,
        result: result,
        multiplier: multiplier || 1,
        status: "completed"
      });
    }
    
    res.json({ 
      success: true, 
      wallet: user.wallet,
      winAmount: winAmount,
      message: winAmount > 0 ? `You won ₹${winAmount}!` : "Better luck next time"
    });
    
  } catch (err) {
    console.error("Cashout error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get bet history for user
router.get("/history", verifyToken, async (req, res) => {
  try {
    const { game, limit = 50, page = 1 } = req.query;
    const query = { userId: req.userId };
    if (game && game !== "all") query.game = game;
    
    const bets = await Bet.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Bet.countDocuments(query);
    
    // Calculate statistics
    const stats = await Bet.aggregate([
      { $match: { userId: req.userId, status: "completed" } },
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
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
    
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get game results (for admin/display)
router.get("/results/:game", async (req, res) => {
  try {
    const { game } = req.params;
    const { limit = 20 } = req.query;
    
    const results = await Bet.find({ game, status: "completed", isWin: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select("userName winAmount selection createdAt");
    
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;