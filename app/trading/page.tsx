"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import BetHistory from "../components/BetHistory";
import { useGame } from "../context/GameContext";
import { 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CandlestickChart,
  History,
  Zap,
  Eye,
  EyeOff,
  Volume2,
  VolumeX
} from "lucide-react";

// Trading assets with their return percentages
const ASSETS = [
  { id: "EURUSD", name: "EUR/USD", symbol: "EURUSD", icon: "💶", minBet: 10, maxBet: 50000, return: 92, precision: 5, volatility: 0.0008 },
  { id: "GBPUSD", name: "GBP/USD", symbol: "GBPUSD", icon: "💷", minBet: 10, maxBet: 50000, return: 91, precision: 5, volatility: 0.0007 },
  { id: "BTCUSD", name: "BTC/USD", symbol: "BTCUSD", icon: "₿", minBet: 10, maxBet: 50000, return: 85, precision: 0, volatility: 85 },
  { id: "ETHUSD", name: "ETH/USD", symbol: "ETHUSD", icon: "⟠", minBet: 10, maxBet: 50000, return: 87, precision: 1, volatility: 8 },
  { id: "AAPL", name: "Apple", symbol: "AAPL", icon: "🍎", minBet: 10, maxBet: 50000, return: 93, precision: 2, volatility: 0.8 },
  { id: "GOOGL", name: "Google", symbol: "GOOGL", icon: "🔍", minBet: 10, maxBet: 50000, return: 92, precision: 2, volatility: 0.9 },
  { id: "TSLA", name: "Tesla", symbol: "TSLA", icon: "🚗", minBet: 10, maxBet: 50000, return: 88, precision: 2, volatility: 1.2 },
  { id: "NVDA", name: "NVIDIA", symbol: "NVDA", icon: "🎮", minBet: 10, maxBet: 50000, return: 89, precision: 2, volatility: 1.1 }
];

// Expiry times
const EXPIRY_TIMES = [
  { label: "30 Sec", seconds: 30, color: "bg-purple-500" },
  { label: "1 Min", seconds: 60, color: "bg-blue-500" },
  { label: "2 Min", seconds: 120, color: "bg-cyan-500" },
  { label: "5 Min", seconds: 300, color: "bg-teal-500" },
  { label: "15 Min", seconds: 900, color: "bg-green-500" },
  { label: "30 Min", seconds: 1800, color: "bg-yellow-500" },
  { label: "1 Hour", seconds: 3600, color: "bg-orange-500" },
  { label: "4 Hours", seconds: 14400, color: "bg-red-500" }
];

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type ActiveTrade = {
  id: string;
  asset: string;
  assetId: string;
  amount: number;
  direction: "CALL" | "PUT";
  expirySeconds: number;
  entryPrice: number;
  expiryTime: number;
  betId: string;
  returnPercent: number;
};

type CompletedTrade = {
  id: string;
  asset: string;
  amount: number;
  direction: "CALL" | "PUT";
  result: "WIN" | "LOSS";
  profit: number;
  time: string;
};

