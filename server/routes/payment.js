import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
router.post("/create-order", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { amount, currency = "INR" } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Save order to database
    const transaction = new Transaction({
      userId: decoded.id,
      userName: decoded.name || "User",
      userUid: decoded.uid || "N/A",
      type: "deposit",
      amount: amount,
      method: "razorpay",
      status: "pending",
      details: {
        orderId: order.id,
        currency: currency,
        razorpayOrderId: order.id,
      },
    });

    await transaction.save();

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: transaction._id,
      },
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment
router.post("/verify-payment", async (req, res) => {
  try {
    const { orderId, paymentId, signature, transactionId } = req.body;

    // Verify signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Update transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Add money to wallet
    const user = await User.findById(transaction.userId);
    if (user) {
      user.wallet += transaction.amount;
      await user.save();
    }

    transaction.status = "completed";
    transaction.details.paymentId = paymentId;
    transaction.details.razorpaySignature = signature;
    await transaction.save();

    res.json({
      success: true,
      message: "Payment verified successfully",
      wallet: user.wallet,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;