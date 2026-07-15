"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import { 
  ArrowLeft, Wallet, CreditCard, Banknote, 
  Coins, CheckCircle, Clock, AlertCircle, 
  Copy, Check, Loader2, Shield, ArrowUpRight,
  TrendingUp, TrendingDown, Filter, Search,
  Calendar, Download, RefreshCw
} from "lucide-react";

interface WithdrawTransaction {
  _id: string;
  type: "withdraw";
  amount: number;
  method: "upi" | "bank" | "crypto" | "wallet";
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  createdAt: string;
  details: {
    accountNumber: ReactNode;
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
}

export default function WithdrawHistory() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<WithdrawTransaction[]>([]);
  const [stats, setStats] = useState({
    totalWithdrawals: 0,
    totalPending: 0,
    totalCompleted: 0,
    totalRejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchWithdrawHistory();
  }, []);

  const fetchWithdrawHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/transaction/history?type=withdraw&limit=100");
      if (response.data.success) {
        setWithdrawals(response.data.transactions);
        const stats = response.data.stats || { totalWithdrawals: 0, totalPending: 0 };
        setStats({
          totalWithdrawals: stats.totalWithdrawals || 0,
          totalPending: stats.totalPending || 0,
          totalCompleted: withdrawals.filter(w => w.status === "completed").length,
          totalRejected: withdrawals.filter(w => w.status === "rejected").length
        });
      }
    } catch (error) {
      console.error("Failed to fetch withdrawal history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-400 bg-green-500/20 border-green-500/30";
      case "pending": return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "approved": return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "rejected": return "text-red-400 bg-red-500/20 border-red-500/30";
      case "failed": return "text-red-400 bg-red-500/20 border-red-500/30";
      default: return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle size={16} className="text-green-400" />;
      case "pending": return <Clock size={16} className="text-yellow-400" />;
      case "rejected": return <AlertCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-zinc-400" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "upi": return <CreditCard size={16} />;
      case "bank": return <Banknote size={16} />;
      case "crypto": return <Coins size={16} />;
      default: return <Wallet size={16} />;
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

  const filteredWithdrawals = withdrawals.filter(w => {
    if (filter !== "all" && w.status !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        w.amount.toString().includes(search) ||
        w.method.includes(search) ||
        w.status.includes(search) ||
        w._id.includes(search)
      );
    }
    if (dateRange.from && new Date(w.createdAt) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(w.createdAt) > new Date(dateRange.to)) return false;
    return true;
  });

  const totalAmount = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading withdrawal history...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-green-400">Withdrawal History</h1>
              <p className="text-zinc-400 text-sm">Track all your withdrawals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchWithdrawHistory}
              className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => {
                // Export CSV functionality
                const csv = filteredWithdrawals.map(w => ({
                  Date: new Date(w.createdAt).toLocaleString(),
                  Amount: w.amount,
                  Method: getMethodLabel(w.method),
                  Status: w.status,
                  TransactionId: w._id
                }));
                console.log("Export CSV:", csv);
              }}
              className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition"
              title="Export"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Total Withdrawals</p>
            <p className="text-2xl font-bold text-red-400">₹{stats.totalWithdrawals.toLocaleString()}</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{stats.totalCompleted}</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.totalPending}</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-blue-400">₹{totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {["all", "pending", "completed", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  filter === s
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search withdrawals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-green-500 outline-none"
              />
            </div>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-green-500 outline-none"
            />
            <span className="text-zinc-500 self-center">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-green-500 outline-none"
            />
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="space-y-3">
          {filteredWithdrawals.length === 0 ? (
            <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-800">
              <Wallet size={48} className="mx-auto text-zinc-500 mb-4" />
              <p className="text-zinc-500 text-lg">No withdrawals found</p>
              <p className="text-zinc-600 text-sm">Start playing to make your first withdrawal</p>
              <Link href="/withdraw" className="inline-block mt-4 bg-green-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-green-600 transition">
                Withdraw Now
              </Link>
            </div>
          ) : (
            filteredWithdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-800 hover:border-green-500/30 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/20">
                      <TrendingDown size={24} className="text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">Withdrawal</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span>{getMethodIcon(withdrawal.method)}</span>
                        <span>{getMethodLabel(withdrawal.method)}</span>
                        <span>•</span>
                        <span>{new Date(withdrawal.createdAt).toLocaleDateString()}</span>
                        <span>{new Date(withdrawal.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {withdrawal.details?.upiId && (
                        <p className="text-xs text-zinc-500 mt-1">UPI: {withdrawal.details.upiId}</p>
                      )}
                      {withdrawal.details?.bankAccount && (
                        <p className="text-xs text-zinc-500 mt-1">Bank: {withdrawal.details.bankName} - {withdrawal.details.accountNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-red-400">-₹{withdrawal.amount.toLocaleString()}</p>
                    {withdrawal.status === "pending" && (
                      <div className="text-xs text-yellow-400 animate-pulse">Processing...</div>
                    )}
                  </div>
                </div>
                {withdrawal.details?.notes && (
                  <div className="mt-3 p-3 bg-black rounded-xl text-sm text-zinc-400">
                    📝 {withdrawal.details.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredWithdrawals.length > 20 && (
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition">Previous</button>
              <button className="px-4 py-2 bg-green-500 text-black rounded-xl font-bold">1</button>
              <button className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition">2</button>
              <button className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition">3</button>
              <button className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition">Next</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}