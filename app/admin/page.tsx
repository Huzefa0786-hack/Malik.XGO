"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Wallet, TrendingUp, TrendingDown, Activity,
  Settings, RefreshCw, Search, Ban, Trash2, Plus, Minus,
  DollarSign, Gamepad2, BarChart3, Crown, Edit2,
  Play, Pause, StopCircle, Target, Circle,
  Heart, Zap, Clock, LogOut, Shield,
  TrendingUp as TrendUp, TrendingDown as TrendDown, CandlestickChart,
  CreditCard, Banknote, Coins, CheckCircle, AlertCircle, Clock as ClockIcon
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

// Default game settings
const defaultGameSettings = {
  colorTrade: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    greenMultiplier: 2,
    violetMultiplier: 4.5,
    redMultiplier: 2,
    numberMultiplier: 9,
    bigMultiplier: 1.5,
    smallMultiplier: 1.5
  },
  mines: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    multipliers: [1.5, 2.0, 2.5, 3.2, 4.0, 5.0, 6.5, 8.0, 10.0, 12.5]
  },
  sky: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    maxMultiplier: 20,
    crashRate: 0.03
  },
  spin: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    heartsMultiplier: 2,
    spadesMultiplier: 3,
    clubsMultiplier: 4,
    diamondsMultiplier: 5
  },
  plinko: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    lowRisk: [1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2],
    mediumRisk: [2.0, 1.5, 1.0, 0.5, 0.2, 0.5, 1.0, 1.5, 2.0],
    highRisk: [10.0, 5.0, 2.0, 1.0, 0.2, 1.0, 2.0, 5.0, 10.0]
  },
  lottery: {
    enabled: true,
    ticketPrice: 10,
    jackpot: 100000,
    minWin: 3,
    maxWin: 10000
  },
  trading: {
    enabled: true,
    minBet: 10,
    maxBet: 10000,
    winProbability: 30,
    lossProbability: 70
  }
};

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<UserType[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [walletAmount, setWalletAmount] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  const [selectedGame, setSelectedGame] = useState("colorTrade");
  const [gameSettings, setGameSettings] = useState(defaultGameSettings);
  const [transactionFilter, setTransactionFilter] = useState<"all" | "deposit" | "withdraw">("all");
  const [transactionStatus, setTransactionStatus] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");

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
    totalWithdrawals: 72400,
    pendingDeposits: 0,
    pendingWithdrawals: 0
  });

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("admin");
    if (adminLoggedIn !== "true") {
      router.push("/admin-login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, transRes] = await Promise.all([
        fetch("http://localhost:5002/api/auth/users"),
        fetch("http://localhost:5002/api/transaction/admin/all", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        })
      ]);

      const usersData = await usersRes.json();
      const transData = await transRes.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
      setTransactions(transData.success ? transData.transactions : []);

      // Calculate stats
      const pendingDeposits = transData.transactions?.filter((t: TransactionType) => t.type === "deposit" && t.status === "pending").length || 0;
      const pendingWithdrawals = transData.transactions?.filter((t: TransactionType) => t.type === "withdraw" && t.status === "pending").length || 0;

      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length || 0,
        activeUsers: usersData.filter((u: UserType) => !u.isBanned).length || 0,
        bannedUsers: usersData.filter((u: UserType) => u.isBanned).length || 0,
        totalWallet: usersData.reduce((sum: number, u: UserType) => sum + (u.wallet || 0), 0),
        pendingDeposits,
        pendingWithdrawals
      }));
      
      const saved = localStorage.getItem("admin_game_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setGameSettings({ ...defaultGameSettings, ...parsed });
        } catch (e) {
          console.error("Failed to parse saved settings");
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
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

  const forceGameResult = (game: string, result: string) => {
    localStorage.setItem(`forced_${game}_result`, result);
    localStorage.setItem(`forced_result_timestamp`, Date.now().toString());
    showMessage(`${game} result forced to ${result}`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/admin-login");
  };

  const handleEdit = (game: string, setting: string, currentValue: number) => {
    const val = prompt(`Enter new value for ${setting}:`, currentValue.toString());
    if (val && !isNaN(Number(val))) {
      updateGameSetting(game, setting, Number(val));
    }
  };

  // ============ TRANSACTION HANDLERS ============
  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`http://localhost:5002/api/transaction/admin/approve/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ notes: adminNote })
      });

      const data = await response.json();
      if (data.success) {
        showMessage("Transaction approved successfully!", "success");
        loadData();
        setShowTransactionModal(false);
        setAdminNote("");
      } else {
        showMessage(data.error || "Failed to approve transaction", "error");
      }
    } catch (error) {
      showMessage("Failed to approve transaction", "error");
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to reject this transaction?")) return;

    try {
      const response = await fetch(`http://localhost:5002/api/transaction/admin/reject/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ notes: adminNote || "Transaction rejected by admin" })
      });

      const data = await response.json();
      if (data.success) {
        showMessage("Transaction rejected!", "success");
        loadData();
        setShowTransactionModal(false);
        setAdminNote("");
      } else {
        showMessage(data.error || "Failed to reject transaction", "error");
      }
    } catch (error) {
      showMessage("Failed to reject transaction", "error");
    }
  };

  const handleCompleteWithdrawal = async (transactionId: string) => {
    try {
      const response = await fetch(`http://localhost:5002/api/transaction/admin/complete-withdrawal/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();
      if (data.success) {
        showMessage("Withdrawal completed successfully!", "success");
        loadData();
        setShowTransactionModal(false);
      } else {
        showMessage(data.error || "Failed to complete withdrawal", "error");
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
      case "pending": return <ClockIcon size={16} className="text-yellow-400" />;
      case "rejected": return <AlertCircle size={16} className="text-red-400" />;
      default: return <ClockIcon size={16} className="text-zinc-400" />;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter !== "all" && t.type !== transactionFilter) return false;
    if (transactionStatus !== "all" && t.status !== transactionStatus) return false;
    return true;
  });

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const colorTrade = gameSettings.colorTrade;
  const mines = gameSettings.mines;
  const sky = gameSettings.sky;
  const spin = gameSettings.spin;
  const trading = gameSettings.trading;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="text-green-400" size={28} />
            <h1 className="text-2xl font-black text-green-400">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
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
                <p className="text-zinc-500 text-sm">Pending Deposits</p>
                <p className="text-3xl font-bold text-green-400">{stats.pendingDeposits}</p>
              </div>
              <div className="bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <TrendingDown className="text-red-400 mb-3" size={32} />
                <p className="text-zinc-500 text-sm">Pending Withdrawals</p>
                <p className="text-3xl font-bold text-red-400">{stats.pendingWithdrawals}</p>
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

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-3xl font-black">Transaction Management</h2>
              <div className="flex gap-3">
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
            {selectedGame === "colorTrade" && colorTrade && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Circle className="text-pink-400" /> Color Trade Control
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="text-zinc-500 text-sm">Min Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{colorTrade.minBet}</span>
                      <button onClick={() => handleEdit("colorTrade", "minBet", colorTrade.minBet)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Max Bet (₹)</label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xl font-bold">₹{colorTrade.maxBet}</span>
                      <button onClick={() => handleEdit("colorTrade", "maxBet", colorTrade.maxBet)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-sm">Game Status</label>
                    <div className="mt-1">
                      <button onClick={() => updateGameSetting("colorTrade", "enabled", !colorTrade.enabled)} 
                        className={`px-4 py-2 rounded-xl text-sm font-bold ${colorTrade.enabled ? "bg-green-500 text-black" : "bg-red-500 text-white"}`}>
                        {colorTrade.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold mb-3 text-lg">Color Multipliers</h4>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-500/20 rounded-xl p-4 text-center">
                    <p className="text-green-400 font-bold">🟢 GREEN</p>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <span className="text-2xl font-bold">{colorTrade.greenMultiplier}x</span>
                      <button onClick={() => handleEdit("colorTrade", "greenMultiplier", colorTrade.greenMultiplier)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                    </div>
                  </div>
                  <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                    <p className="text-purple-400 font-bold">🟣 VIOLET</p>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <span className="text-2xl font-bold">{colorTrade.violetMultiplier}x</span>
                      <button onClick={() => handleEdit("colorTrade", "violetMultiplier", colorTrade.violetMultiplier)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                    </div>
                  </div>
                  <div className="bg-red-500/20 rounded-xl p-4 text-center">
                    <p className="text-red-400 font-bold">🔴 RED</p>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <span className="text-2xl font-bold">{colorTrade.redMultiplier}x</span>
                      <button onClick={() => handleEdit("colorTrade", "redMultiplier", colorTrade.redMultiplier)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black rounded-xl p-4 text-center">
                    <p className="text-yellow-400 font-bold">🔢 NUMBERS (0-9)</p>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <span className="text-2xl font-bold">{colorTrade.numberMultiplier}x</span>
                      <button onClick={() => handleEdit("colorTrade", "numberMultiplier", colorTrade.numberMultiplier)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                    </div>
                  </div>
                  <div className="bg-black rounded-xl p-4 text-center">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-blue-400 font-bold">📊 BIG (5-9)</p>
                        <div className="flex justify-center items-center gap-2 mt-2">
                          <span className="text-2xl font-bold">{colorTrade.bigMultiplier}x</span>
                          <button onClick={() => handleEdit("colorTrade", "bigMultiplier", colorTrade.bigMultiplier)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                        </div>
                      </div>
                      <div>
                        <p className="text-cyan-400 font-bold">📉 SMALL (0-4)</p>
                        <div className="flex justify-center items-center gap-2 mt-2">
                          <span className="text-2xl font-bold">{colorTrade.smallMultiplier}x</span>
                          <button onClick={() => handleEdit("colorTrade", "smallMultiplier", colorTrade.smallMultiplier)} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black rounded-xl p-4">
                  <h4 className="font-bold mb-3">Force Result</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => forceGameResult("colorTrade", "GREEN")} className="bg-green-600 hover:bg-green-500 py-2 rounded-lg font-bold transition">🎲 FORCE GREEN</button>
                    <button onClick={() => forceGameResult("colorTrade", "VIOLET")} className="bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold transition">🎲 FORCE VIOLET</button>
                    <button onClick={() => forceGameResult("colorTrade", "RED")} className="bg-red-600 hover:bg-red-500 py-2 rounded-lg font-bold transition">🎲 FORCE RED</button>
                    <button onClick={() => forceGameResult("colorTrade", "BIG")} className="bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold transition">🎲 FORCE BIG</button>
                    <button onClick={() => forceGameResult("colorTrade", "SMALL")} className="bg-cyan-600 hover:bg-cyan-500 py-2 rounded-lg font-bold transition">🎲 FORCE SMALL</button>
                    <div className="grid grid-cols-5 gap-1 col-span-2">
                      {[0,1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => forceGameResult("colorTrade", n.toString())} className="bg-zinc-700 hover:bg-green-600 py-1 rounded-lg text-sm font-bold transition">{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other game controls remain the same... */}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <h2 className="text-3xl font-black mb-6">Platform Settings</h2>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-zinc-500 text-sm">Site Name</label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold">{platformSettings.siteName}</span>
                    <button onClick={() => {
                      const val = prompt("Enter site name:", platformSettings.siteName);
                      if (val) updatePlatformSetting("siteName", val);
                    }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Maintenance Mode</label>
                  <div className="mt-2">
                    <button onClick={() => updatePlatformSetting("maintenance", !platformSettings.maintenance)} 
                      className={`px-4 py-2 rounded-xl text-sm font-bold ${platformSettings.maintenance ? "bg-red-500 text-white" : "bg-green-500 text-black"}`}>
                      {platformSettings.maintenance ? "Maintenance ON" : "Maintenance OFF"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Deposit Bonus (%)</label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold">{platformSettings.depositBonus}%</span>
                    <button onClick={() => {
                      const val = prompt("Enter deposit bonus:", platformSettings.depositBonus.toString());
                      if (val) updatePlatformSetting("depositBonus", Number(val));
                    }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Referral Bonus (%)</label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold">{platformSettings.referralBonus}%</span>
                    <button onClick={() => {
                      const val = prompt("Enter referral bonus:", platformSettings.referralBonus.toString());
                      if (val) updatePlatformSetting("referralBonus", Number(val));
                    }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Min Deposit (₹)</label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold">₹{platformSettings.minDeposit}</span>
                    <button onClick={() => {
                      const val = prompt("Enter min deposit:", platformSettings.minDeposit.toString());
                      if (val) updatePlatformSetting("minDeposit", Number(val));
                    }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Max Deposit (₹)</label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold">₹{platformSettings.maxDeposit}</span>
                    <button onClick={() => {
                      const val = prompt("Enter max deposit:", platformSettings.maxDeposit.toString());
                      if (val) updatePlatformSetting("maxDeposit", Number(val));
                    }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Min Withdraw (₹)</label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold">₹{platformSettings.minWithdraw}</span>
                    <button onClick={() => {
                      const val = prompt("Enter min withdraw:", platformSettings.minWithdraw.toString());
                      if (val) updatePlatformSetting("minWithdraw", Number(val));
                    }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-sm">Max Withdraw (₹)</label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold">₹{platformSettings.maxWithdraw}</span>
                    <button onClick={() => {
                      const val = prompt("Enter max withdraw:", platformSettings.maxWithdraw.toString());
                      if (val) updatePlatformSetting("maxWithdraw", Number(val));
                    }} className="p-1 hover:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                  </div>
                </div>
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