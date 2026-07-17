"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Wallet, TrendingUp, TrendingDown, Activity,
  Settings, RefreshCw, Search, Ban, Trash2, Plus, Minus,
  DollarSign, Gamepad2, BarChart3, Crown, Edit2,
  Play, Pause, StopCircle, Target, Circle,
  Heart, Zap, Clock, LogOut, Shield, Send,
  TrendingUp as TrendUp, TrendingDown as TrendDown, CandlestickChart,
  Dice6, Flame, Award, Star, AlertCircle, CheckCircle,
  CreditCard, Banknote, Coins, Filter, Download, Calendar,
  Eye, EyeOff, Copy, Check, Loader2, ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  email: string;
  uid: string;
  wallet: number;
  isBanned: boolean;
  role: string;
}

interface TransactionType {
  _id: string;
  userId: string;
  userName: string;
  userUid: string;
  type: "deposit" | "withdraw";
  amount: number;
  method: "upi" | "bank" | "crypto" | "wallet";
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  details: {
    upiId?: string;
    bankAccount?: string;
    bankName?: string;
    ifscCode?: string;
    accountHolder?: string;
    cryptoAddress?: string;
    cryptoNetwork?: string;
    transactionId?: string;
    notes?: string;
  };
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

interface GameSettingsType {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  [key: string]: any;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<UserType[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [walletAmount, setWalletAmount] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ text: string; type: string; timestamp?: number } | null>(null);
  const [selectedGame, setSelectedGame] = useState("colorTrade");
  const [gameStatus, setGameStatus] = useState("RUNNING");
  const [forceResultValue, setForceResultValue] = useState("");
  const [transactionFilter, setTransactionFilter] = useState<"all" | "deposit" | "withdraw">("all");
  const [transactionStatus, setTransactionStatus] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [transactionStats, setTransactionStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalCompleted: 0,
    totalRejected: 0
  });

  // Game Settings State
  const [gameSettings, setGameSettings] = useState({
    colorTrade: {
      enabled: true,
      minBet: 10,
      maxBet: 10000,
      greenMultiplier: 2,
      violetMultiplier: 4.5,
      redMultiplier: 2,
      numberMultiplier: 9,
      bigMultiplier: 1.5,
      smallMultiplier: 1.5,
      lastForcedResult: null,
      forcedResult: null
    },
    mines: {
      enabled: true,
      minBet: 10,
      maxBet: 10000,
      maxMines: 10,
      multipliers: [1.5, 2.0, 2.5, 3.2, 4.0, 5.0, 6.5, 8.0, 10.0, 12.5],
      lastForcedResult: null,
      forcedResult: null
    },
    sky: {
      enabled: true,
      minBet: 10,
      maxBet: 10000,
      maxMultiplier: 20,
      crashRate: 0.03,
      lastForcedResult: null,
      forcedResult: null
    },
    spin: {
      enabled: true,
      minBet: 10,
      maxBet: 10000,
      heartsMultiplier: 2,
      spadesMultiplier: 3,
      clubsMultiplier: 4,
      diamondsMultiplier: 5,
      lastForcedResult: null,
      forcedResult: null
    },
    plinko: {
      enabled: true,
      minBet: 10,
      maxBet: 10000,
      lastForcedResult: null,
      forcedResult: null,
      riskLevels: ["LOW", "MEDIUM", "HIGH"],
      multipliers: {
        LOW: [1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2],
        MEDIUM: [2.0, 1.5, 1.0, 0.5, 0.2, 0.5, 1.0, 1.5, 2.0],
        HIGH: [10.0, 5.0, 2.0, 1.0, 0.2, 1.0, 2.0, 5.0, 10.0]
      }
    },
    lottery: {
      enabled: true,
      ticketPrice: 10,
      jackpot: 100000,
      lastForcedResult: null,
      forcedResult: null
    },
    trading: {
      enabled: true,
      minBet: 10,
      maxBet: 10000,
      winProbability: 30,
      lossProbability: 70,
      lastForcedResult: null,
      forcedResult: null
    }
  });

