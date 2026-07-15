"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetHistory from "../components/BetHistory";
import { 
  ArrowLeft, 
  BarChart3, 
  Filter, 
  Calendar, 
  Download,
  RefreshCw,
  Trophy,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Search,
  X
} from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"table" | "cards">("table");
  const [isLoading, setIsLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/history");
    }
  }, [router]);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleExport = () => {
    // Export history as CSV
    alert("Export functionality coming soon!");
  };

  const handleClearFilters = () => {
    setSelectedGame("all");
    setDateRange({ from: "", to: "" });
    setSearchQuery("");
    setRefreshTrigger(prev => prev + 1);
  };

  const games = [
    { id: "all", name: "All Games", icon: "🎮" },
    { id: "color-trade", name: "Color Trade", icon: "🎨" },
    { id: "mines", name: "Mines", icon: "💣" },
    { id: "sky", name: "Sky Aviator", icon: "✈️" },
    { id: "spin", name: "Spin Wheel", icon: "🎡" },
    { id: "plinko", name: "Plinko", icon: "⚽" },
    { id: "lottery", name: "Lottery", icon: "🎟️" },
    { id: "trading", name: "Trading", icon: "📈" }
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800"
            >
              <ArrowLeft size={18} /> Back
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-green-400 flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                Bet History
              </h1>
              <p className="text-zinc-500 text-sm mt-1">Track all your bets and winnings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex p-1">
              <button
                onClick={() => setViewType("table")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  viewType === "table" 
                    ? "bg-green-500 text-black" 
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewType("cards")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  viewType === "cards" 
                    ? "bg-green-500 text-black" 
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                Cards
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition disabled:opacity-50"
              title="Refresh History"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition"
              title="Export History"
            >
              <Download size={18} />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition ${
                showFilters 
                  ? "bg-green-500/20 border-green-500 text-green-400" 
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
              }`}
              title="Toggle Filters"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <Trophy size={16} />
              <span className="text-xs text-zinc-500">Total Bets</span>
            </div>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs text-zinc-500">Wins</span>
            </div>
            <p className="text-2xl font-bold text-green-400">0</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <TrendingDown size={16} />
              <span className="text-xs text-zinc-500">Losses</span>
            </div>
            <p className="text-2xl font-bold text-red-400">0</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <Wallet size={16} />
              <span className="text-xs text-zinc-500">Net Profit</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">₹0</p>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-800 mb-6 animate-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Filter size={18} className="text-green-400" />
                Filters
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-sm text-zinc-500 hover:text-green-400 transition flex items-center gap-1"
              >
                <X size={14} /> Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Game Filter */}
              <div>
                <label className="text-zinc-400 text-sm block mb-2">Game</label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                >
                  {games.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.icon} {game.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-zinc-400 text-sm block mb-2">Date From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-sm block mb-2">Date To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                />
              </div>
            </div>

            {/* Search */}
            <div className="mt-4">
              <label className="text-zinc-400 text-sm block mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by game, selection, or result..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl pl-12 pr-4 py-3 focus:border-green-500 outline-none"
                />
              </div>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="mt-4 w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl transition"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Bet History Component */}
        {(() => {
          const BetHistoryAny = BetHistory as any;
          return (
            <BetHistoryAny
              game={selectedGame}
              refreshTrigger={refreshTrigger}
              viewType={viewType}
            />
          );
        })()}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
          <span>Showing all bets</span>
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}