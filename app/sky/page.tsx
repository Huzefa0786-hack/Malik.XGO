"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, Wallet, Trophy, History, TrendingUp, Award } from "lucide-react";

export default function SkyGame() {
  const router = useRouter();
  const [plane, setPlane] = useState(1);
  const [flying, setFlying] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [cashedOut, setCashedOut] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0 });

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

  // Flying Logic
  useEffect(() => {
    let interval: any;

    if (flying) {
      interval = setInterval(() => {
        setPlane((prev) => {
          const crashChance = Math.random() < 0.03;
          
          if (crashChance) {
            clearInterval(interval);
            setFlying(false);
            setCrashed(true);
            
            // Update loss
            if (!cashedOut && currentBetId) {
              const token = localStorage.getItem("token");
              axios.post(
                "http://localhost:5000/api/bet/cashout",
                { betId: currentBetId, winAmount: 0, result: `crashed at ${prev}x`, multiplier: prev },
                { headers: { Authorization: `Bearer ${token}` } }
              ).then(() => {
                setHistoryRefresh(prev => prev + 1);
                fetchStats(token!);
              });
            }
            
            if (!cashedOut) {
              setLastWin(0);
            }
            return prev;
          }
          return Number((prev + 0.05).toFixed(2));
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [flying, cashedOut, currentBetId]);

  // Start Game
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

      setPlane(1);
      setFlying(true);
      setCrashed(false);
      setCashedOut(false);
      setLastWin(0);

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to start game");
    }
  };

  // Cashout
  const cashout = async () => {
    if (!flying || cashedOut || !currentBetId) return;

    const winAmount = Number(betAmount) * plane;
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/cashout",
        { betId: currentBetId, winAmount: winAmount, result: `cashed out at ${plane}x`, multiplier: plane },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWallet(response.data.wallet);
      setLastWin(winAmount);
      setCashedOut(true);
      setFlying(false);
      setHistoryRefresh(prev => prev + 1);
      fetchStats(token!);

      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Cashout failed");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Back
          </Link>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl"
          >
            <History size={18} /> History
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <p className="text-zinc-500 mb-2">Wallet</p>
            <div className="flex items-center gap-3">
              <Wallet className="text-green-400" />
              <h2 className="text-4xl font-black text-green-400">₹{wallet.toLocaleString()}</h2>
            </div>
          </div>
          <div className="bg-zinc-950 border border-yellow-500 rounded-3xl p-6">
            <p className="text-zinc-500 mb-2">Live Multiplier</p>
            <h2 className="text-5xl font-black text-yellow-400">{plane}x</h2>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <p className="text-zinc-500 mb-2">Last Win</p>
            <div className="flex items-center gap-3">
              <Trophy className="text-green-400" />
              <h2 className="text-4xl font-black text-green-400">₹{lastWin.toLocaleString()}</h2>
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <p className="text-zinc-500 mb-2">Win/Loss</p>
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-400" />
              <h2 className="text-2xl font-black">
                <span className="text-green-400">{stats.totalWins}</span>
                <span className="text-zinc-600"> / </span>
                <span className="text-red-400">{stats.totalLosses}</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Sky Animation Area */}
        <div className="relative h-96 bg-linear-to-b from-sky-950 to-black rounded-3xl border border-sky-800 overflow-hidden mb-8">
          <div className="absolute top-10 left-0 text-7xl opacity-20 animate-pulse">☁️</div>
          <div className="absolute top-24 right-10 text-8xl opacity-20 animate-bounce">☁️</div>
          <div className="absolute bottom-24 left-1/4 text-7xl opacity-10 animate-pulse">☁️</div>
          
          <svg className="absolute inset-0" width="100%" height="100%">
            <path d="M0 350 Q400 180 900 0" stroke="#22c55e" strokeWidth="4" fill="transparent" strokeDasharray="14" opacity="0.4" />
          </svg>

          <div
            className={`absolute text-8xl transition-all duration-100 ${flying ? "rotate-12" : ""}`}
            style={{
              left: `${Math.min(plane * 7, 85)}%`,
              bottom: `${Math.min(plane * 5, 80)}%`,
              filter: "drop-shadow(0px 0px 18px #facc15)",
            }}
          >
            ✈️
          </div>

          {flying && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <div className="bg-black/70 border border-yellow-500 px-10 py-5 rounded-3xl backdrop-blur">
                <h2 className="text-7xl font-black text-yellow-400 animate-pulse">{plane}x</h2>
              </div>
            </div>
          )}

          {crashed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur">
              <div className="text-center animate-pulse">
                <div className="text-9xl mb-4">💥</div>
                <h1 className="text-8xl font-black text-red-500 mb-4">CRASH</h1>
                <p className="text-3xl text-white">Flew away at {plane}x</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-4xl font-black mb-8">Sky Aviator</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <input
              type="number"
              placeholder="Bet Amount (Min ₹10)"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="bg-black border border-zinc-700 rounded-2xl px-6 py-5 outline-none text-2xl font-black"
            />
            <button
              onClick={startFlying}
              disabled={flying}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black py-5 rounded-2xl text-2xl font-black transition"
            >
              FLY 🚀
            </button>
            <button
              onClick={cashout}
              disabled={!flying || cashedOut}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 py-5 rounded-2xl text-2xl font-black transition"
            >
              CASHOUT 💰
            </button>
          </div>
          {betAmount && !flying && (
            <p className="text-center mt-4 text-zinc-500">
              Potential win: ₹{(Number(betAmount) * 10).toLocaleString()} at 10x
            </p>
          )}
        </div>
      </div>

      {/* Bet History */}
      {showHistory && (
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <BetHistory game="sky" refreshTrigger={historyRefresh} />
        </div>
      )}
    </main>
  );
}
