import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/balance', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet uid name email');
    res.json({ success: true, balance: user.wallet, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/deposit', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum deposit is ₹100' });
    }
    
    const user = await User.findById(req.userId);
    user.wallet += amount;
    await user.save();
    
    res.json({ success: true, message: `₹${amount} added`, newBalance: user.wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/withdraw', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 500) {
      return res.status(400).json({ error: 'Minimum withdrawal is ₹500' });
    }
    
    const user = await User.findById(req.userId);
    if (user.wallet < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    user.wallet -= amount;
    await user.save();
    
    res.json({ success: true, message: `₹${amount} withdrawn`, newBalance: user.wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;