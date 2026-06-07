import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token." });
  }
};

// Get wallet balance and user info
router.get("/balance", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("wallet uid name email");
    res.json({ 
      success: true, 
      balance: user.wallet,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add money to wallet (deposit)
router.post("/deposit", verifyToken, async (req, res) => {
  try {
    const { amount, method = "online" } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    if (amount < 100) {
      return res.status(400).json({ error: "Minimum deposit amount is ₹100" });
    }
    
    if (amount > 100000) {
      return res.status(400).json({ error: "Maximum deposit amount is ₹100,000" });
    }
    
    const user = await User.findById(req.userId);
    const previousBalance = user.wallet;
    user.wallet += amount;
    await user.save();
    
    // Here you would also save transaction to database
    // await Transaction.create({ userId: user._id, type: "deposit", amount, previousBalance, newBalance: user.wallet });
    
    res.json({ 
      success: true, 
      message: `₹${amount.toLocaleString()} added successfully!`,
      newBalance: user.wallet,
      amount: amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Withdraw money from wallet
router.post("/withdraw", verifyToken, async (req, res) => {
  try {
    const { amount, upiId, bankAccount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    if (amount < 500) {
      return res.status(400).json({ error: "Minimum withdrawal amount is ₹500" });
    }
    
    const user = await User.findById(req.userId);
    
    if (user.wallet < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    const previousBalance = user.wallet;
    user.wallet -= amount;
    await user.save();
    
    // Here you would save withdrawal request to database
    // await Withdrawal.create({ userId: user._id, amount, upiId, bankAccount, status: "pending" });
    
    res.json({ 
      success: true, 
      message: `Withdrawal request of ₹${amount.toLocaleString()} submitted successfully!`,
      newBalance: user.wallet,
      amount: amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get transaction history
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    // This would fetch from a Transaction model
    // For now, return mock data
    res.json({ 
      success: true, 
      transactions: [
        { id: 1, type: "deposit", amount: 1000, date: new Date(), status: "completed" },
        { id: 2, type: "game_win", amount: 2500, date: new Date(), status: "completed" },
        { id: 3, type: "withdraw", amount: 500, date: new Date(), status: "pending" }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;