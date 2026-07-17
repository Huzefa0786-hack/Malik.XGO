import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import transactionRoutes from "./routes/transaction.js";
import adminRoutes from "./routes/admin.js";
import controlRoutes from "./routes/control.js";
import path from "path";
import { fileURLToPath } from "url";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import betRoutes from "./routes/bet.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ============ SINGLE DECLARATIONS ============
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5002;

// ============ SINGLE CORS CONFIGURATION ============
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    'https://your-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/bet", betRoutes);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    credentials: true
  }
});

app.set('io', io);

// ============ IN-MEMORY STORAGE ============
let inMemoryUsers = [];
let inMemoryBets = [];
let nextUserId = 1;
let nextBetId = 1;

const generateUID = () => {
  return "MX" + Math.floor(100000 + Math.random() * 900000);
};

const saveUserToMemory = (user) => {
  const existingIndex = inMemoryUsers.findIndex(u => u._id === user._id);
  if (existingIndex === -1) {
    inMemoryUsers.push(user);
  } else {
    inMemoryUsers[existingIndex] = user;
  }
  return user;
};

// ============ USER MODEL ============
let User;
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matkaking';
let useMongoDB = false;

const UserSchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  wallet: { type: Number, default: 700 },
  isBanned: { type: Boolean, default: false },
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now }
});

const createInMemoryUserModel = () => {
  class InMemoryUser {
    constructor(data) {
      this._id = (nextUserId++).toString();
      this.uid = data.uid || generateUID();
      this.name = data.name;
      this.email = data.email;
      this.password = data.password;
      this.wallet = data.wallet || 700;
      this.isBanned = data.isBanned || false;
      this.role = data.role || "user";
      this.createdAt = data.createdAt || new Date();
    }
    
    async save() {
      saveUserToMemory(this);
      return this;
    }
    
    static async findOne(query) {
      if (query.email) return inMemoryUsers.find(u => u.email === query.email);
      if (query.uid) return inMemoryUsers.find(u => u.uid === query.uid);
      return null;
    }
    
    static async findById(id) {
      return inMemoryUsers.find(u => u._id === id);
    }
    
    static async find() {
      return [...inMemoryUsers];
    }
    
    static async findByIdAndUpdate(id, update) {
      const index = inMemoryUsers.findIndex(u => u._id === id);
      if (index !== -1) {
        inMemoryUsers[index] = { ...inMemoryUsers[index], ...update };
        return inMemoryUsers[index];
      }
      return null;
    }
    
    static async findByIdAndDelete(id) {
      const index = inMemoryUsers.findIndex(u => u._id === id);
      if (index !== -1) {
        const deleted = inMemoryUsers[index];
        inMemoryUsers.splice(index, 1);
        return deleted;
      }
      return null;
    }
  }
  return InMemoryUser;
};

// ============ BET MODEL ============
let Bet;

const BetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userUid: { type: String },
  game: { type: String, required: true },
  betType: { type: String },
  selection: { type: String },
  amount: { type: Number, required: true },
  multiplier: { type: Number, default: 1 },
  result: { type: String },
  isWin: { type: Boolean, default: false },
  winAmount: { type: Number, default: 0 },
  roundId: { type: String },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const createInMemoryBetModel = () => {
  class InMemoryBet {
    constructor(data) {
      this._id = (nextBetId++).toString();
      this.userId = data.userId;
      this.userName = data.userName;
      this.userUid = data.userUid;
      this.game = data.game;
      this.betType = data.betType || "direct";
      this.selection = data.selection || "N/A";
      this.amount = data.amount;
      this.multiplier = data.multiplier || 1;
      this.result = data.result;
      this.isWin = data.isWin || false;
      this.winAmount = data.winAmount || 0;
      this.roundId = data.roundId || `round-${Date.now()}`;
      this.status = data.status || "pending";
      this.createdAt = data.createdAt || new Date();
    }
    
    async save() {
      inMemoryBets.push(this);
      return this;
    }
    
    static async find(query) {
      let bets = [...inMemoryBets];
      if (query.userId) bets = bets.filter(b => b.userId === query.userId);
      if (query.game) bets = bets.filter(b => b.game === query.game);
      return bets.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    static async findById(id) {
      return inMemoryBets.find(b => b._id === id);
    }
    
    static async findByIdAndUpdate(id, update) {
      const index = inMemoryBets.findIndex(b => b._id === id);
      if (index !== -1) {
        inMemoryBets[index] = { ...inMemoryBets[index], ...update };
        return inMemoryBets[index];
      }
      return null;
    }
    
    static async aggregate() {
      const bets = inMemoryBets.filter(b => b.status === "completed");
      const stats = {
        totalBets: bets.length,
        totalWins: bets.filter(b => b.isWin).length,
        totalLosses: bets.filter(b => !b.isWin).length,
        totalWonAmount: bets.reduce((sum, b) => sum + (b.winAmount || 0), 0),
        totalBetAmount: bets.reduce((sum, b) => sum + b.amount, 0)
      };
      return [stats];
    }
  }
  return InMemoryBet;
};

// ============ CONNECT TO MONGODB ============
console.log('📡 Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected successfully');
    useMongoDB = true;
    User = mongoose.models.User || mongoose.model("User", UserSchema);
    Bet = mongoose.models.Bet || mongoose.model("Bet", BetSchema);
    startServer();
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  Using in-memory storage instead');
    useMongoDB = false;
    User = createInMemoryUserModel();
    Bet = createInMemoryBetModel();
    
    const createDefaultAdmin = async () => {
      const existingAdmin = await User.findOne({ email: "admin@malikxgo.com" });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const admin = new User({
          name: "Administrator",
          email: "admin@malikxgo.com",
          password: hashedPassword,
          wallet: 0,
          role: "admin"
        });
        await admin.save();
        console.log('✅ Default admin created: admin@malikxgo.com / admin123');
      }
    };
    createDefaultAdmin();
    startServer();
  });

// ============ SINGLE HEALTH CHECK ============
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    port: PORT,
    database: useMongoDB ? "MongoDB" : "In-Memory",
    uptime: process.uptime()
  });
});

// ============ SINGLE ROOT ROUTE ============
app.get("/", (req, res) => {
  res.json({
    message: "Malik.XGO API Running",
    version: "1.0.0",
    port: PORT,
    database: useMongoDB ? "MongoDB" : "In-Memory"
  });
});

