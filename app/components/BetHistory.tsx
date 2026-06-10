"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Trophy, TrendingUp, TrendingDown, Clock, Filter, RefreshCw, Search } from "lucide-react";

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
  userName: string;
  roundId: string;
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
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(game);
  const [showStats, setShowStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const games = ["all", "numcards", "color-trade", "mines", "sky", "spin", "plinko", "lottery", "trading", "quotex"];

  const fetchHistory = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/bet/history?game=${selectedGame}&limit=200`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setAllBets(response.data.bets);
        setStats(response.data.stats);
        applyFilters(response.data.bets, filter, searchTerm);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (betsData: Bet[], filterType: string, search: string) => {
    let filtered = [...betsData];
    
    // Apply win/loss filter
    if (filterType === "win") {
      filtered = filtered.filter(bet => bet.isWin);
    } else if (filterType === "loss") {
      filtered = filtered.filter(bet => !bet.isWin);
    }
    
    // Apply search filter
    if (search) {
      filtered = filtered.filter(bet => 
        bet.selection?.toLowerCase().includes(search.toLowerCase()) ||
        bet.game?.toLowerCase().includes(search.toLowerCase()) ||
        bet.result?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setBets(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedGame, refreshTrigger]);

  useEffect(() => {
    applyFilters(allBets, filter, searchTerm);
  }, [filter, searchTerm, allBets]);

  const getGameIcon = (game: string) => {
    const icons: Record<string, string> = {
      numcards: "🎴",
      "color-trade": "🎨",
      mines: "💣",
      sky: "✈️",
      spin: "🎡",
      plinko: "⚽",
      lottery: "🎟️",
      trading: "📈",
      quotex: "📊"
    };
    return icons[game] || "🎮";
  };

  const getGameColor = (game: string) => {
    const colors: Record<string, string> = {
      numcards: "bg-purple-500/20 text-purple-400",
      "color-trade": "bg-pink-500/20 text-pink-400",
      mines: "bg-orange-500/20 text-orange-400",
      sky: "bg-cyan-500/20 text-cyan-400",
      spin: "bg-indigo-500/20 text-indigo-400",
      plinko: "bg-emerald-500/20 text-emerald-400",
      lottery: "bg-rose-500/20 text-rose-400",
      trading: "bg-blue-500/20 text-blue-400",
      quotex: "bg-green-500/20 text-green-400"
    };
    return colors[game] || "bg-zinc-500/20 text-zinc-400";
  };

  const paginatedBets = bets.slice(0, currentPage * itemsPerPage);
  const hasMore = paginatedBets.length < bets.length;

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
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Clock className="text-green-400" /> Bet History
          <span className="text-sm text-zinc-500 font-normal">({bets.length} records)</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-sm text-zinc-500 hover:text-green-400 transition px-3 py-1 rounded-lg bg-zinc-900"
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button
            onClick={fetchHistory}
            className="text-sm text-zinc-500 hover:text-green-400 transition px-3 py-1 rounded-lg bg-zinc-900"
          >
            <RefreshCw size={14} className="inline" /> Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-black rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-sm">Total Bets</p>
            <p className="text-2xl font-bold text-white">{stats.totalBets}</p>
          </div>
          <div className="bg-black rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-sm">Wins / Losses</p>
            <p className="text-2xl font-bold">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600"> / </span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </p>
          </div>
          <div className="bg-black rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {stats.totalBets > 0 ? Math.round((stats.totalWins / stats.totalBets) * 100) : 0}%
            </p>
          </div>
          <div className="bg-black rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-sm">Total Wagered</p>
            <p className="text-2xl font-bold text-blue-400">₹{stats.totalBetAmount.toLocaleString()}</p>
          </div>
          <div className="bg-black rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-sm">Net Profit</p>
            <p className={`text-2xl font-bold ${stats.totalWonAmount - stats.totalBetAmount >= 0 ? "text-green-400" : "text-red-400"}`}>
              ₹{(stats.totalWonAmount - stats.totalBetAmount).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Game Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
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
        
        {/* Win/Loss Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              filter === "all" ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-500"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("win")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              filter === "win" ? "bg-green-500 text-black" : "bg-zinc-900 text-zinc-500"
            }`}
          >
            <Trophy size={14} className="inline mr-1" /> Wins
          </button>
          <button
            onClick={() => setFilter("loss")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              filter === "loss" ? "bg-red-500 text-white" : "bg-zinc-900 text-zinc-500"
            }`}
          >
            Losses
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search bets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:border-green-500 outline-none"
          />
        </div>
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
              <th className="text-left py-3 text-zinc-500 text-sm">Round</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBets.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-500">
                  No bets found. Start playing to see your history!
                </td>
              </tr>
            ) : (
              paginatedBets.map((bet) => (
                <tr key={bet._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getGameIcon(bet.game)}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getGameColor(bet.game)}`}>
                        {bet.game}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-sm capitalize">{bet.betType}</td>
                  <td className="py-3 font-bold text-yellow-400">{bet.selection || "—"}</td>
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
                  <td className="py-3 text-zinc-500 text-xs font-mono">
                    {bet.roundId?.slice(-8) || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-bold transition"
          >
            Load More ({paginatedBets.length} / {bets.length})
          </button>
        </div>
      )}
    </div>
  );
}