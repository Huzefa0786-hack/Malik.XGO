import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Simple auth routes (temporary for testing)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // For testing, accept any credentials
    res.json({
      success: true,
      token: "test-token-123",
      user: {
        id: "1",
        uid: "MX123456",
        name: "Test User",
        email: email,
        wallet: 10000
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    res.json({
      success: true,
      token: "test-token-123",
      user: {
        id: "1",
        uid: "MX" + Math.floor(100000 + Math.random() * 900000),
        name: name,
        email: email,
        wallet: 700
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/profile", async (req, res) => {
  res.json({
    success: true,
    user: {
      id: "1",
      uid: "MX123456",
      name: "Test User",
      email: "test@example.com",
      wallet: 10000
    }
  });
});

// Bet routes
app.post("/api/bet/place", async (req, res) => {
  try {
    const { game, amount, selection } = req.body;
    
    if (amount > 10000) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    res.json({
      success: true,
      wallet: 10000 - amount,
      betId: "bet_" + Date.now(),
      message: "Bet placed successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bet/cashout", async (req, res) => {
  try {
    const { winAmount } = req.body;
    
    res.json({
      success: true,
      wallet: 10000 + winAmount,
      message: "Cashout successful"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bet/history", async (req, res) => {
  res.json({
    success: true,
    bets: [],
    stats: {
      totalWins: 0,
      totalLosses: 0,
      totalWonAmount: 0,
      totalBetAmount: 0
    }
  });
});

// Wallet routes
app.get("/api/wallet/balance", async (req, res) => {
  res.json({ success: true, balance: 10000 });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.json({ message: "Malik.XGO API Running" });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }
});

let globalTimer = 30;
let lastResult = null;

setInterval(() => {
  if (globalTimer > 0) {
    globalTimer--;
    io.emit('timer_update', globalTimer);
  } else {
    const result = Math.floor(Math.random() * 10) + 1;
    io.emit('result_update', result);
    globalTimer = 30;
    io.emit('timer_update', globalTimer);
    io.emit('round_start', `round-${Date.now()}`);
  }
}, 1000);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('timer_update', globalTimer);
  
  socket.on('join_game', (game) => {
    socket.join(game);
    console.log(`User joined ${game}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
});

// MongoDB connection (optional)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('⚠️ MongoDB not connected:', err.message));