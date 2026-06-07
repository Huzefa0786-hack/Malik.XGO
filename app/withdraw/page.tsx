"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Wallet, Copy, Check } from "lucide-react";

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    
    setUser(JSON.parse(userData));
    
    // Load saved UPI ID if exists
    const savedUpi = localStorage.getItem("upiId");
    if (savedUpi) setUpiId(savedUpi);
  }, [router]);

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || withdrawAmount < 500) {
      alert("Minimum withdrawal amount is ₹500");
      return;
    }
    
    if (!upiId) {
      alert("Please enter your UPI ID");
      return;
    }
    
    if (user?.wallet < withdrawAmount) {
      alert("Insufficient balance");
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        "http://localhost:5000/api/wallet/withdraw",
        { amount: withdrawAmount, upiId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(response.data.message);
        localStorage.setItem("upiId", upiId);
        // Update local user data
        const updatedUser = { ...user, wallet: response.data.newBalance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        router.push("/");
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 mb-6">
          <ArrowLeft size={20} /> Back
        </button>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="text-center mb-8">
            <Wallet size={48} className="text-green-400 mx-auto mb-4" />
            <h1 className="text-4xl font-black mb-2">Withdraw Funds</h1>
            <p className="text-zinc-400">Instant withdrawal to your bank account</p>
          </div>
          
          <div className="bg-zinc-950 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Available Balance</span>
              <span className="text-3xl font-bold text-green-400">₹{user?.wallet?.toLocaleString() || 0}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-zinc-400 mb-2">Enter Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min ₹500"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl p-4 text-white text-2xl font-bold outline-none focus:border-green-500"
            />
            <p className="text-zinc-500 text-sm mt-2">Max withdrawal: ₹50,000 per transaction</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-zinc-400 mb-2">UPI ID / Bank Account</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@okhdfcbank"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-green-500"
              />
              <button
                onClick={copyUpiId}
                className="bg-zinc-800 px-4 rounded-2xl hover:bg-zinc-700 transition-colors"
              >
                {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleWithdraw}
            disabled={loading || !amount || !upiId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-xl transition-colors"
          >
            {loading ? "PROCESSING..." : `WITHDRAW ₹${amount || 0}`}
          </button>
          
          <div className="mt-6 p-4 bg-zinc-950 rounded-2xl">
            <h3 className="font-bold mb-2">Withdrawal Rules:</h3>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>• Minimum withdrawal: ₹500</li>
              <li>• Maximum withdrawal: ₹50,000 per transaction</li>
              <li>• Processing time: Instant for UPI, 2-4 hours for banks</li>
              <li>• No withdrawal fees</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