export default function QuotexPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_TIMES[2]);
  const [currentPrice, setCurrentPrice] = useState(1.09250);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [completedTrades, setCompletedTrades] = useState<CompletedTrade[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [countdowns, setCountdowns] = useState<Map<string, number>>(new Map());
  const [showBalance, setShowBalance] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0, totalTrades: 0 });
  const [chartDirection, setChartDirection] = useState<"UP" | "DOWN" | "RANDOM">("RANDOM");
  const [currentTradeDirection, setCurrentTradeDirection] = useState<"CALL" | "PUT" | null>(null);
  const { gameState, socket } = useGame();
  
  const chartIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tradeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/quotex");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setWallet(parsedUser.wallet || 0);
    setLoading(false);
    fetchStats(token);
    initializeChart();
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5002/api/bet/history?game=quotex", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats({
          totalWins: response.data.stats?.totalWins || 0,
          totalLosses: response.data.stats?.totalLosses || 0,
          totalTrades: (response.data.stats?.totalWins || 0) + (response.data.stats?.totalLosses || 0)
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Initialize chart with random data
  const initializeChart = () => {
    const now = Date.now();
    const newCandles: Candle[] = [];
    let basePrice = selectedAsset.id.includes("BTC") ? 65000 : selectedAsset.id.includes("ETH") ? 3500 : 1.09250;
    
    // Generate 100 candles of random historical data
    for (let i = 100; i >= 0; i--) {
      const change = (Math.random() - 0.5) * selectedAsset.volatility * 0.5;
      const open = basePrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * selectedAsset.volatility * 0.3;
      const low = Math.min(open, close) - Math.random() * selectedAsset.volatility * 0.3;
      
      newCandles.push({
        time: now - i * 60000,
        open,
        high,
        low,
        close
      });
      
      basePrice = close;
    }
    
    setCandles(newCandles);
    setCurrentPrice(basePrice);
  };

  // Draw candlestick chart on canvas
  const drawChart = useCallback(() => {
    if (!chartCanvasRef.current || candles.length === 0) return;
    
    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    
    // Get visible candles (last 60)
    const visibleCandles = candles.slice(-60);
    if (visibleCandles.length === 0) return;
    
    // Calculate price range
    const maxPrice = Math.max(...visibleCandles.map(c => c.high), currentPrice);
    const minPrice = Math.min(...visibleCandles.map(c => c.low), currentPrice);
    const priceRange = maxPrice - minPrice;
    if (priceRange === 0) return;
    
    const candleWidth = width / visibleCandles.length;
    
    // Draw grid
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw each candle
    visibleCandles.forEach((candle, index) => {
      const x = index * candleWidth;
      const centerX = x + candleWidth / 2;
      
      // Calculate positions
      const highY = ((maxPrice - candle.high) / priceRange) * height;
      const lowY = ((maxPrice - candle.low) / priceRange) * height;
      const openY = ((maxPrice - candle.open) / priceRange) * height;
      const closeY = ((maxPrice - candle.close) / priceRange) * height;
      
      const isGreen = candle.close >= candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);
      
      // Draw wick (high-low line)
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.strokeStyle = isGreen ? "#22c55e" : "#ef4444";
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = isGreen ? "#22c55e" : "#ef4444";
      ctx.fillRect(centerX - candleWidth * 0.3, bodyTop, candleWidth * 0.6, bodyHeight);
    });
    
    // Draw current price line
    const currentPriceY = ((maxPrice - currentPrice) / priceRange) * height;
    ctx.beginPath();
    ctx.moveTo(0, currentPriceY);
    ctx.lineTo(width, currentPriceY);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw price labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px monospace";
    ctx.fillText(formatPrice(maxPrice), width - 50, 15);
    ctx.fillText(formatPrice(minPrice), width - 50, height - 5);
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(formatPrice(currentPrice), width - 50, currentPriceY - 5);
    
  }, [candles, currentPrice, selectedAsset]);

  // Update chart based on active trades - 70% LOSS PROBABILITY
  const updatePrice = useCallback(() => {
    // Check if there's an active trade
    const controllingTrade = activeTrades[0]; // First trade controls the chart

    let change = 0;
    let newDirection: "UP" | "DOWN" | "RANDOM" = "RANDOM";

    if (controllingTrade) {
      // 70% chance to go AGAINST the user's prediction (LOSS)
      // 30% chance to go WITH the user's prediction (WIN)
      const randomChance = Math.random() * 100;
      const isLoss = randomChance <= 70; // 70% loss chance
      
      if (controllingTrade.direction === "CALL") {
        if (isLoss) {
          // 70% - Chart goes DOWN (User loses)
          change = -Math.random() * selectedAsset.volatility * 0.8;
          newDirection = "DOWN";
        } else {
          // 30% - Chart goes UP (User wins)
          change = Math.random() * selectedAsset.volatility * 0.8;
          newDirection = "UP";
        }
      } else { // PUT
        if (isLoss) {
          // 70% - Chart goes UP (User loses)
          change = Math.random() * selectedAsset.volatility * 0.8;
          newDirection = "UP";
        } else {
          // 30% - Chart goes DOWN (User wins)
          change = -Math.random() * selectedAsset.volatility * 0.8;
          newDirection = "DOWN";
        }
      }
      setChartDirection(newDirection);
    } else {
      // Random movement when no active trade
      change = (Math.random() - 0.5) * selectedAsset.volatility * 0.3;
      newDirection = change > 0 ? "UP" : "DOWN";
      setChartDirection("RANDOM");
    }

    const newPrice = currentPrice + change;
    setCurrentPrice(newPrice);
    
    // Update candles
    setCandles(prev => {
      const updated = [...prev];
      if (updated.length === 0) return prev;
      
      const lastCandle = updated[updated.length - 1];
      const now = Date.now();
      
      if (now - lastCandle.time >= 60000) {
        // Create new candle
        const newCandle: Candle = {
          time: now,
          open: lastCandle.close,
          high: lastCandle.close,
          low: lastCandle.close,
          close: newPrice
        };
        updated.push(newCandle);
        if (updated.length > 200) updated.shift();
      } else {
        // Update current candle
        lastCandle.close = newPrice;
        lastCandle.high = Math.max(lastCandle.high, newPrice);
        lastCandle.low = Math.min(lastCandle.low, newPrice);
      }
      
      return updated;
    });
  }, [currentPrice, selectedAsset, activeTrades]);

  // Start price updates
  useEffect(() => {
    chartIntervalRef.current = setInterval(updatePrice, 1000);
    tradeIntervalRef.current = setInterval(checkExpiredTrades, 1000);
    
    return () => {
      if (chartIntervalRef.current) clearInterval(chartIntervalRef.current);
      if (tradeIntervalRef.current) clearInterval(tradeIntervalRef.current);
    };
  }, [updatePrice]);

  // Redraw chart when candles change
  useEffect(() => {
    drawChart();
  }, [candles, currentPrice, drawChart]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

  // Update countdowns
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdowns(prev => {
        const newMap = new Map();
        prev.forEach((value, key) => {
          if (value > 0) {
            newMap.set(key, value - 1);
          }
        });
        return newMap;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, []);

  // Determine if trade wins based on final price movement
  const checkTradeResult = (trade: ActiveTrade): boolean => {
    // Get the price movement during the trade
    // We need to check if the price moved in the user's favor
    // Since the chart already moved with 70% loss probability, we can check final direction
    const priceIncreased = currentPrice > trade.entryPrice;
    
    if (trade.direction === "CALL") {
      return priceIncreased;
    } else {
      return !priceIncreased;
    }
  };

  const checkExpiredTrades = async () => {
    const now = Date.now();
    const expired = activeTrades.filter(trade => trade.expiryTime <= now);
    
    if (expired.length === 0) return;
    
    for (const trade of expired) {
      const isWin = checkTradeResult(trade);
      const payoutPercent = trade.returnPercent / 100;
      const payout = isWin ? trade.amount * (1 + payoutPercent) : 0;
      const profit = payout - trade.amount;
      
      const token = localStorage.getItem("token");
      if (token && trade.betId) {
        try {
          await axios.post(
            "http://localhost:5002/api/bet/cashout",
            { 
              betId: trade.betId, 
              winAmount: payout, 
              result: isWin ? "WIN" : "LOSS", 
              multiplier: 1 + payoutPercent
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setWallet(prev => prev + profit);
          setTotalProfit(prev => prev + profit);
          setStats(prev => ({
            ...prev,
            totalWins: prev.totalWins + (isWin ? 1 : 0),
            totalLosses: prev.totalLosses + (isWin ? 0 : 1),
            totalTrades: prev.totalTrades + 1
          }));
          
          if (isWin) {
            setWinStreak(prev => prev + 1);
            if (soundEnabled) console.log("🎉 WIN! 🎉");
          } else {
            setWinStreak(0);
            if (soundEnabled) console.log("😢 LOSS 😢");
          }
          
          setHistoryRefresh(prev => prev + 1);
          
          const updatedUser = { ...user, wallet: wallet + profit };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (error) {
          console.error("Failed to settle trade:", error);
        }
      }
      
      setCompletedTrades(prev => [{
        id: trade.id,
        asset: trade.asset,
        amount: trade.amount,
        direction: trade.direction,
        result: isWin ? "WIN" : "LOSS",
        profit: profit,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 49)]);
      
      setCountdowns(prev => {
        const newMap = new Map(prev);
        newMap.delete(trade.id);
        return newMap;
      });
    }
    
    setActiveTrades(prev => prev.filter(trade => trade.expiryTime > now));
    setCurrentTradeDirection(null);
  };

  const placeTrade = async (direction: "CALL" | "PUT") => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login?redirect=/quotex");
      return;
    }

    if (betAmount < selectedAsset.minBet) {
      alert(`Minimum trade for ${selectedAsset.name} is ₹${selectedAsset.minBet}`);
      return;
    }

    if (betAmount > wallet) {
      alert("Insufficient balance!");
      return;
    }

    if (betAmount > selectedAsset.maxBet) {
      alert(`Maximum trade for ${selectedAsset.name} is ₹${selectedAsset.maxBet}`);
      return;
    }

    setIsPlacingBet(true);
    setCurrentTradeDirection(direction);

    try {
      const response = await axios.post(
        "http://localhost:5002/api/bet/place",
        {
          game: "quotex",
          amount: betAmount,
          selection: `${selectedAsset.id}:${direction}`,
          betType: direction.toLowerCase(),
          multiplier: 1 + (selectedAsset.return / 100),
          roundId: `trade_${Date.now()}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWallet(response.data.wallet);
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      const newTrade: ActiveTrade = {
        id: Date.now().toString(),
        asset: selectedAsset.name,
        assetId: selectedAsset.id,
        amount: betAmount,
        direction: direction,
        expirySeconds: selectedExpiry.seconds,
        entryPrice: currentPrice,
        expiryTime: Date.now() + selectedExpiry.seconds * 1000,
        betId: response.data.betId,
        returnPercent: selectedAsset.return
      };

      setActiveTrades(prev => [...prev, newTrade]);
      setCountdowns(prev => new Map(prev).set(newTrade.id, selectedExpiry.seconds));

      // Show probability message
      alert(`${direction} placed! 70% chance of loss, 30% chance of win. Good luck!`);

    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to place trade");
    } finally {
      setIsPlacingBet(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(selectedAsset.precision);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const quickAmounts = [100, 500, 1000, 5000, 10000, 25000];

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading Trading Platform...</p>
        </div>
      </main>
    );
  }

  const winRate = stats.totalTrades > 0 ? (stats.totalWins / stats.totalTrades) * 100 : 0;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-black text-green-400">XGOTRADING</h1>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded animate-pulse">LIVE</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBalance(!showBalance)} className="p-2 rounded-lg hover:bg-zinc-800">
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-lg hover:bg-zinc-800">
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <div className="bg-zinc-900 rounded-xl px-4 py-2">
              <p className="text-xs text-zinc-500">Balance</p>
              <p className="font-bold text-green-400">₹{showBalance ? wallet.toLocaleString() : "****"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto p-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Today's P/L</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}₹{totalProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Win Streak</p>
            <p className="text-lg font-bold text-orange-400">{winStreak}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Win Rate</p>
            <p className="text-lg font-bold text-blue-400">{winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Wins/Losses</p>
            <p className="text-lg font-bold">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Active Trades</p>
            <p className="text-lg font-bold text-purple-400">{activeTrades.length}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Total Trades</p>
            <p className="text-lg font-bold">{stats.totalTrades}</p>
          </div>
        </div>

        {/* Probability Indicator */}
        <div className="mb-4 p-3 bg-linear-to-r from-red-600/20 to-green-600/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-red-600 rounded-full overflow-hidden">
                <div className="w-[70%] h-full bg-red-500"></div>
              </div>
              <span className="text-xs text-red-400">70% LOSS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-green-600 rounded-full overflow-hidden">
                <div className="w-[30%] h-full bg-green-500"></div>
              </div>
              <span className="text-xs text-green-400">30% WIN</span>
            </div>
          </div>
          <p className="text-center text-xs text-zinc-500 mt-2">
            {activeTrades.length > 0 ? 
              `📊 Chart moving ${chartDirection === "UP" ? "📈 UP" : "📉 DOWN"} - ${activeTrades[0]?.direction === "CALL" ? 
                (chartDirection === "UP" ? "✅ WINNING" : "❌ LOSING") : 
                (chartDirection === "DOWN" ? "✅ WINNING" : "❌ LOSING")}` : 
              "📊 No active trades - random movement"}
          </p>
        </div>

        {/* Chart Direction Indicator */}
        <div className="mb-4 p-3 bg-zinc-900 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CandlestickChart className="text-green-400" size={18} />
            <span className="text-sm">Chart Direction</span>
            <span className={`font-bold px-3 py-1 rounded-lg text-sm ${
              chartDirection === "UP" ? "bg-green-500/20 text-green-400" : 
              chartDirection === "DOWN" ? "bg-red-500/20 text-red-400" : 
              "bg-yellow-500/20 text-yellow-400"
            }`}>
              {chartDirection === "UP" ? "📈 UPTREND" : chartDirection === "DOWN" ? "📉 DOWNTREND" : "🎲 RANDOM"}
            </span>
          </div>
          <div className="text-xs text-zinc-500">
            {activeTrades.length > 0 ? `${activeTrades.length} active trade(s) controlling chart` : "No active trades - random movement"}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left - Asset List */}
          <div className="lg:col-span-2 bg-zinc-900 rounded-xl p-3">
            <h3 className="text-sm font-bold mb-3 text-zinc-400">ASSETS</h3>
            <div className="space-y-1 max-h-150 overflow-y-auto">
              {ASSETS.map((asset) => {
                const isSelected = selectedAsset.id === asset.id;
                return (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      initializeChart();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                      isSelected
                        ? "bg-green-500/20 border-l-2 border-green-500"
                        : "hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-xl">{asset.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{asset.name}</p>
                      <p className="text-xs text-zinc-500">{formatPrice(currentPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-400">{asset.return}%</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center - Chart Area */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900 rounded-xl p-4">
              {/* Chart Header */}
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black">{formatPrice(currentPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Candlestick Chart Canvas */}
              <div className="h-96 w-full bg-black rounded-lg overflow-hidden">
                <canvas 
                  ref={chartCanvasRef}
                  className="w-full h-full"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              {/* Chart Legend */}
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <span className="text-zinc-500">Bullish Candle</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                  <span className="text-zinc-500">Bearish Candle</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-yellow-500"></div>
                  <span className="text-zinc-500">Current Price</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Trading Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Amount Panel */}
            <div className="bg-zinc-900 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3">TRADE AMOUNT</h3>
              <input
                type="number"
                min={selectedAsset.minBet}
                max={Math.min(selectedAsset.maxBet, wallet)}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-xl font-bold text-center focus:border-green-500 outline-none"
              />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="bg-zinc-800 py-1.5 rounded-lg text-sm hover:bg-zinc-700 transition"
                  >
                    ₹{amount.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-3 text-xs text-zinc-500">
                <span>Min: ₹{selectedAsset.minBet}</span>
                <span>Max: ₹{Math.min(selectedAsset.maxBet, wallet).toLocaleString()}</span>
              </div>
            </div>

            {/* Expiry Panel */}
            <div className="bg-zinc-900 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Clock size={14} /> EXPIRY TIME
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {EXPIRY_TIMES.map((exp) => (
                  <button
                    key={exp.seconds}
                    onClick={() => setSelectedExpiry(exp)}
                    className={`py-2 rounded-lg text-sm font-bold transition ${
                      selectedExpiry.seconds === exp.seconds
                        ? `${exp.color} text-white`
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Return Display */}
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-xs text-zinc-400">Return on Win</p>
              <p className="text-2xl font-bold text-green-400">{selectedAsset.return}%</p>
              <p className="text-xs text-zinc-500">Win ₹{(betAmount * selectedAsset.return / 100).toLocaleString()}</p>
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => placeTrade("CALL")}
                disabled={isPlacingBet || betAmount > wallet}
                className="bg-linear-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed py-5 rounded-xl font-black text-lg transition-all transform hover:scale-105"
              >
                <TrendingUp size={24} className="mx-auto mb-1" />
                CALL
                <span className="block text-xs font-normal">Price goes UP (30% win)</span>
              </button>
              <button
                onClick={() => placeTrade("PUT")}
                disabled={isPlacingBet || betAmount > wallet}
                className="bg-linear-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-5 rounded-xl font-black text-lg transition-all transform hover:scale-105"
              >
                <TrendingDown size={24} className="mx-auto mb-1" />
                PUT
                <span className="block text-xs font-normal">Price goes DOWN (30% win)</span>
              </button>
            </div>

            {/* Win Probability Info */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
              <p className="text-xs text-red-400">⚠️ 70% Chance of Loss</p>
              <p className="text-xs text-zinc-500 mt-1">Only 30% chance to win</p>
            </div>

            {/* Potential Payout */}
            {betAmount >= selectedAsset.minBet && (
              <div className="bg-linear-to-r from-green-500/10 to-green-500/5 border border-green-500/30 rounded-xl p-3 text-center">
                <p className="text-xs text-zinc-400">Potential Payout</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{(betAmount + (betAmount * selectedAsset.return / 100)).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">
                  +{selectedAsset.return}% profit (₹{(betAmount * selectedAsset.return / 100).toLocaleString()})
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Trades Section */}
        {activeTrades.length > 0 && (
          <div className="mt-6 bg-zinc-900 rounded-xl p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Zap className="text-yellow-400" size={16} />
              ACTIVE TRADES ({activeTrades.length})
            </h3>
            <div className="space-y-2">
              {activeTrades.map((trade) => {
                const timeLeft = countdowns.get(trade.id) || 0;
                const progress = (timeLeft / trade.expirySeconds) * 100;
                return (
                  <div key={trade.id} className="bg-black rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-bold">{trade.asset}</span>
                        <span className={`ml-2 text-sm font-bold ${trade.direction === "CALL" ? "text-green-400" : "text-red-400"}`}>
                          {trade.direction} ₹{trade.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-400 font-mono text-sm">{formatTime(timeLeft)}</span>
                        <span className="text-xs text-green-400 ml-2">+{trade.returnPercent}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all ${trade.direction === "CALL" ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Entry: {formatPrice(trade.entryPrice)} | Current: {formatPrice(currentPrice)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Trades */}
        {completedTrades.length > 0 && (
          <div className="mt-6 bg-zinc-900 rounded-xl p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <History size={16} className="text-blue-400" />
              RECENT TRADES
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {completedTrades.slice(0, 20).map((trade, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-zinc-800">
                  <div>
                    <span className="font-bold">{trade.asset}</span>
                    <span className={`ml-2 ${trade.direction === "CALL" ? "text-green-400" : "text-red-400"}`}>
                      {trade.direction}
                    </span>
                  </div>
                  <div>₹{trade.amount.toLocaleString()}</div>
                  <div className={trade.result === "WIN" ? "text-green-400 font-bold" : "text-red-400"}>
                    {trade.result === "WIN" ? `+₹${trade.profit.toLocaleString()}` : `-₹${Math.abs(trade.profit).toLocaleString()}`}
                  </div>
                  <div className="text-xs text-zinc-500">{trade.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bet History */}
        {showHistory && (
          <div className="mt-6">
            <BetHistory game="quotex" refreshTrigger={historyRefresh} />
          </div>
        )}
      </div>
    </main>
  );
}