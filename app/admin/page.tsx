"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Wallet, TrendingUp, TrendingDown, Activity,
  Settings, RefreshCw, Search, Ban, Trash2, Plus, Minus,
  DollarSign, Gamepad2, BarChart3, Crown, Edit2, X,
  Play, Pause, StopCircle, Power, Target, Dice6, Circle, Heart, Zap, Clock
} from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  email: string;
  uid: string;
  wallet: number;
  isBanned: boolean;
  role: string;
  createdAt: string;
}

interface GameResult {
  game: string;
  result: string;
  timestamp: string;
}

interface GameSettingsType {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  multiplier?: number;
  maxMines?: number;
  maxMultiplier?: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [walletAmount, setWalletAmount] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  const [gameStatus, setGameStatus] = useState("RUNNING");
  const [recentResults, setRecentResults] = useState<GameResult[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const [gameSettings, setGameSettings] = useState<Record<string, GameSettingsType>>({
    numcards: { enabled: true, minBet: 10, maxBet: 10000, multiplier: 9 },
    colorTrade: { enabled: true, minBet: 10, maxBet: 10000 },
    mines: { enabled: true, minBet: 10, maxBet: 10000, maxMines: 10 },
    sky: { enabled: true, minBet: 10, maxBet: 10000, maxMultiplier: 20 },
    spin: { enabled: true, minBet: 10, maxBet: 10000 },
    plinko: { enabled: true, minBet: 10, maxBet: 10000 },
    lottery: { enabled: true, minBet: 10, maxBet: 10000 }
  });
  
  const [platformSettings, setPlatformSettings] = useState({
    siteName: "Malik.XGO",
    maintenance: false,
    depositBonus: 10,
    minDeposit: 100,
    maxDeposit: 100000,
    minWithdraw: 500,
    maxWithdraw: 50000
  });

  useEffect(() => {
    fetchUsers();
    loadSettings();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5002/api/auth/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const savedGames = localStorage.getItem("admin_game_settings");
    if (savedGames) {
      setGameSettings(JSON.parse(savedGames));
    }
    const savedPlatform = localStorage.getItem("admin_platform_settings");
    if (savedPlatform) {
      setPlatformSettings(JSON.parse(savedPlatform));
    }
    const savedStatus = localStorage.getItem("game_status");
    if (savedStatus) {
      setGameStatus(savedStatus);
    }
    const savedResults = localStorage.getItem("game_results");
    if (savedResults) {
      setRecentResults(JSON.parse(savedResults));
    }
  };

  const saveRecentResult = (game: string, result: string) => {
    const newResult = { game, result, timestamp: new Date().toLocaleTimeString() };
    const updatedResults = [newResult, ...recentResults].slice(0, 20);
    setRecentResults(updatedResults);
    localStorage.setItem("game_results", JSON.stringify(updatedResults));
  };

  const updateUserWallet = async (userId: string, amount: number, type: "add" | "remove") => {
    if (!amount || amount <= 0) {
      setMessage({ text: "Enter valid amount", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    const newWallet = type === "add" ? user.wallet + amount : user.wallet - amount;
    if (newWallet < 0) {
      setMessage({ text: "Wallet cannot be negative", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5002/api/auth/wallet/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: newWallet })
      });
      
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, wallet: newWallet } : u));
        setWalletAmount(prev => ({ ...prev, [userId]: "" }));
        setMessage({ text: `₹${amount.toLocaleString()} ${type === "add" ? "added" : "removed"}`, type: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ text: "Failed to update wallet", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:5002/api/auth/ban/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isBanned: !currentStatus } : u));
        setMessage({ text: `User ${!currentStatus ? "banned" : "unbanned"}`, type: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ text: "Failed to update status", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user?")) return;
    
    try {
      const res = await fetch(`http://localhost:5002/api/auth/delete/${userId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
        setMessage({ text: "User deleted", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ text: "Failed to delete", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateGameSetting = (game: string, setting: string, value: number | boolean) => {
    const newSettings = { ...gameSettings } as Record<string, GameSettingsType>;
    newSettings[game] = {
      ...(newSettings[game] || {}),
      [setting]: value
    } as GameSettingsType;
    setGameSettings(newSettings);
    localStorage.setItem("admin_game_settings", JSON.stringify(newSettings));
    setMessage({ text: `${game} ${setting} updated`, type: "success" });
    setTimeout(() => setMessage(null), 2000);
    setEditingField(null);
  };

  const updatePlatformSetting = (setting: string, value: string | number | boolean) => {
    const newSettings = { ...platformSettings, [setting]: value };
    setPlatformSettings(newSettings);
    localStorage.setItem("admin_platform_settings", JSON.stringify(newSettings));
    setMessage({ text: `${setting} updated`, type: "success" });
    setTimeout(() => setMessage(null), 2000);
    setEditingField(null);
  };

  const updateGameStatus = (status: string) => {
    setGameStatus(status);
    localStorage.setItem("game_status", status);
    setMessage({ text: `Game status changed to ${status}`, type: "success" });
    setTimeout(() => setMessage(null), 2000);
  };

  const forceGameResult = (game: string, result: string) => {
    saveRecentResult(game, result);
    setMessage({ text: `${game} result forced to ${result}`, type: "success" });
    setTimeout(() => setMessage(null), 2000);
  };

  const startEditing = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setEditValue(String(currentValue));
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.isBanned).length,
    bannedUsers: users.filter(u => u.isBanned).length,
    totalWallet: users.reduce((sum, u) => sum + u.wallet, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-400 hover:text-white">← Back to Site</Link>
            <Crown className="text-green-400" size={24} />
            <h1 className="text-2xl font-black text-green-400">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              gameStatus === "RUNNING" ? "bg-green-500/20 text-green-400" :
              gameStatus === "PAUSED" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            }`}>
              {gameStatus === "RUNNING" ? "🟢 LIVE" : gameStatus === "PAUSED" ? "🟡 PAUSED" : "🔴 STOPPED"}
            </div>
            <button onClick={fetchUsers} className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500" : "bg-red-500/20 text-red-400 border border-red-500"
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 py-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
            { id: "users", label: "Users", icon: <Users size={18} /> },
            { id: "game-control", label: "Game Control", icon: <Gamepad2 size={18} /> },
            { id: "numcards", label: "NumCards", icon: <Dice6 size={18} /> },
            { id: "color-trade", label: "Color Trade", icon: <Circle size={18} /> },
            { id: "sky", label: "Sky/Aviator", icon: <TrendingUp size={18} /> },
            { id: "settings", label: "Settings", icon: <Settings size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                activeTab === tab.id ? "bg-green-500 text-black" : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <h2 className="text-3xl font-black mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <Users className="text-green-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-zinc-500 mt-1">Active: {stats.activeUsers}</p>
              </div>
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <Ban className="text-red-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Banned Users</p>
                <p className="text-3xl font-bold text-red-400">{stats.bannedUsers}</p>
              </div>
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <Wallet className="text-yellow-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Total Wallet</p>
                <p className="text-3xl font-bold text-yellow-400">₹{stats.totalWallet.toLocaleString()}</p>
              </div>
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <Activity className="text-blue-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Game Status</p>
                <p className={`text-3xl font-bold ${
                  gameStatus === "RUNNING" ? "text-green-400" : gameStatus === "PAUSED" ? "text-yellow-400" : "text-red-400"
                }`}>
                  {gameStatus}
                </p>
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={20} className="text-green-400" />
                Recent Game Results
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentResults.map((result, index) => (
                  <div key={index} className="bg-black rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {result.game === "numcards" ? "🎴" : result.game === "colorTrade" ? "🎨" : result.game === "sky" ? "✈️" : "🎮"}
                      </span>
                      <span className="font-medium capitalize">{result.game}</span>
                    </div>
                    <span className="text-green-400 font-bold">{result.result}</span>
                    <span className="text-zinc-500 text-sm">{result.timestamp}</span>
                  </div>
                ))}
                {recentResults.length === 0 && (
                  <p className="text-zinc-500 text-center py-4">No results yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <h2 className="text-3xl font-black">User Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl w-64 focus:border-green-500 outline-none"
                />
              </div>
            </div>
            <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800">
                    <tr className="text-left text-zinc-400 text-sm">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">UID</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Wallet</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 50).map((user) => (
                      <tr key={user._id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 font-mono text-sm">{user.uid}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 text-green-400 font-bold">₹{user.wallet.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isBanned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                          }`}>
                            {user.isBanned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "admin" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder="Amount"
                                value={walletAmount[user._id] || ""}
                                onChange={(e) => setWalletAmount(prev => ({ ...prev, [user._id]: e.target.value }))}
                                className="w-20 bg-black border border-zinc-700 rounded-lg px-2 py-1 text-sm"
                              />
                              <button
                                onClick={() => updateUserWallet(user._id, Number(walletAmount[user._id]), "add")}
                                className="p-1.5 bg-green-600 rounded-lg hover:bg-green-700"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                onClick={() => updateUserWallet(user._id, Number(walletAmount[user._id]), "remove")}
                                className="p-1.5 bg-red-600 rounded-lg hover:bg-red-700"
                              >
                                <Minus size={14} />
                              </button>
                            </div>
                            {user.role !== "admin" && (
                              <>
                                <button
                                  onClick={() => toggleBan(user._id, user.isBanned)}
                                  className={`p-1.5 rounded-lg ${user.isBanned ? "bg-green-600" : "bg-yellow-600"}`}
                                >
                                  <Ban size={14} />
                                </button>
                                <button
                                  onClick={() => deleteUser(user._id)}
                                  className="p-1.5 bg-red-600 rounded-lg hover:bg-red-700"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-zinc-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Game Control Tab */}
        {activeTab === "game-control" && (
          <div>
            <h2 className="text-3xl font-black mb-6">Game Control Center</h2>
            
            {/* Global Game Status */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Power className="text-green-400" size={20} />
                Global Game Status
              </h3>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => updateGameStatus("RUNNING")}
                  className={`px-6 py-3 rounded-xl font-bold transition ${
                    gameStatus === "RUNNING" ? "bg-green-500 text-black" : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <Play size={18} className="inline mr-2" /> START ALL GAMES
                </button>
                <button
                  onClick={() => updateGameStatus("PAUSED")}
                  className={`px-6 py-3 rounded-xl font-bold transition ${
                    gameStatus === "PAUSED" ? "bg-yellow-500 text-black" : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  }`}
                >
                  <Pause size={18} className="inline mr-2" /> PAUSE ALL GAMES
                </button>
                <button
                  onClick={() => updateGameStatus("STOPPED")}
                  className={`px-6 py-3 rounded-xl font-bold transition ${
                    gameStatus === "STOPPED" ? "bg-red-500 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <StopCircle size={18} className="inline mr-2" /> STOP ALL GAMES
                </button>
              </div>
            </div>

            {/* Active Games Overview */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="text-blue-400" size={20} />
                Active Games Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(gameSettings).map(([game, settings]) => (
                  <div key={game} className="bg-black rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">
                      {game === "numcards" && "🎴"}
                      {game === "colorTrade" && "🎨"}
                      {game === "mines" && "💣"}
                      {game === "sky" && "✈️"}
                      {game === "spin" && "🎡"}
                      {game === "plinko" && "⚽"}
                      {game === "lottery" && "🎟️"}
                    </div>
                    <p className="font-bold capitalize">{game}</p>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        (settings as GameSettingsType).enabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {(settings as GameSettingsType).enabled ? "ACTIVE" : "DISABLED"}
                      </span>
                    </div>
                    <button
                      onClick={() => updateGameSetting(game, "enabled", !(settings as GameSettingsType).enabled)}
                      className="mt-2 text-xs text-zinc-500 hover:text-green-400"
                    >
                      Toggle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NumCards Tab */}
        {activeTab === "numcards" && (
          <div>
            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
              <Dice6 className="text-green-400" size={32} />
              NumCards Control
            </h2>
            
            <div className="grid gap-6">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Game Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{gameSettings.numcards.minBet}</span>
                      <button onClick={() => startEditing("numcards-minBet", gameSettings.numcards.minBet)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{gameSettings.numcards.maxBet}</span>
                      <button onClick={() => startEditing("numcards-maxBet", gameSettings.numcards.maxBet)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Multiplier</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">{gameSettings.numcards.multiplier}x</span>
                      <button onClick={() => startEditing("numcards-multiplier", gameSettings.numcards.multiplier || 9)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Force Result */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="text-red-400" size={20} />
                  Force Result
                </h3>
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => forceGameResult("numcards", num.toString())}
                      className="bg-black border border-zinc-700 hover:border-green-500 hover:bg-green-500/10 py-3 rounded-xl font-bold text-xl transition"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Trade Tab */}
        {activeTab === "color-trade" && (
          <div>
            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
              <Circle className="text-green-400" size={32} />
              Color Trade Control
            </h2>
            
            <div className="grid gap-6">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Game Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{gameSettings.colorTrade.minBet}</span>
                      <button onClick={() => startEditing("colorTrade-minBet", gameSettings.colorTrade.minBet)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{gameSettings.colorTrade.maxBet}</span>
                      <button onClick={() => startEditing("colorTrade-maxBet", gameSettings.colorTrade.maxBet)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Force Color Result */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="text-red-400" size={20} />
                  Force Color Result
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {["GREEN", "VIOLET", "RED"].map((color) => (
                    <button
                      key={color}
                      onClick={() => forceGameResult("colorTrade", color)}
                      className={`py-4 rounded-xl font-bold text-xl transition ${
                        color === "GREEN" ? "bg-green-600 hover:bg-green-500" :
                        color === "VIOLET" ? "bg-purple-600 hover:bg-purple-500" :
                        "bg-red-600 hover:bg-red-500"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Force Number Result */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Dice6 className="text-red-400" size={20} />
                  Force Number Result (0-9)
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => forceGameResult("colorTrade", num.toString())}
                      className="py-3 rounded-xl font-bold text-xl transition bg-black border border-zinc-700 hover:border-green-500"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sky/Aviator Tab */}
        {activeTab === "sky" && (
          <div>
            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
              <TrendingUp className="text-green-400" size={32} />
              Sky / Aviator Control
            </h2>
            
            <div className="grid gap-6">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Game Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{gameSettings.sky.minBet}</span>
                      <button onClick={() => startEditing("sky-minBet", gameSettings.sky.minBet)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{gameSettings.sky.maxBet}</span>
                      <button onClick={() => startEditing("sky-maxBet", gameSettings.sky.maxBet)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Multiplier</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">{gameSettings.sky.maxMultiplier}x</span>
                      <button onClick={() => startEditing("sky-maxMultiplier", gameSettings.sky.maxMultiplier || 20)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Force Crash Multiplier */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="text-red-400" size={20} />
                  Force Crash Multiplier
                </h3>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[1.5, 2, 3, 5, 10, 20, 50, 100].map((multi) => (
                    <button
                      key={multi}
                      onClick={() => forceGameResult("sky", `${multi}x`)}
                      className="bg-black border border-zinc-700 hover:border-yellow-500 hover:bg-yellow-500/10 py-3 rounded-xl font-bold transition"
                    >
                      {multi}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <h2 className="text-3xl font-black mb-6">Platform Settings</h2>
            <div className="grid gap-6">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">General Settings</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-zinc-500 text-sm">Site Name</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">{platformSettings.siteName}</span>
                      <button onClick={() => startEditing("siteName", platformSettings.siteName)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Maintenance Mode</label>
                    <div className="mt-2">
                      <button
                        onClick={() => updatePlatformSetting("maintenance", !platformSettings.maintenance)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm ${
                          platformSettings.maintenance ? "bg-red-500 text-white" : "bg-green-500 text-black"
                        }`}
                      >
                        {platformSettings.maintenance ? "Maintenance ON" : "Maintenance OFF"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Deposit Bonus (%)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">{platformSettings.depositBonus}%</span>
                      <button onClick={() => startEditing("depositBonus", platformSettings.depositBonus)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Min Deposit (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{platformSettings.minDeposit}</span>
                      <button onClick={() => startEditing("minDeposit", platformSettings.minDeposit)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Deposit (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{platformSettings.maxDeposit}</span>
                      <button onClick={() => startEditing("maxDeposit", platformSettings.maxDeposit)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Min Withdraw (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{platformSettings.minWithdraw}</span>
                      <button onClick={() => startEditing("minWithdraw", platformSettings.minWithdraw)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Withdraw (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">₹{platformSettings.maxWithdraw}</span>
                      <button onClick={() => startEditing("maxWithdraw", platformSettings.maxWithdraw)} className="p-1 hover:bg-zinc-800 rounded">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-800">
            <h3 className="text-xl font-bold mb-4">Edit {editingField}</h3>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 mb-4 focus:border-green-500 outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const [game, setting] = editingField.split("-");
                  if (game === "numcards" || game === "colorTrade" || game === "mines" || game === "sky" || game === "spin" || game === "plinko") {
                    updateGameSetting(game, setting, Number(editValue));
                  } else {
                    updatePlatformSetting(editingField, isNaN(Number(editValue)) ? editValue : Number(editValue));
                  }
                }}
                className="flex-1 bg-green-500 text-black py-2 rounded-xl font-bold"
              >
                Save
              </button>
              <button onClick={() => setEditingField(null)} className="flex-1 bg-zinc-800 py-2 rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}