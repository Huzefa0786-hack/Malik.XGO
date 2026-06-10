"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BetHistory from "../components/BetHistory";
import { Bomb, Gem, Wallet, ArrowLeft, Trophy, TrendingUp, History, AlertTriangle } from "lucide-react";
import { useGame } from "../context/GameContext";
const GRID_SIZE = 25;

// Multiplier based on number of mines (higher mines = higher risk = higher multiplier)
const getMultiplierForMines = (minesCount: number, revealedCount: number): number => {
  // Base multipliers for different mine counts
  const baseMultipliers: Record<number, number> = {
    1: 1.5,
    2: 2.0,
    3: 2.5,
    4: 3.2,
    5: 4.0,
    6: 5.0,
    7: 6.5,
    8: 8.0,
    9: 10.0,
    10: 12.5
  };
  
  // Additional multiplier for each revealed tile (increases risk/reward)
  const revealedBonus = 1 + (revealedCount * 0.15);
  
  const baseMultiplier = baseMultipliers[minesCount] || 3.0;
  return Number((baseMultiplier * revealedBonus).toFixed(2));
};

// Win probability based on mines count
const getWinProbability = (minesCount: number, revealedCount: number): number => {
  const remainingTiles = GRID_SIZE - revealedCount;
  const minesRemaining = minesCount;
  const safeTiles = remainingTiles - minesRemaining;
  return (safeTiles / remainingTiles) * 100;
};

export default function MinesPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [minesCount, setMinesCount] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [profit, setProfit] = useState(0);
  const [explodedMine, setExplodedMine] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<{ multiplier: number; profit: number; mines: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0, totalProfit: 0 });