// ============ AUTH ROUTES ============
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = generateUID();
    const user = new User({
      uid, name, email, password: hashedPassword, wallet: 700, role: "user"
    });
    await user.save();
    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "30d" }
    );
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: "Account banned. Contact support." });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "30d" }
    );
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      success: true,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.put("/api/auth/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { name, email } = req.body;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: decoded.id } });
      if (existingUser) return res.status(400).json({ error: "Email already in use" });
    }
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    const user = await User.findByIdAndUpdate(decoded.id, updateData, { new: true });
    res.json({
      success: true,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        role: user.role,
        isBanned: user.isBanned
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/change-password", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "All fields required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Current password incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/users", async (req, res) => {
  try {
    const users = await User.find();
    const safeUsers = users.map(u => ({
      _id: u._id,
      uid: u.uid,
      name: u.name,
      email: u.email,
      wallet: u.wallet,
      isBanned: u.isBanned,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/ban/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ success: true, message: `User ${user.isBanned ? 'banned' : 'unbanned'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/auth/delete/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/wallet/:id", async (req, res) => {
  try {
    const { wallet } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { wallet }, { new: true });
    res.json({ success: true, wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ BET ROUTES ============
app.post("/api/bet/place", async (req, res) => {
  try {
    const { game, amount, selection, betType, multiplier, roundId } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (amount < 10) return res.status(400).json({ error: "Minimum bet is ₹10" });
    if (amount > user.wallet) return res.status(400).json({ error: "Insufficient balance" });
    user.wallet -= amount;
    await user.save();
    const bet = new Bet({
      userId: user._id,
      userName: user.name,
      userUid: user.uid,
      game,
      betType: betType || "direct",
      selection: selection || "N/A",
      amount,
      multiplier: multiplier || 1,
      roundId: roundId || `round-${Date.now()}`,
      status: "pending"
    });
    await bet.save();
    res.json({
      success: true,
      wallet: user.wallet,
      betId: bet._id,
      message: "Bet placed successfully"
    });
  } catch (err) {
    console.error("Place bet error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bet/cashout", async (req, res) => {
  try {
    const { betId, winAmount, result, multiplier } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (betId) {
      await Bet.findByIdAndUpdate(betId, {
        isWin: winAmount > 0,
        winAmount: winAmount,
        result: result,
        multiplier: multiplier || 1,
        status: "completed"
      });
    }
    if (winAmount > 0) {
      user.wallet += winAmount;
      await user.save();
    }
    res.json({
      success: true,
      wallet: user.wallet,
      winAmount: winAmount
    });
  } catch (err) {
    console.error("Cashout error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ TRANSACTION ROUTES ============
app.use("/api/transaction", transactionRoutes);

// ============ ADMIN ROUTES ============
app.use("/api/admin", adminRoutes);

// ============ CONTROL ROUTES ============
app.use("/api/control", controlRoutes);

// ============ BET HISTORY ============
app.get("/api/bet/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { game, limit = 100 } = req.query;
    let query = { userId: decoded.id };
    if (game && game !== "all") query.game = game;
    const bets = await Bet.find(query);
    const stats = await Bet.aggregate();
    res.json({
      success: true,
      bets: bets.slice(0, parseInt(limit)),
      stats: stats[0] || { totalBets: 0, totalWins: 0, totalLosses: 0, totalWonAmount: 0, totalBetAmount: 0 }
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ WALLET BALANCE ============
app.get("/api/wallet/balance", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);
    res.json({ success: true, balance: user?.wallet || 0 });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ============ SOCKET.IO GAME TIMER ============
let globalTimer = 30;
let gameStatus = "RUNNING";
let currentRoundId = `round-${Date.now()}`;
let lastResults = {
  numcards: null,
  color: null,
  number: null
};

const startGameLoop = () => {
  setInterval(() => {
    if (gameStatus === "RUNNING") {
      if (globalTimer > 0) {
        globalTimer--;
        io.emit('timer_update', globalTimer);
      } else {
        const numcardsResult = Math.floor(Math.random() * 10) + 1;
        const colors = ["GREEN", "VIOLET", "RED"];
        const colorResult = colors[Math.floor(Math.random() * colors.length)];
        const numberResult = Math.floor(Math.random() * 10);
        lastResults = { numcards: numcardsResult, color: colorResult, number: numberResult };
        io.emit('result_update', lastResults);
        currentRoundId = `round-${Date.now()}`;
        io.emit('round_start', currentRoundId);
        globalTimer = 30;
        io.emit('timer_update', globalTimer);
      }
    }
  }, 1000);
};

io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);
  socket.emit('timer_update', globalTimer);
  socket.emit('result_update', lastResults);
  socket.emit('round_start', currentRoundId);
  socket.emit('game_status', gameStatus);
  socket.on('join_game', (game) => { socket.join(game); console.log(`📱 User joined ${game}`); });
  socket.on('place_bet', (betData) => { io.to('numcards').emit('live_bet', betData); });
  socket.on('disconnect', () => { console.log('🔴 Client disconnected:', socket.id); });
});

// ============ START SERVER ============
function startServer() {
  startGameLoop();
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ========================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🚀 ========================================`);
    console.log(`📡 Socket.IO ready`);
    console.log(`💾 Database: ${useMongoDB ? 'MongoDB' : 'In-Memory'}`);
    console.log(`🕐 Game timer: ${globalTimer}s`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/api/health`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Bet: http://localhost:${PORT}/api/bet`);
    console.log(`   - Admin: http://localhost:${PORT}/api/admin`);
    console.log(`   - Control: http://localhost:${PORT}/api/control`);
    console.log(`\n🔑 Default admin credentials:`);
    console.log(`   Email: admin@malikxgo.com`);
    console.log(`   Password: admin123\n`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  io.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});