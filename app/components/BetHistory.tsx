"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";
import { Trophy, TrendingUp, TrendingDown, Clock, Filter, RefreshCw, Search, AlertCircle } from "lucide-react";

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

interface BetHistoryProps {
  game?: string;
  refreshTrigger?: number;
  viewType?: "table" | "cards";
}

export default function BetHistory({ 
  game = "all", 
  refreshTrigger = 0,
  viewType = "table" 
}: BetHistoryProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState(game);
  const [showStats, setShowStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 20;

  // Updated games list - removed numcards
  const games = [
    "all", 
    "color-trade", 
    "mines", 
    "sky", 
    "spin", 
    "plinko", 
    "lottery", 
    "trading"
  ];

  const fetchHistory = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    
    const token = localStorage.getItem("token");
    
    try {
      const response = await api.get(
        `/bet/history?game=${selectedGame}&limit=200`
      );
      
      if (response.data.success) {
        setAllBets(response.data.bets || []);
        setStats(response.data.stats || {
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          totalWonAmount: 0,
          totalBetAmount: 0
        });
        applyFilters(response.data.bets || [], filter, searchTerm);
      } else {
        setError("Failed to fetch history");
      }
    } catch (error: any) {
      console.error("Failed to fetch history:", error);
      setError(error.response?.data?.error || "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(bet => 
        bet.selection?.toLowerCase().includes(searchLower) ||
        bet.game?.toLowerCase().includes(searchLower) ||
        bet.result?.toLowerCase().includes(searchLower) ||
        bet.betType?.toLowerCase().includes(searchLower)
      );
    }
    
    setBets(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchHistory(true);
  }, [selectedGame, refreshTrigger]);

  useEffect(() => {
    applyFilters(allBets, filter, searchTerm);
  }, [filter, searchTerm, allBets]);

  const getGameIcon = (game: string) => {
    const icons: Record<string, string> = {
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

  const getGameName = (game: string) => {
    const names: Record<string, string> = {
      "color-trade": "Color Trade",
      mines: "Mines",
      sky: "Sky Aviator",
      spin: "Spin Wheel",
      plinko: "Plinko",
      lottery: "Lottery",
      trading: "Trading"
    };
    return names[game] || game;
  };

  const paginatedBets = bets.slice(0, currentPage * itemsPerPage);
  const hasMore = paginatedBets.length < bets.length;

  const handleRefresh = () => {
    fetchHistory(false);
  };

  const formatNumber = (num: number) => {
    return num?.toLocaleString() || "0";
  };

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-3 text-zinc-400">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="text-red-400 w-12 h-12 mb-3" />
          <p className="text-red-400 font-bold">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 md:p-6">
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
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm text-zinc-500 hover:text-green-400 transition px-3 py-1 rounded-lg bg-zinc-900 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`inline ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? " Refreshing..." : " Refresh"}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="bg-black rounded-2xl p-3 md:p-4 text-center">
            <p className="text-zinc-500 text-xs md:text-sm">Total Bets</p>
            <p className="text-xl md:text-2xl font-bold text-white">{stats.totalBets}</p>
          </div>
          <div className="bg-black rounded-2xl p-3 md:p-4 text-center">
            <p className="text-zinc-500 text-xs md:text-sm">Wins / Losses</p>
            <p className="text-xl md:text-2xl font-bold">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600"> / </span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </p>
          </div>
          <div className="bg-black rounded-2xl p-3 md:p-4 text-center">
            <p className="text-zinc-500 text-xs md:text-sm">Win Rate</p>
            <p className="text-xl md:text-2xl font-bold text-green-400">
              {stats.totalBets > 0 ? Math.round((stats.totalWins / stats.totalBets) * 100) : 0}%
            </p>
          </div>
          <div className="bg-black rounded-2xl p-3 md:p-4 text-center">
            <p className="text-zinc-500 text-xs md:text-sm">Total Wagered</p>
            <p className="text-xl md:text-2xl font-bold text-blue-400">₹{formatNumber(stats.totalBetAmount)}</p>
          </div>
          <div className="bg-black rounded-2xl p-3 md:p-4 text-center">
            <p className="text-zinc-500 text-xs md:text-sm">Net Profit</p>
            <p className={`text-xl md:text-2xl font-bold ${stats.totalWonAmount - stats.totalBetAmount >= 0 ? "text-green-400" : "text-red-400"}`}>
              ₹{formatNumber(stats.totalWonAmount - stats.totalBetAmount)}
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
              {g === "all" ? "All Games" : getGameName(g)}
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
            className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:border-green-500 outline-none w-40 md:w-48"
          />
        </div>
      </div>

      {/* View Type - Cards or Table */}
      {viewType === "cards" ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedBets.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-zinc-500">
              No bets found. Start playing to see your history!
            </div>
          ) : (
            paginatedBets.map((bet) => (
              <div key={bet._id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-green-500/30 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getGameIcon(bet.game)}</span>
                    <div>
                      <span className="font-bold">{getGameName(bet.game)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ml-2 ${getGameColor(bet.game)}`}>
                        {bet.betType}
                      </span>
                    </div>
                  </div>
                  {bet.isWin ? (
                    <span className="text-green-400 font-bold">+₹{formatNumber(bet.winAmount)}</span>
                  ) : (
                    <span className="text-red-400">-₹{formatNumber(bet.amount)}</span>
                  )}
                </div>
                <div className="text-sm text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Selection:</span>
                    <span className="text-yellow-400 font-bold">{bet.selection || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>₹{formatNumber(bet.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Multiplier:</span>
                    <span>{bet.multiplier}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Result:</span>
                    <span>{bet.result || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{new Date(bet.createdAt).toLocaleString()}</span>
                    <span className="font-mono">{bet.roundId?.slice(-6) || ""}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Table View
        <div className="overflow-x-auto">
          <table className="w-full min-w-200">
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
              {paginatedBets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
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
                          {getGameName(bet.game)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-sm capitalize">{bet.betType}</td>
                    <td className="py-3 font-bold text-yellow-400">{bet.selection || "—"}</td>
                    <td className="py-3">₹{formatNumber(bet.amount)}</td>
                    <td className="py-3">{bet.multiplier}x</td>
                    <td className="py-3">{bet.result || "—"}</td>
                    <td className="py-3">
                      {bet.isWin ? (
                        <span className="text-green-400 font-bold">+₹{formatNumber(bet.winAmount)}</span>
                      ) : (
                        <span className="text-red-400">-₹{formatNumber(bet.amount)}</span>
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
      )}

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