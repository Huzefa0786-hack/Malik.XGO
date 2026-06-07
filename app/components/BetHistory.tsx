"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Trophy, TrendingUp, TrendingDown, Clock, Filter } from "lucide-react";

interface Bet {
  _id: string;
  game: string;
  betType: string;
  selection: string;
  amount: number;
  multiplier: number;
  result: string;
  isWin: boolean;
  winAmount: number;
  createdAt: string;
}

interface Stats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalWonAmount: number;
  totalBetAmount: number;
}

export default function BetHistory({ game = "all", refreshTrigger = 0 }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(game);
  const [showStats, setShowStats] = useState(true);

  const games = ["all", "numcards", "color-trade", "mines", "sky", "spin", "plinko", "lottery"];

  const fetchHistory = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/bet/history?game=${selectedGame}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setBets(response.data.bets);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedGame, refreshTrigger]);

  const getGameIcon = (game: string) => {
    const icons: Record<string, string> = {
      numcards: "🎴",
      "color-trade": "🎨",
      mines: "💣",
      sky: "✈️",
      spin: "🎡",
      plinko: "⚽",
      lottery: "🎟️"
    };
    return icons[game] || "🎮";
  };

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
      {/* Header with Stats Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Clock className="text-green-400" /> Bet History
        </h2>
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-sm text-zinc-500 hover:text-green-400 transition"
        >
          {showStats ? "Hide Stats" : "Show Stats"}
        </button>
      </div>

      {/* Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Total Bets</p>
            <p className="text-2xl font-bold text-white">{stats.totalBets}</p>
          </div>
          <div className="bg-black rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Wins / Losses</p>
            <p className="text-2xl font-bold">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600"> / </span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </p>
          </div>
          <div className="bg-black rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {stats.totalBets > 0 ? Math.round((stats.totalWins / stats.totalBets) * 100) : 0}%
            </p>
          </div>
          <div className="bg-black rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Net Profit</p>
            <p className={`text-2xl font-bold ${stats.totalWonAmount - stats.totalBetAmount >= 0 ? "text-green-400" : "text-red-400"}`}>
              ₹{(stats.totalWonAmount - stats.totalBetAmount).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Game Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {games.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGame(g)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              selectedGame === g
                ? "bg-green-500 text-black"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            {g === "all" ? "All Games" : g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {/* Bets Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-3 text-zinc-500 text-sm">Game</th>
              <th className="text-left py-3 text-zinc-500 text-sm">Bet</th>
              <th className="text-left py-3 text-zinc-500 text-sm">Selection</th>
              <th className="text-left py-3 text-zinc-500 text-sm">Amount</th>
              <th className="text-left py-3 text-zinc-500 text-sm">Multiplier</th>
              <th className="text-left py-3 text-zinc-500 text-sm">Result</th>
              <th className="text-left py-3 text-zinc-500 text-sm">Win/Loss</th>
              <th className="text-left py-3 text-zinc-500 text-sm">Date</th>
            </tr>
          </thead>
          <tbody>
            {bets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-zinc-500">
                  No bets placed yet. Start playing to see your history!
                </td>
              </tr>
            ) : (
              bets.map((bet) => (
                <tr key={bet._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                  <td className="py-3">
                    <span className="text-2xl mr-2">{getGameIcon(bet.game)}</span>
                    <span className="text-sm capitalize">{bet.game}</span>
                  </td>
                  <td className="py-3 text-sm capitalize">{bet.betType}</td>
                  <td className="py-3 font-bold text-yellow-400">{bet.selection}</td>
                  <td className="py-3">₹{bet.amount.toLocaleString()}</td>
                  <td className="py-3">{bet.multiplier}x</td>
                  <td className="py-3">{bet.result || "—"}</td>
                  <td className="py-3">
                    {bet.isWin ? (
                      <span className="text-green-400 font-bold">+₹{bet.winAmount.toLocaleString()}</span>
                    ) : (
                      <span className="text-red-400">-₹{bet.amount.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="py-3 text-zinc-500 text-sm">
                    {new Date(bet.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
