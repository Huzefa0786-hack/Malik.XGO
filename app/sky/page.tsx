"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, Wallet, Trophy, History, TrendingUp, Users, Zap } from "lucide-react";
import { useGame } from "../context/GameContext";

export default function SkyGame() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [betAmount, setBetAmount] = useState("");
  const [lastWin, setLastWin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [isCrashed, setIsCrashed] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [liveUsers, setLiveUsers] = useState(1247);
  const [recentWins, setRecentWins] = useState<{ user: string; amount: number; multiplier: number }[]>([]);
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const { gameState, socket } = useGame();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/sky");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setWallet(parsedUser.wallet || 0);
    setLoading(false);
    fetchStats(token);
    
    // Simulate live users
    const userInterval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);
    
    return () => clearInterval(userInterval);
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5000/api/bet/history?game=sky", {
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

  const startFlying = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login?redirect=/sky");
      return;
    }

    if (!betAmount || Number(betAmount) < 10) {
      alert("Minimum bet amount is ₹10");
      return;
    }

    if (Number(betAmount) > wallet) {
      alert("Insufficient balance");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/place",
        {
          game: "sky",
          amount: Number(betAmount),
          selection: "fly",
          betType: "aviator",
          multiplier: 1
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWallet(response.data.wallet);
      setCurrentBetId(response.data.betId);
      setHistoryRefresh(prev => prev + 1);
      
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setIsPlaying(true);
      setIsCrashed(false);
      setHasCashedOut(false);
      setCurrentMultiplier(1);
      
      startMultiplierAnimation();

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to start game");
    }
  };

  const startMultiplierAnimation = () => {
    let multiplier = 1;
    const crashPoint = 1 + Math.random() * 19; // Random crash between 1x and 20x
    
    animationRef.current = setInterval(() => {
      multiplier += 0.01;
      setCurrentMultiplier(Number(multiplier.toFixed(2)));
      
      if (multiplier >= crashPoint) {
        crash();
      }
    }, 50);
  };

  const crash = async () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    setIsCrashed(true);
    setIsPlaying(false);
    
    if (!hasCashedOut && currentBetId) {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/bet/cashout",
        { betId: currentBetId, winAmount: 0, result: `crashed at ${currentMultiplier}x`, multiplier: currentMultiplier },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistoryRefresh(prev => prev + 1);
      fetchStats(token!);
      setLastWin(0);
    }
    
    setTimeout(() => {
      setIsCrashed(false);
      setCurrentMultiplier(1);
      setCurrentBetId(null);
    }, 3000);
  };

  const cashout = async () => {
    if (!isPlaying || hasCashedOut || !currentBetId) return;

    const winAmount = Number(betAmount) * currentMultiplier;
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/cashout",
        { betId: currentBetId, winAmount: winAmount, result: `cashed out at ${currentMultiplier}x`, multiplier: currentMultiplier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWallet(response.data.wallet);
      setLastWin(winAmount);
      setHasCashedOut(true);
      setIsPlaying(false);
      setHistoryRefresh(prev => prev + 1);
      fetchStats(token!);
      
      // Add to recent wins
      setRecentWins(prev => [{
        user: user?.name || "You",
        amount: winAmount,
        multiplier: currentMultiplier
      }, ...prev.slice(0, 9)]);

      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      
      alert(`🎉 You cashed out at ${currentMultiplier}x and won ₹${winAmount.toLocaleString()}! 🎉`);

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Cashout failed");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Back
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl">
              <Users size={16} className="text-green-400" />
              <span className="text-sm">{liveUsers.toLocaleString()} online</span>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-700"
            >
              <History size={18} /> History
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-linear-to-r from-zinc-900 to-black border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm">Wallet Balance</p>
            <div className="flex items-center gap-2">
              <Wallet className="text-green-400" size={20} />
              <h2 className="text-3xl font-black text-green-400">₹{wallet.toLocaleString()}</h2>
            </div>
          </div>
          <div className="bg-linear-to-r from-yellow-900/20 to-black border border-yellow-500/30 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm">Live Multiplier</p>
            <div className="flex items-center gap-2">
              <Zap className="text-yellow-400" size={20} />
              <h2 className={`text-5xl font-black ${isPlaying && !hasCashedOut ? "text-yellow-400 animate-pulse" : "text-yellow-400"}`}>
                {currentMultiplier.toFixed(2)}x
              </h2>
            </div>
          </div>
          <div className="bg-linear-to-r from-green-900/20 to-black border border-green-500/30 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm">Last Win</p>
            <div className="flex items-center gap-2">
              <Trophy className="text-green-400" size={20} />
              <h2 className="text-3xl font-black text-green-400">₹{lastWin.toLocaleString()}</h2>
            </div>
          </div>
          <div className="bg-linear-to-r from-blue-900/20 to-black border border-blue-500/30 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm">Win/Loss</p>
            <h2 className="text-2xl font-black">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600"> / </span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </h2>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="relative h-125 bg-linear-to-b from-sky-950 via-black to-black rounded-3xl border border-sky-800 overflow-hidden mb-8">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 text-8xl opacity-10 animate-pulse">☁️</div>
            <div className="absolute top-32 right-20 text-7xl opacity-10 animate-bounce">☁️</div>
            <div className="absolute bottom-32 left-1/3 text-8xl opacity-5 animate-pulse">☁️</div>
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
          </div>

          {/* Flight Path */}
          <svg className="absolute inset-0 w-full h-full">
            <path 
              d="M0 450 Q200 300 400 200 Q600 100 800 50 Q1000 0 1200 -50" 
              stroke="#22c55e" 
              strokeWidth="3" 
              fill="transparent" 
              strokeDasharray="10"
              opacity="0.3"
            />
            <path 
              d="M0 450 Q200 300 400 200 Q600 100 800 50 Q1000 0 1200 -50" 
              stroke="#facc15" 
              strokeWidth="2" 
              fill="transparent" 
              strokeDasharray="5 15"
              opacity="0.5"
            />
          </svg>

          {/* Plane */}
          <div
            className={`absolute text-7xl transition-all duration-50 ${isPlaying && !hasCashedOut ? "animate-pulse" : ""}`}
            style={{
              left: `${Math.min(currentMultiplier * 6, 85)}%`,
              bottom: `${Math.min(currentMultiplier * 4 + 20, 80)}%`,
              filter: "drop-shadow(0 0 20px rgba(250,204,21,0.5))",
              transform: `rotate(${Math.min(currentMultiplier * 5, 45)}deg)`
            }}
          >
            ✈️
          </div>

          {/* Engine Trail */}
          {isPlaying && !hasCashedOut && (
            <div
              className="absolute text-3xl"
              style={{
                left: `${Math.min(currentMultiplier * 6 - 3, 82)}%`,
                bottom: `${Math.min(currentMultiplier * 4 + 18, 78)}%`,
              }}
            >
              🔥
            </div>
          )}

          {/* Multiplier Display */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
            <div className={`bg-black/80 backdrop-blur border-2 ${isPlaying && !hasCashedOut ? "border-yellow-500 animate-pulse" : "border-yellow-500/50"} rounded-2xl px-12 py-6 text-center`}>
              <p className="text-zinc-400 text-sm mb-1">Current Multiplier</p>
              <h1 className={`text-7xl font-black ${isPlaying && !hasCashedOut ? "text-yellow-400" : "text-yellow-500"}`}>
                {currentMultiplier.toFixed(2)}x
              </h1>
              {isPlaying && !hasCashedOut && (
                <p className="text-green-400 text-sm mt-2">Potential Win: ₹{(Number(betAmount) * currentMultiplier).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Crash Effect */}
          {isCrashed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur z-20 animate-pulse">
              <div className="text-center">
                <div className="text-9xl mb-4 animate-bounce">💥</div>
                <h1 className="text-8xl font-black text-red-500 mb-4">CRASH!</h1>
                <p className="text-3xl text-white">Crashed at {currentMultiplier.toFixed(2)}x</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-8 bg-green-500 text-black px-8 py-3 rounded-2xl font-bold text-xl hover:bg-green-600 transition"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}

          {/* Bottom Glow */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-green-500/10 to-transparent" />
        </div>

        {/* Recent Wins Ticker */}
        <div className="bg-zinc-900/50 rounded-xl p-3 mb-6 overflow-hidden">
          <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
            {recentWins.map((win, i) => (
              <span key={i} className="text-sm">
                🎉 {win.user} cashed out at {win.multiplier.toFixed(2)}x and won ₹{win.amount.toLocaleString()}!
              </span>
            ))}
            {recentWins.length === 0 && (
              <span className="text-sm text-zinc-500">Waiting for players...</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-3xl font-black mb-6">Sky Aviator</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <input
              type="number"
              placeholder="Bet Amount (Min ₹10)"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isPlaying}
              className="bg-black border border-zinc-700 rounded-2xl px-6 py-5 outline-none text-2xl font-black disabled:opacity-50"
            />
            <button
              onClick={startFlying}
              disabled={isPlaying}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black py-5 rounded-2xl text-2xl font-black transition transform hover:scale-105"
            >
              {isPlaying ? "FLYING..." : "FLY 🚀"}
            </button>
            <button
              onClick={cashout}
              disabled={!isPlaying || hasCashedOut}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 py-5 rounded-2xl text-2xl font-black transition transform hover:scale-105"
            >
              CASHOUT 💰
            </button>
          </div>
          {betAmount && !isPlaying && (
            <div className="mt-6 p-4 bg-linear-to-r from-green-500/10 to-yellow-500/10 rounded-2xl text-center">
              <p className="text-zinc-400">Potential win at 10x: <span className="text-green-400 font-bold text-xl">₹{(Number(betAmount) * 10).toLocaleString()}</span></p>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-sm">How to Play</p>
            <p className="text-sm">Place a bet, watch the multiplier grow, cash out before the plane crashes!</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-sm">Max Multiplier</p>
            <p className="text-2xl font-bold text-yellow-400">Up to 20x</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-sm">House Edge</p>
            <p className="text-2xl font-bold text-blue-400">5%</p>
          </div>
        </div>
      </div>

      {/* Bet History */}
      {showHistory && (
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <BetHistory game="sky" refreshTrigger={historyRefresh} />
        </div>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </main>
  );
}