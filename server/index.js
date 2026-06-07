import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import betRoutes from "./routes/bet.js";
import gameRoutes from "./routes/game.js";
import controlRoutes from "./routes/control.js";
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_game', (game) => {
    socket.join(game);
    console.log(`User joined ${game}`);
  });
  
  socket.on('place_bet', (betData) => {
    // Broadcast to all users in the game
    io.to('numcards').emit('live_bet', betData);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Timer and result generator
let timer = 30;
setInterval(() => {
  if (timer > 0) {
    timer--;
    io.emit('timer_update', timer);
  } else {
    // Generate random result (1-10)
    const result = Math.floor(Math.random() * 10) + 1;
    io.emit('result_update', result);
    timer = 30;
    io.emit('timer_update', timer);
    io.emit('round_start', `round-${Date.now()}`);
  }
}, 1000);

// import "./jobs/colorEngine.js";

dotenv.config();
console.log("SERVER STARTING...");
console.log(process.env.MONGO_URI);

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use("/api/control", controlRoutes);

app.use("/api/game", gameRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/deposit", depositRoutes);

app.use("/api/withdraw", withdrawRoutes);

app.use("/api/bet", betRoutes);

app.get("/", (req, res) => {

  res.send("MALIK SERVER RUNNING");

});

console.log("Connecting to MongoDB...");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("MONGO ERROR:");
    console.error(err);
  });