const { gameState, socket } = useGame();

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
          totalLosses: response.data.stats?.totalLosses || 0,
          totalProfit: response.data.stats?.totalWonAmount - response.data.stats?.totalBetAmount || 0
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

  // Update multiplier when revealed tiles change
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const newMultiplier = getMultiplierForMines(minesCount, revealedTiles.length);
      setMultiplier(newMultiplier);
      setProfit(Math.floor(betAmount * newMultiplier));
    }
  }, [revealedTiles, minesCount, gameStarted, gameOver, betAmount]);

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
          selection: `mines_${minesCount}`,
          betType: "mines",
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

      setMinePositions(generateMines());
      setRevealedTiles([]);
      setMultiplier(getMultiplierForMines(minesCount, 0));
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

    // Check if hit a mine
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
          { betId: currentBetId, winAmount: 0, result: `Hit mine on tile ${index + 1}`, multiplier: 0 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHistoryRefresh(prev => prev + 1);
        fetchStats(token);
      }
      return;
    }

    // Safe tile - add to revealed
    const updated = [...revealedTiles, index];
    setRevealedTiles(updated);
  };

  const cashout = async () => {
    if (gameOver || revealedTiles.length === 0 || !gameStarted) return;

    const token = localStorage.getItem("token");
    if (!token || !currentBetId) return;
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/cashout",
        { betId: currentBetId, winAmount: profit, result: `Cashout with ${revealedTiles.length} gems`, multiplier: multiplier },
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
      setHistory((prev) => [{ multiplier, profit, mines: minesCount }, ...prev.slice(0, 9)]);

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

  // Get risk level based on mines count
  const getRiskLevel = () => {
    if (minesCount <= 2) return { text: "LOW RISK", color: "text-green-400", bg: "bg-green-500/20" };
    if (minesCount <= 4) return { text: "MEDIUM RISK", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    if (minesCount <= 7) return { text: "HIGH RISK", color: "text-orange-400", bg: "bg-orange-500/20" };
    return { text: "EXTREME RISK", color: "text-red-400", bg: "bg-red-500/20" };
  };

  const currentWinProbability = gameStarted && !gameOver 
    ? getWinProbability(minesCount, revealedTiles.length) 
    : 0;

  const tiles = Array.from({ length: GRID_SIZE });

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  const risk = getRiskLevel();

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
            <div className="flex justify-between mb-2">
              <span className="text-zinc-500">Losses</span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Total P/L</span>
              <span className={stats.totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
                ₹{stats.totalProfit.toLocaleString()}
              </span>
            </div>
          </div>
          
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 mb-4"
            placeholder="Bet Amount"
          />
          
          <div className="mb-4">
            <label className="text-zinc-400 text-sm mb-2 block">Number of Mines</label>
            <select
              value={minesCount}
              onChange={(e) => setMinesCount(Number(e.target.value))}
              className="w-full bg-black border border-zinc-800 rounded-2xl p-4"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                <option key={count} value={count}>
                  {count} Mine{count > 1 ? "s" : ""} - {count <= 2 ? "x1.5-x2.5" : count <= 4 ? "x2.5-x4.5" : count <= 7 ? "x4.5-x8" : "x8-x15"}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Indicator */}
          <div className={`${risk.bg} rounded-2xl p-3 mb-4 text-center`}>
            <p className={`text-sm font-bold ${risk.color}`}>{risk.text}</p>
            <p className="text-xs text-zinc-500 mt-1">
              Multiplier range: {getMultiplierForMines(minesCount, 0)}x - {getMultiplierForMines(minesCount, 10)}x
            </p>
          </div>

          <button onClick={startGame} className="w-full bg-green-500 text-black font-black rounded-2xl py-4 mb-3">
            START GAME
          </button>
          <button 
            onClick={cashout} 
            disabled={!gameStarted || gameOver || revealedTiles.length === 0}
            className="w-full bg-yellow-400 text-black font-black rounded-2xl py-4 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CASH OUT (₹{profit.toLocaleString()})
          </button>
          <button onClick={resetGame} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4">
            RESET
          </button>
        </div>

        {/* Center - Game Grid */}
        <div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-center">
              <p className="text-zinc-500 text-sm">Multiplier</p>
              <h2 className="text-green-400 text-3xl font-black">x{multiplier}</h2>
            </div>
            <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-center">
              <p className="text-zinc-500 text-sm">Profit</p>
              <h2 className="text-yellow-400 text-3xl font-black">₹{profit.toLocaleString()}</h2>
            </div>
            <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-center">
              <p className="text-zinc-500 text-sm">Win Chance</p>
              <h2 className="text-blue-400 text-2xl font-black">{currentWinProbability.toFixed(1)}%</h2>
            </div>
          </div>

          {/* Win Probability Bar */}
          {gameStarted && !gameOver && (
            <div className="mb-4 bg-zinc-900 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentWinProbability}%` }}
              />
            </div>
          )}

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <div className="mb-6 bg-black border border-zinc-800 rounded-2xl p-4 flex justify-between">
              <span>💎 Gems Found: {revealedTiles.length}</span>
              <span>🎯 x{multiplier}</span>
              <span>💣 {minesCount} Mines</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {tiles.map((_, index) => {
                const revealed = revealedTiles.includes(index);
                const exploded = explodedMine === index;
                const isMine = minePositions.includes(index);
                
                // Determine if tile should be shown as danger during game over
                const showMine = gameOver && isMine && !exploded;
                
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: gameStarted && !gameOver && !revealed ? 1.05 : 1 }}
                    whileTap={{ scale: gameStarted && !gameOver && !revealed ? 0.95 : 1 }}
                    onClick={() => revealTile(index)}
                    disabled={!gameStarted || gameOver || revealed}
                    className={`aspect-square rounded-2xl border transition-all ${
                      revealed 
                        ? isMine 
                          ? "bg-red-500/20 border-red-500" 
                          : "bg-green-500/20 border-green-500"
                        : "bg-zinc-900 border-zinc-800 hover:border-green-500"
                    } ${exploded ? "bg-red-500/40 border-red-500 animate-pulse" : ""} ${
                      showMine ? "bg-red-500/10 border-red-500" : ""
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {revealed && (
                      isMine ? (
                        <Bomb className="mx-auto text-red-500" size={24} />
                      ) : (
                        <Gem className="mx-auto text-green-400" size={24} />
                      )
                    )}
                    {showMine && !revealed && (
                      <Bomb className="mx-auto text-red-500/50" size={24} />
                    )}
                    {!revealed && !showMine && gameStarted && !gameOver && (
                      <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        <Gem className="text-zinc-600" size={20} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Game Status Message */}
          {gameOver && (
            <div className={`mt-4 p-4 rounded-2xl text-center ${won ? "bg-green-500/20 border border-green-500" : "bg-red-500/20 border border-red-500"}`}>
              {won ? (
                <p className="text-green-400 font-bold">🎉 YOU CASHED OUT! Won ₹{profit.toLocaleString()} 🎉</p>
              ) : explodedMine !== null ? (
                <p className="text-red-400 font-bold">💥 GAME OVER! You hit a mine! 💥</p>
              ) : (
                <p className="text-yellow-400 font-bold">Game ended</p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Multiplier Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-400" /> Multiplier Table
          </h2>
          
          <div className="space-y-2 mb-6">
            <div className="bg-black rounded-2xl p-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Mines</span>
                <span className="text-zinc-500">Base Multiplier</span>
                <span className="text-zinc-500">Max Multiplier</span>
              </div>
            </div>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
              <div key={count} className="bg-black rounded-2xl p-3">
                <div className="flex justify-between">
                  <span className="font-bold">{count} Mine{count > 1 ? "s" : ""}</span>
                  <span className="text-green-400">{getMultiplierForMines(count, 0)}x</span>
                  <span className="text-yellow-400">{getMultiplierForMines(count, 10)}x</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-400" />
              How to Play
            </h3>
            <ul className="text-xs text-zinc-500 space-y-1">
              <li>• Select number of mines (1-10)</li>
              <li>• Higher mines = higher risk & higher multiplier</li>
              <li>• Click on tiles to reveal gems</li>
              <li>• Each gem increases your multiplier</li>
              <li>• Cash out anytime to secure your winnings</li>
              <li>• Hit a mine and you lose everything!</li>
            </ul>
          </div>

          {/* Recent Wins */}
          {history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h3 className="font-bold mb-2">Recent Wins</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.slice(0, 5).map((item, i) => (
                  <div key={i} className="bg-black rounded-xl p-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-400">{item.multiplier}x</span>
                      <span className="text-yellow-400">+₹{item.profit.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{item.mines} mines</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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