  const [platformSettings, setPlatformSettings] = useState({
    siteName: "Malik.XGO",
    maintenance: false,
    depositBonus: 10,
    referralBonus: 5,
    minDeposit: 100,
    maxDeposit: 100000,
    minWithdraw: 500,
    maxWithdraw: 50000
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalWallet: 0,
    totalDeposits: 125000,
    totalWithdrawals: 72400
  });

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("admin");
    if (adminLoggedIn !== "true") {
      router.push("/admin-login");
      return;
    }
    loadData();
    loadTransactions();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/api/auth/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setStats(prev => ({
        ...prev,
        totalUsers: data.length || 0,
        activeUsers: data.filter((u: UserType) => !u.isBanned).length || 0,
        bannedUsers: data.filter((u: UserType) => u.isBanned).length || 0,
        totalWallet: data.reduce((sum: number, u: UserType) => sum + (u.wallet || 0), 0)
      }));
      
      const saved = localStorage.getItem("admin_game_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setGameSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
      
      const savedStatus = localStorage.getItem("game_status");
      if (savedStatus) setGameStatus(savedStatus);
      
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5002/api/transaction/admin/all", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        // Calculate stats
        const deposits = data.transactions?.filter((t: TransactionType) => t.type === "deposit") || [];
        const withdrawals = data.transactions?.filter((t: TransactionType) => t.type === "withdraw") || [];
        setTransactionStats({
          totalDeposits: deposits.reduce((sum, t) => sum + t.amount, 0),
          totalWithdrawals: withdrawals.reduce((sum, t) => sum + t.amount, 0),
          pendingDeposits: deposits.filter(t => t.status === "pending").length,
          pendingWithdrawals: withdrawals.filter(t => t.status === "pending").length,
          totalCompleted: data.transactions?.filter((t: TransactionType) => t.status === "completed").length || 0,
          totalRejected: data.transactions?.filter((t: TransactionType) => t.status === "rejected").length || 0
        });
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type, timestamp: Date.now() });
    setTimeout(() => setMessage(null), 4000);
  };

  // ============ TRANSACTION HANDLERS ============
  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5002/api/transaction/admin/approve/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: adminNote })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Transaction approved successfully!", "success");
        loadTransactions();
        loadData();
        setShowTransactionModal(false);
        setAdminNote("");
      } else {
        showMessage(data.error || "Failed to approve", "error");
      }
    } catch (error) {
      showMessage("Failed to approve transaction", "error");
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to reject this transaction?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5002/api/transaction/admin/reject/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: adminNote || "Rejected by admin" })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Transaction rejected!", "success");
        loadTransactions();
        loadData();
        setShowTransactionModal(false);
        setAdminNote("");
      } else {
        showMessage(data.error || "Failed to reject", "error");
      }
    } catch (error) {
      showMessage("Failed to reject transaction", "error");
    }
  };

  const handleCompleteWithdrawal = async (transactionId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5002/api/transaction/admin/complete-withdrawal/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Withdrawal completed successfully!", "success");
        loadTransactions();
        loadData();
        setShowTransactionModal(false);
      } else {
        showMessage(data.error || "Failed to complete", "error");
      }
    } catch (error) {
      showMessage("Failed to complete withdrawal", "error");
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "upi": return <CreditCard size={16} className="text-blue-400" />;
      case "bank": return <Banknote size={16} className="text-green-400" />;
      case "crypto": return <Coins size={16} className="text-yellow-400" />;
      default: return <Wallet size={16} className="text-zinc-400" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "upi": return "UPI";
      case "bank": return "Bank Transfer";
      case "crypto": return "Crypto";
      default: return "Wallet";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-400 bg-green-500/20 border-green-500/30";
      case "approved": return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "pending": return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "rejected": return "text-red-400 bg-red-500/20 border-red-500/30";
      case "failed": return "text-red-400 bg-red-500/20 border-red-500/30";
      default: return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle size={16} className="text-green-400" />;
      case "approved": return <CheckCircle size={16} className="text-blue-400" />;
      case "pending": return <Clock size={16} className="text-yellow-400" />;
      case "rejected": return <AlertCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-zinc-400" />;
    }
  };

  const updateUserWallet = async (userId: string, amount: number, type: "add" | "remove") => {
    if (!amount || amount <= 0) {
      showMessage("Enter valid amount", "error");
      return;
    }
    const user = users.find(u => u._id === userId);
    if (!user) return;
    const newWallet = type === "add" ? user.wallet + amount : user.wallet - amount;
    if (newWallet < 0) {
      showMessage("Wallet cannot be negative", "error");
      return;
    }
    try {
      await fetch(`http://localhost:5002/api/auth/wallet/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: newWallet })
      });
      setUsers(users.map(u => u._id === userId ? { ...u, wallet: newWallet } : u));
      setWalletAmount(prev => ({ ...prev, [userId]: "" }));
      showMessage(`₹${amount.toLocaleString()} ${type === "add" ? "added" : "removed"}`, "success");
    } catch (error) {
      showMessage("Failed to update wallet", "error");
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await fetch(`http://localhost:5002/api/auth/ban/${userId}`, { method: "PUT" });
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: !currentStatus } : u));
      showMessage(`User ${!currentStatus ? "banned" : "unbanned"}`, "success");
    } catch (error) {
      showMessage("Failed to update status", "error");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await fetch(`http://localhost:5002/api/auth/delete/${userId}`, { method: "DELETE" });
      setUsers(users.filter(u => u._id !== userId));
      showMessage("User deleted", "success");
    } catch (error) {
      showMessage("Failed to delete user", "error");
    }
  };

  const updateGameSetting = (game: string, setting: string, value: any) => {
    setGameSettings(prev => {
      const newSettings = {
        ...prev,
        [game]: {
          ...prev[game as keyof typeof prev],
          [setting]: value
        }
      };
      localStorage.setItem("admin_game_settings", JSON.stringify(newSettings));
      return newSettings;
    });
    showMessage(`${game} ${setting} updated to ${value}`, "success");
  };

  const updatePlatformSetting = (setting: string, value: any) => {
    setPlatformSettings(prev => ({ ...prev, [setting]: value }));
    showMessage(`${setting} updated`, "success");
  };

  const updateGameStatus = (status: string) => {
    setGameStatus(status);
    localStorage.setItem("game_status", status);
    showMessage(`Game status changed to ${status}`, "success");
  };

  const forceGameResult = (game: string, result: string) => {
    const forceData = {
      result: result,
      timestamp: Date.now(),
      game: game
    };
    localStorage.setItem(`forced_${game}_result`, JSON.stringify(forceData));
    updateGameSetting(game, "forcedResult", result);
    updateGameSetting(game, "lastForcedResult", {
      result: result,
      timestamp: new Date().toLocaleTimeString()
    });
    const socket = (window as any).socket;
    if (socket) {
      socket.emit('force_result', { game, result });
    }
    showMessage(`✅ ${game} result forced to ${result}`, "success");
    setForceResultValue("");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/admin-login");
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter !== "all" && t.type !== transactionFilter) return false;
    if (transactionStatus !== "all" && t.status !== transactionStatus) return false;
    return true;
  });

  const gamesList = [
    { id: "colorTrade", name: "Color Trade", icon: "🎨", color: "bg-pink-600" },
    { id: "mines", name: "Mines", icon: "💣", color: "bg-orange-600" },
    { id: "sky", name: "Sky Aviator", icon: "✈️", color: "bg-cyan-600" },
    { id: "spin", name: "Spin Wheel", icon: "🎡", color: "bg-indigo-600" },
    { id: "plinko", name: "Plinko", icon: "⚽", color: "bg-emerald-600" },
    { id: "lottery", name: "Lottery", icon: "🎟️", color: "bg-rose-600" },
    { id: "trading", name: "Trading", icon: "📈", color: "bg-blue-600" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const currentGame = gameSettings[selectedGame as keyof typeof gameSettings] as GameSettingsType;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-linear-to-r from-zinc-950 to-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="text-green-400" size={28} />
            <h1 className="text-2xl font-black text-green-400">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              gameStatus === "RUNNING" ? "bg-green-500/20 text-green-400" :
              gameStatus === "PAUSED" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
            }`}>
              {gameStatus === "RUNNING" ? "🟢 LIVE" : gameStatus === "PAUSED" ? "🟡 PAUSED" : "🔴 STOPPED"}
            </div>
            <button onClick={loadData} className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700">
              <RefreshCw size={18} />
            </button>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${
          message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500" : "bg-red-500/20 text-red-400 border border-red-500"
        }`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Tabs - Added "Transactions" tab */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 py-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
            { id: "users", label: "Users", icon: <Users size={18} /> },
            { id: "transactions", label: "Transactions", icon: <Wallet size={18} /> },
            { id: "games", label: "Games", icon: <Gamepad2 size={18} /> },
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
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-400">Active: {stats.activeUsers}</span>
                  <span className="text-red-400">Banned: {stats.bannedUsers}</span>
                </div>
              </div>
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <Wallet className="text-yellow-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Total Wallet</p>
                <p className="text-3xl font-bold text-yellow-400">₹{stats.totalWallet.toLocaleString()}</p>
              </div>
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <TrendingUp className="text-green-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Total Deposits</p>
                <p className="text-3xl font-bold text-green-400">₹{stats.totalDeposits.toLocaleString()}</p>
              </div>
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <TrendingDown className="text-red-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Total Withdrawals</p>
                <p className="text-3xl font-bold text-red-400">₹{stats.totalWithdrawals.toLocaleString()}</p>
              </div>
            </div>
            
            {/* Transaction Stats */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Wallet className="text-green-400" /> Transaction Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black rounded-xl p-4 text-center">
                  <p className="text-zinc-500 text-sm">Total Deposits</p>
                  <p className="text-2xl font-bold text-green-400">₹{transactionStats.totalDeposits.toLocaleString()}</p>
                </div>
                <div className="bg-black rounded-xl p-4 text-center">
                  <p className="text-zinc-500 text-sm">Total Withdrawals</p>
                  <p className="text-2xl font-bold text-red-400">₹{transactionStats.totalWithdrawals.toLocaleString()}</p>
                </div>
                <div className="bg-black rounded-xl p-4 text-center">
                  <p className="text-zinc-500 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{transactionStats.pendingDeposits + transactionStats.pendingWithdrawals}</p>
                </div>
                <div className="bg-black rounded-xl p-4 text-center">
                  <p className="text-zinc-500 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{transactionStats.totalCompleted}</p>
                </div>
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
                  className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl w-64 focus:border-green-500 outline-none text-sm"
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
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.isBanned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                          }`}>
                            {user.isBanned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder="Amount"
                                value={walletAmount[user._id] || ""}
                                onChange={(e) => setWalletAmount(prev => ({ ...prev, [user._id]: e.target.value }))}
                                className="w-20 bg-black border border-zinc-700 rounded-lg px-2 py-1 text-sm"
                              />
                              <button onClick={() => updateUserWallet(user._id, Number(walletAmount[user._id]), "add")} className="p-1.5 bg-green-600 rounded-lg hover:bg-green-700">
                                <Plus size={14} />
                              </button>
                              <button onClick={() => updateUserWallet(user._id, Number(walletAmount[user._id]), "remove")} className="p-1.5 bg-red-600 rounded-lg hover:bg-red-700">
                                <Minus size={14} />
                              </button>
                            </div>
                            <button onClick={() => toggleBan(user._id, user.isBanned)} className="p-1.5 bg-yellow-600 rounded-lg hover:bg-yellow-700">
                              <Ban size={14} />
                            </button>
                            <button onClick={() => deleteUser(user._id)} className="p-1.5 bg-red-600 rounded-lg hover:bg-red-700">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ TRANSACTIONS TAB ============ */}
        {activeTab === "transactions" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-3xl font-black">Transactions Management</h2>
              <div className="flex flex-wrap gap-3">
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-green-500 outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdraw">Withdrawals</option>
                </select>
                <select
                  value={transactionStatus}
                  onChange={(e) => setTransactionStatus(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-green-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={loadTransactions}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800">
                    <tr className="text-left text-zinc-400 text-sm">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 50).map((tx) => (
                      <tr key={tx._id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{tx.userName}</p>
                            <p className="text-xs text-zinc-500">{tx.userUid}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            tx.type === "deposit" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          }`}>
                            {tx.type === "deposit" ? "Deposit" : "Withdraw"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(tx.method)}
                            <span className="text-sm">{getMethodLabel(tx.method)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold">
                          <span className={tx.type === "deposit" ? "text-green-400" : "text-red-400"}>
                            {tx.type === "deposit" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            {tx.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {tx.status === "pending" && (
                            <button
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setAdminNote("");
                                setShowTransactionModal(true);
                              }}
                              className="bg-green-500 hover:bg-green-600 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                              Process
                            </button>
                          )}
                          {tx.status === "approved" && tx.type === "withdraw" && (
                            <button
                              onClick={() => handleCompleteWithdrawal(tx._id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                              Complete
                            </button>
                          )}
                          {tx.status === "pending" && (
                            <button
                              onClick={() => handleRejectTransaction(tx._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition ml-1"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-zinc-500">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Games Tab - Keep existing game controls */}
        {activeTab === "games" && (
          <div>
            <h2 className="text-3xl font-black mb-6">Game Control</h2>
            
            {/* Game Status Controls */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button onClick={() => updateGameStatus("RUNNING")} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                <Play size={14} /> Start All Games
              </button>
              <button onClick={() => updateGameStatus("PAUSED")} className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                <Pause size={14} /> Pause All Games
              </button>
              <button onClick={() => updateGameStatus("STOPPED")} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                <StopCircle size={14} /> Stop All Games
              </button>
            </div>

            {/* Game Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {gamesList.map(game => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                    selectedGame === game.id ? "bg-green-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  <span className="text-xl">{game.icon}</span>
                  {game.name}
                </button>
              ))}
            </div>

            {/* Color Trade Control */}
            {selectedGame === "colorTrade" && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Circle className="text-pink-400" /> Color Trade Control
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.minBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter min bet:", currentGame.minBet.toString());
                        if (val) updateGameSetting("colorTrade", "minBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.maxBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter max bet:", currentGame.maxBet.toString());
                        if (val) updateGameSetting("colorTrade", "maxBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Game Status</label>
                    <button onClick={() => updateGameSetting("colorTrade", "enabled", !currentGame.enabled)} 
                      className={`px-4 py-2 rounded-xl text-sm font-bold ${currentGame.enabled ? "bg-green-500 text-black" : "bg-red-500 text-white"}`}>
                      {currentGame.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Last Forced Result</label>
                    <div className="mt-1 p-2 bg-black rounded-lg text-center">
                      <span className="text-yellow-400">
                        {currentGame.lastForcedResult?.result || "None"}
                      </span>
                      {currentGame.lastForcedResult?.timestamp && (
                        <span className="text-xs text-zinc-500 block">
                          {currentGame.lastForcedResult.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Color Multipliers</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-500/20 rounded-xl p-4 text-center">
                      <p className="text-green-400 font-bold">🟢 GREEN</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.greenMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter GREEN multiplier:", currentGame.greenMultiplier.toString());
                          if (val) updateGameSetting("colorTrade", "greenMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                      <p className="text-purple-400 font-bold">🟣 VIOLET</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.violetMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter VIOLET multiplier:", currentGame.violetMultiplier.toString());
                          if (val) updateGameSetting("colorTrade", "violetMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-red-500/20 rounded-xl p-4 text-center">
                      <p className="text-red-400 font-bold">🔴 RED</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.redMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter RED multiplier:", currentGame.redMultiplier.toString());
                          if (val) updateGameSetting("colorTrade", "redMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Number & Size Multipliers</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black rounded-xl p-4 text-center">
                      <p className="text-yellow-400 font-bold">🔢 Numbers (0-9)</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.numberMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter number multiplier:", currentGame.numberMultiplier.toString());
                          if (val) updateGameSetting("colorTrade", "numberMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-center">
                      <p className="text-blue-400 font-bold">📊 BIG (5-9)</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.bigMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter BIG multiplier:", currentGame.bigMultiplier.toString());
                          if (val) updateGameSetting("colorTrade", "bigMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-center">
                      <p className="text-cyan-400 font-bold">📉 SMALL (0-4)</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.smallMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter SMALL multiplier:", currentGame.smallMultiplier.toString());
                          if (val) updateGameSetting("colorTrade", "smallMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORCE RESULT SECTION */}
                <div className="bg-linear-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/30">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Target className="text-purple-400" /> Force Result
                  </h4>
                  
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <button onClick={() => forceGameResult("colorTrade", "GREEN")} className="bg-green-600 hover:bg-green-500 py-2 rounded-lg font-bold transition">FORCE GREEN</button>
                    <button onClick={() => forceGameResult("colorTrade", "VIOLET")} className="bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold transition">FORCE VIOLET</button>
                    <button onClick={() => forceGameResult("colorTrade", "RED")} className="bg-red-600 hover:bg-red-500 py-2 rounded-lg font-bold transition">FORCE RED</button>
                    <button onClick={() => forceGameResult("colorTrade", "BIG")} className="bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold transition">FORCE BIG</button>
                    <button onClick={() => forceGameResult("colorTrade", "SMALL")} className="bg-cyan-600 hover:bg-cyan-500 py-2 rounded-lg font-bold transition">FORCE SMALL</button>
                    <div className="grid grid-cols-5 gap-1 col-span-2">
                      {[0,1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => forceGameResult("colorTrade", n.toString())} className="bg-zinc-700 hover:bg-green-600 py-1 rounded-lg text-sm font-bold transition">{n}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Custom result (e.g., 7 or BIG)"
                      value={forceResultValue}
                      onChange={(e) => setForceResultValue(e.target.value)}
                      className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:border-purple-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (forceResultValue) {
                          forceGameResult("colorTrade", forceResultValue.toUpperCase());
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2"
                    >
                      <Send size={14} /> Force
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mines Control */}
            {selectedGame === "mines" && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="text-orange-400" /> Mines Control
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.minBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter min bet:", currentGame.minBet.toString());
                        if (val) updateGameSetting("mines", "minBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.maxBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter max bet:", currentGame.maxBet.toString());
                        if (val) updateGameSetting("mines", "maxBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Mines</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">{currentGame.maxMines}</span>
                      <button onClick={() => {
                        const val = prompt("Enter max mines:", currentGame.maxMines.toString());
                        if (val) updateGameSetting("mines", "maxMines", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Last Forced Result</label>
                    <div className="mt-1 p-2 bg-black rounded-lg text-center">
                      <span className="text-yellow-400">
                        {currentGame.lastForcedResult?.result || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Multiplier Table</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {currentGame.multipliers.map((multi: number, i: number) => (
                      <div key={i} className="bg-black rounded-xl p-3 text-center">
                        <p className="text-sm text-zinc-400">{i+1} Mine{i !== 0 ? "s" : ""}</p>
                        <p className="text-xl font-bold text-green-400">{multi}x</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FORCE MINES RESULT */}
                <div className="bg-linear-to-r from-orange-900/20 to-yellow-900/20 rounded-xl p-6 border border-orange-500/30">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Target className="text-orange-400" /> Force Result
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button key={n} onClick={() => forceGameResult("mines", `MINE_${n}`)} className="bg-zinc-700 hover:bg-orange-600 py-2 rounded-lg font-bold transition">
                        {n} Mines
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sky Aviator Control */}
            {selectedGame === "sky" && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <TrendUp className="text-cyan-400" /> Sky Aviator Control
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.minBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter min bet:", currentGame.minBet.toString());
                        if (val) updateGameSetting("sky", "minBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.maxBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter max bet:", currentGame.maxBet.toString());
                        if (val) updateGameSetting("sky", "maxBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Multiplier</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">{currentGame.maxMultiplier}x</span>
                      <button onClick={() => {
                        const val = prompt("Enter max multiplier:", currentGame.maxMultiplier.toString());
                        if (val) updateGameSetting("sky", "maxMultiplier", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Last Forced Result</label>
                    <div className="mt-1 p-2 bg-black rounded-lg text-center">
                      <span className="text-yellow-400">
                        {currentGame.lastForcedResult?.result || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FORCE SKY RESULT */}
                <div className="bg-linear-to-r from-cyan-900/20 to-blue-900/20 rounded-xl p-6 border border-cyan-500/30">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Target className="text-cyan-400" /> Force Crash
                  </h4>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[1.5, 2, 3, 5, 10, 20, 50, 100].map(m => (
                      <button key={m} onClick={() => forceGameResult("sky", `${m}x`)} className="bg-zinc-800 hover:bg-yellow-600 py-2 rounded-lg font-bold transition">{m}x</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => forceGameResult("sky", "RANDOM")} className="bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold transition">🎲 RANDOM CRASH</button>
                    <button onClick={() => forceGameResult("sky", "INSTANT")} className="bg-red-600 hover:bg-red-500 py-2 rounded-lg font-bold transition">💥 INSTANT CRASH</button>
                  </div>
                </div>
              </div>
            )}

            {/* Spin Wheel Control */}
            {selectedGame === "spin" && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="text-indigo-400" /> Spin Wheel Control
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.minBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter min bet:", currentGame.minBet.toString());
                        if (val) updateGameSetting("spin", "minBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.maxBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter max bet:", currentGame.maxBet.toString());
                        if (val) updateGameSetting("spin", "maxBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Last Forced Result</label>
                    <div className="mt-1 p-2 bg-black rounded-lg text-center">
                      <span className="text-yellow-400">
                        {currentGame.lastForcedResult?.result || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Card Multipliers</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-red-500/20 rounded-xl p-4 text-center">
                      <p className="text-red-400 font-bold">♥ HEARTS</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.heartsMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter HEARTS multiplier:", currentGame.heartsMultiplier.toString());
                          if (val) updateGameSetting("spin", "heartsMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-gray-500/20 rounded-xl p-4 text-center">
                      <p className="text-gray-400 font-bold">♠ SPADES</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.spadesMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter SPADES multiplier:", currentGame.spadesMultiplier.toString());
                          if (val) updateGameSetting("spin", "spadesMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 text-center">
                      <p className="text-green-400 font-bold">♣ CLUBS</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.clubsMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter CLUBS multiplier:", currentGame.clubsMultiplier.toString());
                          if (val) updateGameSetting("spin", "clubsMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                      <p className="text-blue-400 font-bold">♦ DIAMONDS</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">{currentGame.diamondsMultiplier}x</span>
                        <button onClick={() => {
                          const val = prompt("Enter DIAMONDS multiplier:", currentGame.diamondsMultiplier.toString());
                          if (val) updateGameSetting("spin", "diamondsMultiplier", Number(val));
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORCE CARD */}
                <div className="bg-linear-to-r from-indigo-900/20 to-purple-900/20 rounded-xl p-6 border border-indigo-500/30">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Target className="text-indigo-400" /> Force Card
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {["HEARTS", "SPADES", "CLUBS", "DIAMONDS"].map(card => (
                      <button key={card} onClick={() => forceGameResult("spin", card)} className="bg-zinc-800 hover:bg-green-600 py-2 rounded-lg font-bold transition">
                        {card === "HEARTS" && "♥"} {card === "SPADES" && "♠"} {card === "CLUBS" && "♣"} {card === "DIAMONDS" && "♦"} {card}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Plinko Control */}
            {selectedGame === "plinko" && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Zap className="text-emerald-400" /> Plinko Control
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.minBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter min bet:", currentGame.minBet.toString());
                        if (val) updateGameSetting("plinko", "minBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.maxBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter max bet:", currentGame.maxBet.toString());
                        if (val) updateGameSetting("plinko", "maxBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Last Forced Result</label>
                    <div className="mt-1 p-2 bg-black rounded-lg text-center">
                      <span className="text-yellow-400">
                        {currentGame.lastForcedResult?.result || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Risk Level Multipliers</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-500/20 rounded-xl p-4 text-center">
                      <p className="text-green-400 font-bold">🟢 LOW RISK</p>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {currentGame.multipliers?.LOW.map((m: number, i: number) => (
                          <span key={i} className="text-sm font-bold">{m}x</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-yellow-500/20 rounded-xl p-4 text-center">
                      <p className="text-yellow-400 font-bold">🟡 MEDIUM RISK</p>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {currentGame.multipliers?.MEDIUM.map((m: number, i: number) => (
                          <span key={i} className="text-sm font-bold">{m}x</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-red-500/20 rounded-xl p-4 text-center">
                      <p className="text-red-400 font-bold">🔴 HIGH RISK</p>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {currentGame.multipliers?.HIGH.map((m: number, i: number) => (
                          <span key={i} className="text-sm font-bold">{m}x</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORCE PLINKO RESULT */}
                <div className="bg-linear-to-r from-emerald-900/20 to-green-900/20 rounded-xl p-6 border border-emerald-500/30">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Target className="text-emerald-400" /> Force Multiplier
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[0.2, 0.5, 1, 2, 3, 5, 8, 10].map(m => (
                      <button key={m} onClick={() => forceGameResult("plinko", `${m}x`)} className="bg-zinc-800 hover:bg-green-600 py-2 rounded-lg font-bold transition">{m}x</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trading Control */}
            {selectedGame === "trading" && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <CandlestickChart className="text-blue-400" /> Trading Control
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.minBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter min bet:", currentGame.minBet.toString());
                        if (val) updateGameSetting("trading", "minBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{currentGame.maxBet}</span>
                      <button onClick={() => {
                        const val = prompt("Enter max bet:", currentGame.maxBet.toString());
                        if (val) updateGameSetting("trading", "maxBet", Number(val));
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Last Forced Result</label>
                    <div className="mt-1 p-2 bg-black rounded-lg text-center">
                      <span className="text-yellow-400">
                        {currentGame.lastForcedResult?.result || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Win/Loss Probability</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black rounded-xl p-4 text-center">
                      <p className="text-green-400 font-bold">Win Chance</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-3xl font-bold">{currentGame.winProbability}%</span>
                        <button onClick={() => {
                          const val = prompt("Enter win probability (0-100):", currentGame.winProbability.toString());
                          if (val) {
                            updateGameSetting("trading", "winProbability", Number(val));
                            updateGameSetting("trading", "lossProbability", 100 - Number(val));
                          }
                        }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-center">
                      <p className="text-red-400 font-bold">Loss Chance</p>
                      <span className="text-3xl font-bold">{currentGame.lossProbability}%</span>
                    </div>
                  </div>
                </div>

                {/* FORCE TRADING DIRECTION */}
                <div className="bg-linear-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/30">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Target className="text-blue-400" /> Force Chart Direction
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => forceGameResult("trading", "UP")} className="bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2">
                      <TrendUp size={18} /> FORCE UP
                    </button>
                    <button onClick={() => forceGameResult("trading", "DOWN")} className="bg-red-600 hover:bg-red-500 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2">
                      <TrendDown size={18} /> FORCE DOWN
                    </button>
                    <button onClick={() => forceGameResult("trading", "RANDOM")} className="bg-purple-600 hover:bg-purple-500 py-3 rounded-lg font-bold transition">🎲 RANDOM</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <h2 className="text-3xl font-black mb-6">Platform Settings</h2>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(platformSettings).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-zinc-500 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-bold">
                        {typeof value === "boolean" ? (value ? "ON" : "OFF") : 
                         typeof value === "number" ? (key.includes("Deposit") || key.includes("Withdraw") ? `₹${value}` : `${value}%`) : 
                         value}
                      </span>
                      <button onClick={() => {
                        const val = prompt(`Enter new value for ${key}:`, String(value));
                        if (val) {
                          if (typeof value === "boolean") updatePlatformSetting(key, val.toLowerCase() === "true");
                          else if (typeof value === "number") updatePlatformSetting(key, Number(val));
                          else updatePlatformSetting(key, val);
                        }
                      }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-lg w-full border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-green-400">Process Transaction</h3>
              <button onClick={() => setShowTransactionModal(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-black rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">User</span>
                  <span className="font-bold">{selectedTransaction.userName}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-zinc-500">Type</span>
                  <span className={`font-bold ${selectedTransaction.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                    {selectedTransaction.type === "deposit" ? "Deposit" : "Withdraw"}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-zinc-500">Amount</span>
                  <span className="font-bold text-yellow-400">₹{selectedTransaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-zinc-500">Method</span>
                  <span className="font-bold">{getMethodLabel(selectedTransaction.method)}</span>
                </div>
                {selectedTransaction.details?.upiId && (
                  <div className="flex justify-between mt-2">
                    <span className="text-zinc-500">UPI ID</span>
                    <span className="font-bold">{selectedTransaction.details.upiId}</span>
                  </div>
                )}
                {selectedTransaction.details?.bankAccount && (
                  <div className="mt-2">
                    <p className="text-zinc-500 text-sm">Bank Details</p>
                    <p className="text-sm">Account: {selectedTransaction.details.bankAccount}</p>
                    <p className="text-sm">Bank: {selectedTransaction.details.bankName}</p>
                    <p className="text-sm">IFSC: {selectedTransaction.details.ifscCode}</p>
                  </div>
                )}
                {selectedTransaction.details?.cryptoAddress && (
                  <div className="flex justify-between mt-2">
                    <span className="text-zinc-500">Crypto Address</span>
                    <span className="font-bold text-xs break-all">{selectedTransaction.details.cryptoAddress}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-zinc-400 text-sm block mb-2">Admin Notes</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add notes about this transaction..."
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none resize-none h-20"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveTransaction(selectedTransaction._id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRejectTransaction(selectedTransaction._id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
                >
                  Reject
                </button>
              </div>

              {selectedTransaction.type === "withdraw" && selectedTransaction.status === "approved" && (
                <button
                  onClick={() => handleCompleteWithdrawal(selectedTransaction._id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition"
                >
                  Complete Withdrawal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}