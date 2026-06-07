"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Wallet, ArrowLeft, CreditCard, Banknote, Lock } from "lucide-react";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState("online");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [router]);

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!amount || depositAmount < 100) {
      alert("Minimum deposit amount is ₹100");
      return;
    }
    
    if (depositAmount > 100000) {
      alert("Maximum deposit amount is ₹100,000");
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        "http://localhost:5000/api/wallet/deposit",
        { amount: depositAmount, method: selectedMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(response.data.message);
        // Update local user data
        const updatedUser = { ...user, wallet: response.data.newBalance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        router.push("/");
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 mb-6">
          <ArrowLeft size={20} /> Back
        </button>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="text-center mb-8">
            <Wallet size={48} className="text-green-400 mx-auto mb-4" />
            <h1 className="text-4xl font-black mb-2">Add Funds</h1>
            <p className="text-zinc-400">Instant deposit to your wallet</p>
          </div>
          
          <div className="bg-zinc-950 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-400">Current Balance</span>
              <span className="text-3xl font-bold text-green-400">₹{user?.wallet?.toLocaleString() || 0}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-zinc-400 mb-2">Enter Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min ₹100"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl p-4 text-white text-2xl font-bold outline-none focus:border-green-500"
            />
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold transition-colors"
              >
                ₹{amt}
              </button>
            ))}
          </div>
          
          <div className="mb-6">
            <label className="block text-zinc-400 mb-2">Payment Method</label>
            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedMethod("online")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === "online" 
                    ? "border-green-500 bg-green-500/10" 
                    : "border-zinc-700 bg-zinc-900"
                }`}
              >
                <CreditCard />
                <span className="font-bold">UPI / Cards</span>
              </button>
              <button
                onClick={() => setSelectedMethod("bank")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === "bank" 
                    ? "border-green-500 bg-green-500/10" 
                    : "border-zinc-700 bg-zinc-900"
                }`}
              >
                <Banknote />
                <span className="font-bold">Bank Transfer</span>
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDeposit}
            disabled={loading || !amount}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl text-xl transition-colors"
          >
            {loading ? "PROCESSING..." : `DEPOSIT ₹${amount || 0}`}
          </button>
          
          <div className="flex items-center justify-center gap-2 mt-6 text-zinc-500 text-sm">
            <Lock size={14} />
            <span>Secure Payment Gateway • Instant Credit</span>
          </div>
        </div>
      </div>
    </main>
  );
}