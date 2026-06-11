import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5002;

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  const { email, password } = req.body;
  
  res.json({
    success: true,
    token: 'test-token-' + Date.now(),
    user: {
      id: '1',
      uid: 'MX' + Math.floor(100000 + Math.random() * 900000),
      name: email ? email.split('@')[0] : 'User',
      email: email || 'test@test.com',
      wallet: 10000,
      createdAt: new Date().toISOString()
    }
  });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Register request:', req.body);
  const { name, email, password } = req.body;
  
  res.json({
    success: true,
    token: 'test-token-' + Date.now(),
    user: {
      id: '1',
      uid: 'MX' + Math.floor(100000 + Math.random() * 900000),
      name: name || email.split('@')[0],
      email: email,
      wallet: 700,
      createdAt: new Date().toISOString()
    }
  });
});

// Profile endpoint
app.get('/api/auth/profile', (req, res) => {
  console.log('Profile request');
  res.json({
    success: true,
    user: {
      id: '1',
      uid: 'MX123456',
      name: 'Test User',
      email: 'test@example.com',
      wallet: 10000,
      createdAt: new Date().toISOString()
    }
  });
});

// Bet place endpoint
app.post('/api/bet/place', (req, res) => {
  console.log('Bet place:', req.body);
  const { amount } = req.body;
  
  res.json({
    success: true,
    wallet: 10000 - (amount || 100),
    betId: 'bet_' + Date.now(),
    message: 'Bet placed successfully'
  });
});

// Bet cashout endpoint
app.post('/api/bet/cashout', (req, res) => {
  console.log('Cashout:', req.body);
  const { winAmount } = req.body;
  
  res.json({
    success: true,
    wallet: 10000 + (winAmount || 0),
    message: 'Cashout successful'
  });
});

// Bet history endpoint
app.get('/api/bet/history', (req, res) => {
  console.log('History request');
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

// Wallet balance
app.get('/api/wallet/balance', (req, res) => {
  res.json({ success: true, balance: 10000 });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Malik.XGO API Running', port: PORT });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health\n`);
});