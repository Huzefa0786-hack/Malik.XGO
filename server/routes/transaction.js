import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Get user's transaction history
router.get("/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { limit = 50 } = req.query;

    // For now, return empty array if no transactions
    const transactions = [];
    const stats = { totalDeposits: 0, totalWithdrawals: 0, totalPending: 0 };

    res.json({
      success: true,
      transactions,
      stats
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
      method: method || "upi",
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

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const transaction = new Transaction({
      userId: user._id,
      userName: user.name,
      userUid: user.uid,
      type: "withdraw",
      amount,
      method: method || "upi",
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

// ADMIN ROUTES
router.get("/admin/all", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      transactions,
      stats: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/approve/:id", async (req, res) => {
  try {
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
      }
    }

    transaction.status = "completed";
    transaction.processedBy = "Admin";
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: "Transaction approved",
      transaction
    });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    transaction.status = "rejected";
    transaction.adminNotes = req.body.notes || "Transaction rejected";
    await transaction.save();

    res.json({
      success: true,
      message: "Transaction rejected",
      transaction
    });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/complete-withdrawal/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.type !== "withdraw") {
      return res.status(400).json({ error: "Not a withdrawal transaction" });
    }

    // Deduct from user wallet
    const user = await User.findById(transaction.userId);
    if (user) {
      user.wallet -= transaction.amount;
      await user.save();
    }

    transaction.status = "completed";
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal completed",
      transaction
    });
  } catch (err) {
    console.error("Complete withdrawal error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;