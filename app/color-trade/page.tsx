"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetHistory from "../components/BetHistory";
import { 
  ArrowLeft, 
  Wallet, 
  Trophy, 
  Clock, 
  Users, 
  TrendingUp,
  Crown,
  Zap,
  Award,
  Flame,
  Star,
  Gift,
  History
} from "lucide-react";

export default function ColorTradePage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [timer, setTimer] = useState(30);
  const [period, setPeriod] = useState("");
  const [selectedBet, setSelectedBet] = useState<{ type: string; value: string; multiplier: number } | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [showBetModal, setShowBetModal] = useState(false);
  const [result, setResult] = useState<{ number: number; color: string; size: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(2847);
  const [recentWins, setRecentWins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [bettingOpen, setBettingOpen] = useState(true);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [totalWinAmount, setTotalWinAmount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0 });

  // Colors and multipliers
  const colorOptions = [
    { name: "GREEN", color: "bg-green-500", hover: "hover:bg-green-600", text: "text-green-400", multiplier: 2, border: "border-green-500" },
    { name: "VIOLET", color: "bg-purple-500", hover: "hover:bg-purple-600", text: "text-purple-400", multiplier: 4.5, border: "border-purple-500" },
    { name: "RED", color: "bg-red-500", hover: "hover:bg-red-600", text: "text-red-400", multiplier: 2, border: "border-red-500" }
  ];

  const numberOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const sizeOptions = [
    { name: "BIG", range: "5-9", multiplier: 1.5, color: "bg-orange-500" },
    { name: "SMALL", range: "0-4", multiplier: 1.5, color: "bg-blue-500" }
  ];

  const quickAmounts = [10, 50, 100, 500, 1000, 5000, 10000];

  // Generate period ID
  useEffect(() => {
    const generatePeriod = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };
    setPeriod(generatePeriod());
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/color-trade");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setWallet(parsedUser.wallet || 0);
    setLoading(false);
    fetchStats(token);
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5000/api/bet/history?game=color-trade", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats({
          totalWins: response.data.stats?.totalWins || 0,
          totalLosses: response.data.stats?.totalLosses || 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Timer and game loop
  useEffect(() => {
    if (loading) return;

    let timerInterval: NodeJS.Timeout;

    const startGameLoop = () => {
      let timeLeft = 30;
      setBettingOpen(true);
      
      timerInterval = setInterval(() => {
        timeLeft--;
        setTimer(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          setBettingOpen(false);
          generateResult();
        }
      }, 1000);
    };

    startGameLoop();

    const userInterval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(userInterval);
    };
  }, [loading]);

  // Generate result
  const generateResult = async () => {
    setIsDrawing(true);
    
    setTimeout(async () => {
      const number = Math.floor(Math.random() * 10);
      let color = "GREEN";
      if (number === 0 || number === 5) {
        color = "VIOLET";
      } else if (number % 2 === 0) {
        color = "RED";
      }
      const size = number >= 5 ? "BIG" : "SMALL";
      
      setResult({ number, color, size });
      
      // Check winning bets and update wallet
      const winningBets = myBets.filter(bet => {
        if (bet.type === "color" && bet.value === color) return true;
        if (bet.type === "number" && bet.value === number.toString()) return true;
        if (bet.type === "size" && bet.value === size) return true;
        return false;
      });
      
      let totalWin = 0;
      for (const bet of winningBets) {
        const winAmount = bet.amount * bet.multiplier;
        totalWin += winAmount;
        
        // Update bet result via API
        const token = localStorage.getItem("token");
        if (token && bet.betId) {
          try {
            await axios.post(
              "http://localhost:5000/api/bet/cashout",
              { 
                betId: bet.betId, 
                winAmount: winAmount, 
                result: `${color} - ${number}`,
                multiplier: bet.multiplier 
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStats(token);
          } catch (error) {
            console.error("Cashout error:", error);
          }
        }
      }
      
      if (totalWin > 0) {
        setTotalWinAmount(totalWin);
        setWallet(prev => prev + totalWin);
        setHistoryRefresh(prev => prev + 1);
        const updatedUser = { ...user, wallet: wallet + totalWin };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setRecentWins(prev => [
          `${user?.name || "You"} won ₹${totalWin.toLocaleString()} on ${color}!`,
          ...prev.slice(0, 4)
        ]);
      }
      
      // Add to history
      setHistory(prev => [{
        period,
        number,
        size,
        color,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]);
      
      setIsDrawing(false);
      setMyBets([]);
      setCurrentBetId(null);
      
      // Reset for next round
      setTimeout(() => {
        setResult(null);
        setTimer(30);
        setBettingOpen(true);
        setPeriod(prev => {
          const newPeriod = String(Number(prev) + 1);
          return newPeriod;
        });
        setTotalWinAmount(0);
      }, 5000);
      
    }, 2000);
  };

  // Place bet
  const placeBet = async () => {
    if (!selectedBet) {
      alert("Please select a betting option!");
      return;
    }
    
    if (!betAmount || betAmount < 10) {
      alert("Minimum bet amount is ₹10");
      return;
    }
    
    if (betAmount > wallet) {
      alert("Insufficient balance!");
      return;
    }
    
    if (!bettingOpen) {
      alert("Betting is closed for this round!");
      return;
    }
    
    const token = localStorage.getItem("token");
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/place",
        {
          game: "color-trade",
          amount: betAmount,
          selection: `${selectedBet.type}:${selectedBet.value}`,
          betType: selectedBet.type,
          multiplier: selectedBet.multiplier,
          roundId: period
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setWallet(response.data.wallet);
      setHistoryRefresh(prev => prev + 1);
      
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setMyBets(prev => [{
        ...selectedBet,
        amount: betAmount,
        betId: response.data.betId,
        id: Date.now()
      }, ...prev]);
      
      setShowBetModal(false);
      setSelectedBet(null);
      setBetAmount(100);
      
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to place bet");
    }
  };

  // Quick select number
  const quickSelectNumber = (num: number) => {
    setSelectedBet({ type: "number", value: num.toString(), multiplier: 9 });
    setShowBetModal(true);
  };

  // Quick select color
  const quickSelectColor = (color: string, multiplier: number) => {
    setSelectedBet({ type: "color", value: color, multiplier });
    setShowBetModal(true);
  };

  // Quick select size
  const quickSelectSize = (size: string, multiplier: number) => {
    setSelectedBet({ type: "size", value: size, multiplier });
    setShowBetModal(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading Color Trade...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-red-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-linear-to-r from-green-500 to-green-600 p-2 rounded-xl">
              <Crown className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-green-400">Malik.XGO</h1>
              <p className="text-zinc-500 text-xs">Color Trade</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <History size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-zinc-400 text-sm hidden sm:inline">Online</span>
              <Users size={16} className="text-green-400" />
              <span className="font-bold text-green-400">{onlineUsers.toLocaleString()}</span>
            </div>
            
            <div className="bg-linear-to-r from-green-600 to-green-500 rounded-xl px-5 py-2 flex items-center gap-2">
              <Wallet size={18} className="text-black" />
              <span className="font-black text-black text-lg">₹{wallet.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pb-20">
        {/* Wallet Card */}
        <div className="bg-linear-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="text-zinc-500 text-sm">Wallet Balance</p>
              <h1 className="text-5xl font-black text-green-400">₹{wallet.toLocaleString()}</h1>
              <div className="flex gap-3 mt-2 text-sm">
                <span className="text-green-400">Wins: {stats.totalWins}</span>
                <span className="text-red-400">Losses: {stats.totalLosses}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/withdraw" className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold transition">Withdraw</Link>
              <Link href="/deposit" className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-xl font-bold transition">Deposit</Link>
            </div>
          </div>
          {totalWinAmount > 0 && (
            <div className="mt-4 bg-green-500/20 border border-green-500 rounded-xl p-3 animate-bounce">
              <p className="text-green-400 font-bold text-center">🎉 You won ₹{totalWinAmount.toLocaleString()}! 🎉</p>
            </div>
          )}
        </div>

        {/* Timer and Result Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-linear-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="text-green-400" size={24} />
                <span className="text-zinc-400">WinGo 30sec</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="text-yellow-400" size={20} />
                <span className={`text-yellow-400 font-bold ${bettingOpen ? "animate-pulse" : ""}`}>
                  {bettingOpen ? "BETTING OPEN" : "BETTING CLOSED"}
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="text-8xl font-black text-green-400 font-mono mb-2">{timer}</div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(timer / 30) * 100}%` }} />
              </div>
            </div>
            
            <p className="text-zinc-500 text-sm mt-4 font-mono">Period: {period}</p>
          </div>

          {/* Result Display */}
          <div className="bg-linear-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-yellow-400" size={24} />
              <span className="text-zinc-400">Last Result</span>
            </div>
            
            {result ? (
              <div className="text-center">
                <div className={`text-8xl font-black mb-4 ${
                  result.color === "GREEN" ? "text-green-400" : 
                  result.color === "VIOLET" ? "text-purple-400" : "text-red-400"
                }`}>
                  {result.number}
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  <span className={`px-6 py-2 rounded-xl font-bold text-lg ${
                    result.color === "GREEN" ? "bg-green-500/20 text-green-400 border border-green-500" :
                    result.color === "VIOLET" ? "bg-purple-500/20 text-purple-400 border border-purple-500" :
                    "bg-red-500/20 text-red-400 border border-red-500"
                  }`}>
                    {result.color}
                  </span>
                  <span className={`px-6 py-2 rounded-xl font-bold text-lg ${
                    result.size === "BIG" ? "bg-orange-500/20 text-orange-400 border border-orange-500" :
                    "bg-blue-500/20 text-blue-400 border border-blue-500"
                  }`}>
                    {result.size}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="text-6xl mb-4">🎲</div>
                  <p className="text-zinc-500">Waiting for result...</p>
                </div>
              </div>
            )}
            
            {isDrawing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur rounded-3xl flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin text-6xl mb-4">🎡</div>
                  <p className="text-green-400 font-bold">Drawing Result...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Bets Section */}
        {myBets.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" /> My Bets This Round
            </h2>
            <div className="space-y-2">
              {myBets.map((bet) => (
                <div key={bet.id} className="bg-black rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold capitalize">{bet.type}: {bet.value}</p>
                    <p className="text-zinc-500 text-sm">{bet.multiplier}x</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400">₹{bet.amount.toLocaleString()}</p>
                    <p className="text-green-400 text-sm">Potential: ₹{(bet.amount * bet.multiplier).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Betting Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Flame className="text-orange-400" /> Color Betting
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                onClick={() => quickSelectColor(color.name, color.multiplier)}
                disabled={!bettingOpen}
                className={`group relative overflow-hidden ${color.color} hover:${color.hover} disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl py-8 transition-all transform hover:scale-105`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <div className="relative">
                  <p className="text-white text-3xl font-black">{color.name}</p>
                  <p className="text-white/80 text-lg mt-1">{color.multiplier}x</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Number Betting Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Star className="text-yellow-400" /> Number Betting (0-9)
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {numberOptions.map((num) => (
              <button
                key={num}
                onClick={() => quickSelectNumber(num)}
                disabled={!bettingOpen}
                className={`h-16 rounded-xl text-2xl font-black transition-all transform hover:scale-105 ${
                  num % 2 === 0 ? "bg-red-500/20 border border-red-500 hover:bg-red-500/30" : "bg-green-500/20 border border-green-500 hover:bg-green-500/30"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {num}
              </button>
            ))}
          </div>
          <p className="text-center text-zinc-500 text-sm mt-4">All numbers pay 9x!</p>
        </div>

        {/* Big/Small Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Award className="text-blue-400" /> Big / Small
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {sizeOptions.map((size) => (
              <button
                key={size.name}
                onClick={() => quickSelectSize(size.name, size.multiplier)}
                disabled={!bettingOpen}
                className={`${size.color} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl py-8 transition-all transform hover:scale-105`}
              >
                <p className="text-white text-3xl font-black">{size.name}</p>
                <p className="text-white/80 text-sm mt-1">Numbers {size.range}</p>
                <p className="text-white/80 text-sm">{size.multiplier}x</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
          <h2 className="text-2xl font-black mb-4">Quick Bet Amount</h2>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                className="bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-green-500/10 py-3 rounded-xl font-bold transition"
              >
                ₹{amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Wins */}
        {recentWins.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Gift className="text-yellow-400" /> Recent Wins
            </h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentWins.map((win, index) => (
                <div key={index} className="bg-black rounded-xl p-3 text-green-400 font-bold">
                  {win}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game History */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Clock className="text-blue-400" /> Game History
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 text-zinc-500">Period</th>
                  <th className="text-left py-3 text-zinc-500">Number</th>
                  <th className="text-left py-3 text-zinc-500">Size</th>
                  <th className="text-left py-3 text-zinc-500">Color</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index} className="border-b border-zinc-800/50">
                    <td className="py-3 font-mono text-sm">{item.period}</td>
                    <td className="py-3 font-bold text-xl">{item.number}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                        item.size === "BIG" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {item.size}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                        item.color === "GREEN" ? "bg-green-500/20 text-green-400" :
                        item.color === "VIOLET" ? "bg-purple-500/20 text-purple-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {item.color}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-zinc-500">
                      No game history yet
                    </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bet History Component */}
        {showHistory && (
          <div className="mt-8">
            <BetHistory game="color-trade" refreshTrigger={historyRefresh} />
          </div>
        )}
      </div>

      {/* Bet Modal */}
      {showBetModal && selectedBet && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowBetModal(false)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-black mb-4 text-green-400">Place Bet</h2>
            <div className="bg-black border border-zinc-800 rounded-2xl p-4 mb-6">
              <p className="text-zinc-500 text-sm">Selected</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold capitalize">{selectedBet.type}: {selectedBet.value}</p>
                <p className="text-green-400 text-xl font-bold">{selectedBet.multiplier}x</p>
              </div>
            </div>
            
            <label className="block text-zinc-400 mb-2">Bet Amount (Min ₹10)</label>
            <input
              type="number"
              min="10"
              max={wallet}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 text-xl font-bold mb-4 focus:border-green-500 outline-none"
            />
            
            <div className="grid grid-cols-4 gap-2 mb-6">
              {quickAmounts.slice(0, 4).map((amount) => (
                <button key={amount} onClick={() => setBetAmount(amount)} className="bg-zinc-800 py-2 rounded-lg text-sm font-bold hover:bg-zinc-700">
                  ₹{amount}
                </button>
              ))}
            </div>
            
            {betAmount >= 10 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-6">
                <p className="text-center">
                  <span className="text-zinc-400">Potential Win: </span>
                  <span className="text-2xl font-bold text-green-400">
                    ₹{(betAmount * selectedBet.multiplier).toLocaleString()}
                  </span>
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowBetModal(false)} className="bg-zinc-800 rounded-xl py-3 font-bold">CANCEL</button>
              <button onClick={placeBet} className="bg-green-500 text-black rounded-xl py-3 font-bold">CONFIRM BET</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
