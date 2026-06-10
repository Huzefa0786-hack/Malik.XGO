import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import betRoutes from "./routes/bet.js";
import controlRoutes from "./routes/control.js";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    credentials: true
  }
});

app.set('io', io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/bet", betRoutes);
app.use("/api/control", controlRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.json({ message: "Malik.XGO API Running" });
});

// Global game state
let globalTimer = 30;
let currentRoundId = `round-${Date.now()}`;
let lastResults = {
  numcards: null,
  color: null,
  number: null
};

// Continuous game loop
let gameLoopInterval = null;

const startGameLoop = () => {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  
  gameLoopInterval = setInterval(() => {
    if (globalTimer > 0) {
      globalTimer--;
      io.emit('timer_update', globalTimer);
    } else {
      // Generate results for all games
      const numcardsResult = Math.floor(Math.random() * 10) + 1;
      const colors = ["GREEN", "VIOLET", "RED"];
      const colorResult = colors[Math.floor(Math.random() * colors.length)];
      const numberResult = Math.floor(Math.random() * 10);
      
      lastResults = {
        numcards: numcardsResult,
        color: colorResult,
        number: numberResult
      };
      
      io.emit('result_update', lastResults);
      currentRoundId = `round-${Date.now()}`;
      io.emit('round_start', currentRoundId);
      globalTimer = 30;
      io.emit('timer_update', globalTimer);
    }
  }, 1000);
};

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current state to new client
  socket.emit('timer_update', globalTimer);
  socket.emit('result_update', lastResults);
  socket.emit('round_start', currentRoundId);
  
  socket.on('join_game', (game) => {
    socket.join(game);
    console.log(`User ${socket.id} joined ${game}`);
  });
  
  socket.on('place_bet', (betData) => {
    io.to('numcards').emit('live_bet', betData);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB Connection with better error handling
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matkaking';

console.log('Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected successfully');
    startGameLoop();
    startServer();
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  Starting server without MongoDB - some features may not work');
    startGameLoop();
    startServer();
  });

function startServer() {
  // Handle port in use error
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
      server.listen(PORT + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🕐 Game timer running: ${globalTimer}s`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});