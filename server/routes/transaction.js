import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// ============ USER TRANSACTION ROUTES ============

// Get user's transaction history
router.get("/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { limit = 50, type, status } = req.query;

    const query = { userId: decoded.id };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = await Transaction.aggregate([
      { $match: { userId: decoded.id, status: "completed" } },
      { $group: {
        _id: null,
        totalDeposits: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] } },
        totalWithdrawals: { $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] } },
        totalPending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } }
      }}
    ]);

    res.json({
      success: true,
      transactions,
      stats: stats[0] || { totalDeposits: 0, totalWithdrawals: 0, totalPending: 0 }
    });
  } catch (err) {
    console.error("Transaction history error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Request deposit
router.post("/deposit/request", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { amount, method, details } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: "Minimum deposit amount is ₹100" });
    }

    if (amount > 100000) {
      return res.status(400).json({ error: "Maximum deposit amount is ₹100,000" });
    }

    if (!method || !["upi", "bank", "crypto"].includes(method)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      userName: user.name,
      userUid: user.uid,
      type: "deposit",
      amount,
      method,
      status: "pending",
      details: details || {}
    });

    await transaction.save();

    res.json({
      success: true,
      message: "Deposit request submitted successfully",
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        method: transaction.method,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (err) {
    console.error("Deposit request error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Request withdrawal
router.post("/withdraw/request", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { amount, method, details } = req.body;

    if (!amount || amount < 500) {
      return res.status(400).json({ error: "Minimum withdrawal amount is ₹500" });
    }

    if (amount > 50000) {
      return res.status(400).json({ error: "Maximum withdrawal amount is ₹50,000" });
    }

    if (!method || !["upi", "bank", "crypto"].includes(method)) {
      return res.status(400).json({ error: "Invalid withdrawal method" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await Transaction.countDocuments({
      userId: user._id,
      type: "withdraw",
      status: "pending"
    });

    if (pendingWithdrawals > 0) {
      return res.status(400).json({ error: "You have a pending withdrawal request" });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      userName: user.name,
      userUid: user.uid,
      type: "withdraw",
      amount,
      method,
      status: "pending",
      details: details || {}
    });

    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        method: transaction.method,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (err) {
    console.error("Withdrawal request error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ ADMIN TRANSACTION ROUTES ============

// Get all transactions (admin)
router.get("/admin/all", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const adminUser = await User.findById(decoded.id);
    
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { type, status, limit = 100 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = await Transaction.aggregate([
      { $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$amount" }
      }}
    ]);

    res.json({
      success: true,
      transactions,
      stats
    });
  } catch (err) {
    console.error("Admin transactions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Approve transaction (admin)
router.put("/admin/approve/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const adminUser = await User.findById(decoded.id);
    
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    // If deposit, add to user wallet
    if (transaction.type === "deposit") {
      const user = await User.findById(transaction.userId);
      if (user) {
        user.wallet += transaction.amount;
        await user.save();
        transaction.status = "completed";
        transaction.processedBy = adminUser.name || "Admin";
        transaction.processedAt = new Date();
        transaction.adminNotes = req.body.notes || "";
        await transaction.save();
        
        return res.json({
          success: true,
          message: "Deposit approved and added to wallet",
          transaction
        });
      }
    }

    // For withdrawal, just approve (waiting for manual transfer)
    transaction.status = "approved";
    transaction.processedBy = adminUser.name || "Admin";
    transaction.processedAt = new Date();
    transaction.adminNotes = req.body.notes || "";
    await transaction.save();

    res.json({
      success: true,
      message: "Transaction approved",
      transaction
    });
  } catch (err) {
    console.error("Approve transaction error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reject transaction (admin)
router.put("/admin/reject/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const adminUser = await User.findById(decoded.id);
    
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    transaction.status = "rejected";
    transaction.processedBy = adminUser.name || "Admin";
    transaction.processedAt = new Date();
    transaction.adminNotes = req.body.notes || "Transaction rejected by admin";
    await transaction.save();

    res.json({
      success: true,
      message: "Transaction rejected",
      transaction
    });
  } catch (err) {
    console.error("Reject transaction error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Complete withdrawal (admin - after manual transfer)
router.put("/admin/complete-withdrawal/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const adminUser = await User.findById(decoded.id);
    
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.type !== "withdraw") {
      return res.status(400).json({ error: "Not a withdrawal transaction" });
    }

    if (transaction.status !== "approved") {
      return res.status(400).json({ error: "Transaction must be approved first" });
    }

    // Deduct from user wallet
    const user = await User.findById(transaction.userId);
    if (user) {
      user.wallet -= transaction.amount;
      await user.save();
    }

    transaction.status = "completed";
    transaction.processedBy = adminUser.name || "Admin";
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal completed successfully",
      transaction
    });
  } catch (err) {
    console.error("Complete withdrawal error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get transaction stats (admin)
router.get("/admin/stats", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const adminUser = await User.findById(decoded.id);
    
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const stats = await Transaction.aggregate([
      { $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$amount" }
      }}
    ]);

    const pendingDeposits = await Transaction.countDocuments({ type: "deposit", status: "pending" });
    const pendingWithdrawals = await Transaction.countDocuments({ type: "withdraw", status: "pending" });

    res.json({
      success: true,
      stats,
      pendingDeposits,
      pendingWithdrawals
    });
  } catch (err) {
    console.error("Transaction stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;