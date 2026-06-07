import express from "express";
import User from "../models/User.js";
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

// Place bet on NumCards game
router.post("/numcards/bet", verifyToken, async (req, res) => {
  try {
    const { betAmount, selectedNumber, gameId } = req.body;
    
    if (!betAmount || betAmount < 10) {
      return res.status(400).json({ error: "Minimum bet is ₹10" });
    }
    
    const user = await User.findById(req.userId);
    
    if (user.wallet < betAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    // Deduct bet amount
    user.wallet -= betAmount;
    await user.save();
    
    // Game logic - random number between 0-9
    const winningNumber = Math.floor(Math.random() * 10);
    const isWin = selectedNumber === winningNumber;
    let winAmount = 0;
    
    if (isWin) {
      winAmount = betAmount * 9; // 9x multiplier
      user.wallet += winAmount;
      await user.save();
    }
    
    res.json({
      success: true,
      isWin,
      winningNumber,
      selectedNumber,
      betAmount,
      winAmount,
      newBalance: user.wallet
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place bet on Mines game
router.post("/mines/bet", verifyToken, async (req, res) => {
  try {
    const { betAmount, minesCount = 3, tiles = [] } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (user.wallet < betAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    user.wallet -= betAmount;
    await user.save();
    
    // Mines game logic
    const totalTiles = 25;
    const minePositions = [];
    while (minePositions.length < minesCount) {
      const pos = Math.floor(Math.random() * totalTiles);
      if (!minePositions.includes(pos)) minePositions.push(pos);
    }
    
    let multiplier = 1;
    let gameWon = true;
    
    for (const tile of tiles) {
      if (minePositions.includes(tile)) {
        gameWon = false;
        break;
      }
      multiplier = multiplier * 1.2;
    }
    
    let winAmount = 0;
    if (gameWon && tiles.length > 0) {
      winAmount = betAmount * multiplier;
      user.wallet += winAmount;
      await user.save();
    }
    
    res.json({
      success: true,
      gameWon,
      multiplier,
      betAmount,
      winAmount,
      newBalance: user.wallet,
      minePositions: gameWon ? undefined : minePositions // Only show mines if lost
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place bet on Aviator/Sky game
router.post("/sky/bet", verifyToken, async (req, res) => {
  try {
    const { betAmount, cashoutMultiplier } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (user.wallet < betAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    user.wallet -= betAmount;
    await user.save();
    
    // Generate random crash point (1.0x to 10x)
    const crashPoint = 1 + Math.random() * 9;
    const isCrashed = cashoutMultiplier >= crashPoint;
    
    let winAmount = 0;
    if (!isCrashed) {
      winAmount = betAmount * cashoutMultiplier;
      user.wallet += winAmount;
      await user.save();
    }
    
    res.json({
      success: true,
      isCrashed,
      crashPoint: parseFloat(crashPoint.toFixed(2)),
      cashoutMultiplier,
      betAmount,
      winAmount,
      newBalance: user.wallet
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spin Wheel game
router.post("/spin/bet", verifyToken, async (req, res) => {
  try {
    const { betAmount } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (user.wallet < betAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    user.wallet -= betAmount;
    await user.save();
    
    // Spin wheel multipliers
    const multipliers = [0, 0.5, 1, 1.5, 2, 2.5, 3, 5, 10];
    const randomMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    const winAmount = betAmount * randomMultiplier;
    
    if (winAmount > 0) {
      user.wallet += winAmount;
      await user.save();
    }
    
    res.json({
      success: true,
      multiplier: randomMultiplier,
      betAmount,
      winAmount,
      newBalance: user.wallet
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;