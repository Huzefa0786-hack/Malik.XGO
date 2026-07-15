"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import { socket } from "../lib/socket";
import BetHistory from "../components/BetHistory";
import { Bomb, Gem, Wallet, ArrowLeft, Trophy, TrendingUp, History } from "lucide-react";

const GRID_SIZE = 25;

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
    fetchWallet();
  }, [router]);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet/balance");
      if (res.data.success) {
        setWallet(res.data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  };

  const getMultiplierForMines = (mines: number, revealed: number): number => {
    const baseMultipliers: Record<number, number> = {
      1: 1.5, 2: 2.0, 3: 2.5, 4: 3.2, 5: 4.0,
      6: 5.0, 7: 6.5, 8: 8.0, 9: 10.0, 10: 12.5
    };
    const revealedBonus = 1 + (revealed * 0.15);
    const baseMultiplier = baseMultipliers[mines] || 3.0;
    return Number((baseMultiplier * revealedBonus).toFixed(2));
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
    if (wallet < betAmount) {
      alert("Insufficient balance");
      return;
    }

    if (betAmount < 10) {
      alert("Minimum bet is ₹10");
      return;
    }

    try {
      const response = await api.post("/bet/place", {
        game: "mines",
        amount: betAmount,
        selection: "start",
        betType: "mines",
        multiplier: 1
      });

      setWallet(response.data.wallet);
      setCurrentBetId(response.data.betId);
      
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
      
      if (currentBetId) {
        await api.post("/bet/cashout", {
          betId: currentBetId,
          winAmount: 0,
          result: "mine",
          multiplier: 0
        });
        setHistoryRefresh(prev => prev + 1);
        fetchWallet();
      }
      return;
    }

    const updated = [...revealedTiles, index];
    setRevealedTiles(updated);
    const newMultiplier = getMultiplierForMines(minesCount, updated.length);
    setMultiplier(newMultiplier);
    setProfit(Math.floor(betAmount * newMultiplier));
  };

  const cashout = async () => {
    if (gameOver || revealedTiles.length === 0 || !gameStarted) return;

    if (!currentBetId) return;
    
    try {
      const response = await api.post("/bet/cashout", {
        betId: currentBetId,
        winAmount: profit,
        result: `cashout with ${revealedTiles.length} gems`,
        multiplier: multiplier
      });

      setWallet(response.data.wallet);
      fetchWallet();
      setHistoryRefresh(prev => prev + 1);
      
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
                  <button
                    key={index}
                    onClick={() => revealTile(index)}
                    className={`aspect-square rounded-2xl border transition-all hover:scale-105 ${
                      revealed ? "bg-green-500/20 border-green-500" : "bg-zinc-900 border-zinc-800 hover:border-green-500"
                    } ${exploded ? "bg-red-500/20 border-red-500" : ""}`}
                  >
                    {revealed && (minePositions.includes(index) ? <Bomb className="mx-auto text-red-500" /> : <Gem className="mx-auto text-green-400" />)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Recent Wins */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-400" /> Recent Wins
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.slice(0, 10).map((item, i) => (
              <div key={i} className="bg-black border border-zinc-800 rounded-2xl p-4">
                <div className="flex justify-between">
                  <span className="text-green-400">{item.multiplier}x</span>
                  <span className="text-yellow-400">+₹{item.profit.toLocaleString()}</span>
                </div>
                <p className="text-xs text-zinc-500">{item.mines} mines</p>
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