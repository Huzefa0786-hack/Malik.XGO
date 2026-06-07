"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BetHistory from "../components/BetHistory";
import { Bomb, Gem, Wallet, ArrowLeft, Trophy, TrendingUp, History } from "lucide-react";

const GRID_SIZE = 25;

export default function MinesPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [minesCount, setMinesCount] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [profit, setProfit] = useState(0);
  const [explodedMine, setExplodedMine] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<{ multiplier: number; profit: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/mines");
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
      const response = await axios.get("http://localhost:5000/api/bet/history?game=mines", {
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

  const generateMines = () => {
    const mines: number[] = [];
    while (mines.length < minesCount) {
      const random = Math.floor(Math.random() * GRID_SIZE);
      if (!mines.includes(random)) mines.push(random);
    }
    return mines;
  };

  const startGame = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login?redirect=/mines");
      return;
    }

    if (wallet < betAmount) {
      alert("Insufficient balance");
      return;
    }

    if (betAmount < 10) {
      alert("Minimum bet is ₹10");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/place",
        {
          game: "mines",
          amount: betAmount,
          selection: "start",
          betType: "mines",
          multiplier: multiplier
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWallet(response.data.wallet);
      setCurrentBetId(response.data.betId);
      setHistoryRefresh(prev => prev + 1);
      
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setMinePositions(generateMines());
      setRevealedTiles([]);
      setMultiplier(1);
      setProfit(0);
      setWon(false);
      setGameOver(false);
      setExplodedMine(null);
      setGameStarted(true);

    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to start game");
    }
  };

  const revealTile = async (index: number) => {
    if (revealedTiles.includes(index) || gameOver || !gameStarted) return;

    if (minePositions.includes(index)) {
      setExplodedMine(index);
      setRevealedTiles(Array.from({ length: GRID_SIZE }, (_, i) => i));
      setGameOver(true);
      setGameStarted(false);
      setWon(false);
      setStreak(0);
      
      // Update bet as loss
      const token = localStorage.getItem("token");
      if (token && currentBetId) {
        await axios.post(
          "http://localhost:5000/api/bet/cashout",
          { betId: currentBetId, winAmount: 0, result: "mine", multiplier: 0 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHistoryRefresh(prev => prev + 1);
        fetchStats(token);
      }
      return;
    }

    const updated = [...revealedTiles, index];
    setRevealedTiles(updated);

    const nextMultiplier = Number((multiplier + 0.25 + minesCount * 0.08).toFixed(2));
    setMultiplier(nextMultiplier);
    setProfit(Math.floor(betAmount * nextMultiplier));
  };

  const cashout = async () => {
    if (gameOver || revealedTiles.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token || !currentBetId) return;
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/cashout",
        { betId: currentBetId, winAmount: profit, result: "cashout", multiplier: multiplier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWallet(response.data.wallet);
      setHistoryRefresh(prev => prev + 1);
      fetchStats(token);
      
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setWon(true);
      setGameOver(true);
      setGameStarted(false);
      setStreak((prev) => prev + 1);
      setHistory((prev) => [{ multiplier, profit }, ...prev.slice(0, 9)]);

    } catch (error: any) {
      alert(error.response?.data?.error || "Cashout failed");
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWon(false);
    setExplodedMine(null);
    setMultiplier(1);
    setProfit(0);
    setRevealedTiles([]);
    setCurrentBetId(null);
  };

  const tiles = Array.from({ length: GRID_SIZE });

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <ArrowLeft />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-green-400">MINES</h1>
              <p className="text-zinc-500">Professional Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <History size={18} /> History
            </button>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3">
              <Wallet className="text-green-400" />
              <h2 className="font-black text-green-400 text-xl">₹{wallet.toLocaleString()}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-[320px_1fr_300px] gap-6">
        {/* Left Panel */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black mb-6">Game Panel</h2>
          
          <div className="bg-black rounded-2xl p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-500">Wins</span>
              <span className="text-green-400">{stats.totalWins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Losses</span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </div>
          </div>
          
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 mb-4"
            placeholder="Bet Amount"
          />
          <select
            value={minesCount}
            onChange={(e) => setMinesCount(Number(e.target.value))}
            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 mb-4"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
              <option key={count} value={count}>{count} Mines</option>
            ))}
          </select>
          <button onClick={startGame} className="w-full bg-green-500 text-black font-black rounded-2xl py-4 mb-3">
            START GAME
          </button>
          <button onClick={cashout} className="w-full bg-yellow-400 text-black font-black rounded-2xl py-4 mb-3">
            CASH OUT
          </button>
          <button onClick={resetGame} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4">
            RESET
          </button>
        </div>

        {/* Center - Game Grid */}
        <div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-black border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-500">Multiplier</p>
              <h2 className="text-green-400 text-2xl font-black">x{multiplier}</h2>
            </div>
            <div className="bg-black border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-500">Profit</p>
              <h2 className="text-yellow-400 text-2xl font-black">₹{profit.toLocaleString()}</h2>
            </div>
            <div className="bg-black border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-500">Streak</p>
              <h2 className="text-blue-400 text-2xl font-black">{streak}</h2>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <div className="mb-6 bg-black border border-zinc-800 rounded-2xl p-4 flex justify-between">
              <span>Gems: {revealedTiles.length}</span>
              <span>x{multiplier}</span>
              <span>{minesCount} Mines</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {tiles.map((_, index) => {
                const revealed = revealedTiles.includes(index);
                const exploded = explodedMine === index;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => revealTile(index)}
                    className={`aspect-square rounded-2xl border ${
                      revealed ? "bg-green-500/20 border-green-500" : "bg-zinc-900 border-zinc-800"
                    } ${exploded ? "bg-red-500/20 border-red-500" : ""}`}
                  >
                    {revealed && (minePositions.includes(index) ? <Bomb className="mx-auto text-red-500" /> : <Gem className="mx-auto text-green-400" />)}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Live Wins */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-400" /> Recent Wins
          </h2>
          <div className="space-y-3 max-h-150 overflow-y-auto">
            {history.slice(0, 10).map((item, i) => (
              <div key={i} className="bg-black border border-zinc-800 rounded-2xl p-4">
                <div className="flex justify-between">
                  <span className="text-green-400">{item.multiplier}x</span>
                  <span className="text-yellow-400">+₹{item.profit.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-zinc-500 text-center">No games yet</p>}
          </div>
        </div>
      </div>

      {/* Bet History */}
      {showHistory && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <BetHistory game="mines" refreshTrigger={historyRefresh} />
        </div>
      )}
    </main>
  );
}
