import express from 'express';

const app = express();
const PORT = 5001;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'test-token-123',
    user: {
      id: '1',
      uid: 'MX123456',
      name: 'Test User',
      email: req.body.email,
      wallet: 10000
    }
  });
});

app.post('/api/bet/place', (req, res) => {
  res.json({
    success: true,
    wallet: 9900,
    betId: 'bet_' + Date.now()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`📍 Test health: http://localhost:${PORT}/api/health`);
});