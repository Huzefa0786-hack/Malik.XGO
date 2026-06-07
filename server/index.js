import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// IMPORT ROUTES - CORRECT PATHS (no duplicate routes/)
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import betRoutes from './routes/bet.js';
import controlRoutes from './routes/control.js';
import depositRoutes from './routes/deposit.js';
import withdrawRoutes from './routes/withdraw.js';
import gameRoutes from './routes/game.js';

// USE ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bet', betRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/game', gameRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Malik.XGO API is running!', status: 'active' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }
});

app.set('io', io);

// Socket events
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  socket.on('join_game', (game) => {
    socket.join(game);
    console.log(`User ${socket.id} joined ${game}`);
  });
  
  socket.on('place_bet', (data) => {
    io.to('numcards').emit('live_bet', data);
  });
  
  socket.on('leave_game', (game) => {
    socket.leave(game);
    console.log(`User ${socket.id} left ${game}`);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Game timer
let timer = 30;
setInterval(() => {
  if (timer > 0) {
    timer--;
    io.emit('timer_update', timer);
  } else {
    const result = Math.floor(Math.random() * 10) + 1;
    io.emit('result_update', result);
    timer = 30;
    io.emit('timer_update', timer);
    io.emit('round_start', `round-${Date.now()}`);
  }
}, 1000);

// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matkaking';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('Starting server without MongoDB...');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (without MongoDB)`);
    });
  });