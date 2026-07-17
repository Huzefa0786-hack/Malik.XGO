import express from "express";
import User from "../models/User.js";
import Bet from "../models/Bet.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
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

// Cashout
router.post("/cashout", verifyToken, async (req, res) => {
  try {
    const { betId, winAmount, result, multiplier } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (winAmount > 0) {
      user.wallet += winAmount;
      await user.save();
    }
    
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
      winAmount: winAmount
    });
  } catch (err) {
    console.error("Cashout error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get bet history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const { game, limit = 50 } = req.query;
    const query = { userId: req.userId };
    if (game && game !== "all") query.game = game;
    
    const bets = await Bet.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const stats = {
      totalBets: bets.length,
      totalWins: bets.filter(b => b.isWin).length,
      totalLosses: bets.filter(b => !b.isWin).length,
      totalWonAmount: bets.reduce((sum, b) => sum + (b.winAmount || 0), 0),
      totalBetAmount: bets.reduce((sum, b) => sum + b.amount, 0)
    };
    
    res.json({
      success: true,
      bets,
      stats
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get wallet balance
router.get("/balance", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, balance: user?.wallet || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;