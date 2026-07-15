"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import { 
  ArrowLeft, Wallet, CreditCard, Banknote, 
  Coins, CheckCircle, Clock, AlertCircle, 
  Copy, Check, Loader2, Shield, ArrowUpRight,
  TrendingUp, TrendingDown, Filter, Search
} from "lucide-react";

interface Transaction {
  _id: string;
  type: "deposit" | "withdraw";
  amount: number;
  method: "upi" | "bank" | "crypto" | "wallet";
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  createdAt: string;
  details: any;
}

export default function TransactionHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdraw">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/transaction/history");
      if (response.data.success) {
        setTransactions(response.data.transactions);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-400 bg-green-500/20";
      case "pending": return "text-yellow-400 bg-yellow-500/20";
      case "approved": return "text-blue-400 bg-blue-500/20";
      case "rejected": return "text-red-400 bg-red-500/20";
      case "failed": return "text-red-400 bg-red-500/20";
      default: return "text-zinc-400 bg-zinc-500/20";
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
      case "bank": return "Bank";
      case "crypto": return "Crypto";
      default: return "Wallet";
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter !== "all" && t.type !== filter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-green-400">Transactions</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Total Deposits</p>
            <p className="text-3xl font-bold text-green-400">₹{stats.totalDeposits.toLocaleString()}</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Total Withdrawals</p>
            <p className="text-3xl font-bold text-red-400">₹{stats.totalWithdrawals.toLocaleString()}</p>
          </div>
          <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Pending Requests</p>
            <p className="text-3xl font-bold text-yellow-400">₹{stats.totalPending.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {["all", "deposit", "withdraw"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  filter === f
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {f === "all" ? "All" : f === "deposit" ? "Deposits" : "Withdrawals"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {["all", "pending", "completed", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  statusFilter === s
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-800">
              <Wallet size={48} className="mx-auto text-zinc-500 mb-4" />
              <p className="text-zinc-500 text-lg">No transactions found</p>
              <p className="text-zinc-600 text-sm">Start playing to see your transaction history</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx._id} className="bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-800 hover:border-green-500/30 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      tx.type === "deposit" ? "bg-green-500/20" : "bg-red-500/20"
                    }`}>
                      {tx.type === "deposit" ? (
                        <TrendingUp size={24} className="text-green-400" />
                      ) : (
                        <TrendingDown size={24} className="text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold capitalize">{tx.type}</p>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span>{getMethodIcon(tx.method)}</span>
                        <span>{getMethodLabel(tx.method)}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-xl font-bold ${
                      tx.type === "deposit" ? "text-green-400" : "text-red-400"
                    }`}>
                      {tx.type === "deposit" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(tx.status)}`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {tx.details?.notes && (
                  <div className="mt-3 p-3 bg-black rounded-xl text-sm text-zinc-400">
                    {tx.details.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}