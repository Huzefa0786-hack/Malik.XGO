"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import { 
  ArrowLeft, Wallet, CreditCard, Banknote, 
  Coins, CheckCircle, Clock, AlertCircle, 
  Copy, Check, Loader2, Shield, ArrowUpRight
} from "lucide-react";

export default function WithdrawPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank" | "crypto">("upi");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    accountHolder: ""
  });
  const [cryptoAddress, setCryptoAddress] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/withdraw");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setWallet(parsedUser.wallet || 0);
  }, [router]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount < 500) {
      setError("Minimum withdrawal amount is ₹500");
      return;
    }

    if (withdrawAmount > 50000) {
      setError("Maximum withdrawal amount is ₹50,000");
      return;
    }

    if (withdrawAmount > wallet) {
      setError("Insufficient balance");
      return;
    }

    // Validate method details
    if (method === "upi" && !upiId) {
      setError("Please enter your UPI ID");
      return;
    }

    if (method === "bank" && (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.ifscCode)) {
      setError("Please fill all bank details");
      return;
    }

    if (method === "crypto" && !cryptoAddress) {
      setError("Please enter your crypto wallet address");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/transaction/withdraw/request", {
        amount: withdrawAmount,
        method,
        details: {
          upiId: method === "upi" ? upiId : undefined,
          bankAccount: method === "bank" ? bankDetails.accountNumber : undefined,
          bankName: method === "bank" ? bankDetails.bankName : undefined,
          ifscCode: method === "bank" ? bankDetails.ifscCode : undefined,
          accountHolder: method === "bank" ? bankDetails.accountHolder : undefined,
          cryptoAddress: method === "crypto" ? cryptoAddress : undefined
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setTransactionId(response.data.transaction.id);
        setAmount("");
        
        // Update wallet balance
        setWallet(prev => prev - withdrawAmount);
        
        setTimeout(() => {
          router.push("/withdraw-history");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <h1 className="text-3xl md:text-4xl font-black text-green-400 mb-2">Withdraw Funds</h1>
        <p className="text-zinc-400 mb-8">Transfer your winnings to your account</p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Withdraw Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Balance */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <p className="text-zinc-500 text-sm">Available Balance</p>
              <p className="text-3xl font-bold text-green-400">₹{wallet.toLocaleString()}</p>
            </div>

            {/* Withdrawal Method */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">Withdrawal Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "upi", label: "UPI", icon: <CreditCard size={20} /> },
                  { id: "bank", label: "Bank Transfer", icon: <Banknote size={20} /> },
                  { id: "crypto", label: "Crypto", icon: <Coins size={20} /> }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setMethod(option.id as any)}
                    className={`p-4 rounded-xl border-2 transition ${
                      method === option.id
                        ? "border-green-500 bg-green-500/10"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {option.icon}
                      <span className="text-sm font-bold">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Method Details */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">Account Details</h3>
              
              {method === "upi" && (
                <div>
                  <label className="text-zinc-400 text-sm block mb-2">UPI ID</label>
                  <input
                    type="text"
                    placeholder="your@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                  />
                  <p className="text-zinc-500 text-sm mt-2">Enter your UPI ID (e.g., example@paytm)</p>
                </div>
              )}

              {method === "bank" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-400 text-sm block mb-2">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      value={bankDetails.accountHolder}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolder: e.target.value }))}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm block mb-2">Account Number</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm block mb-2">Bank Name</label>
                    <input
                      type="text"
                      placeholder="Enter bank name"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm block mb-2">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="Enter IFSC code"
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {method === "crypto" && (
                <div>
                  <label className="text-zinc-400 text-sm block mb-2">Crypto Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter wallet address"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                  />
                  <p className="text-zinc-500 text-sm mt-2">We support USDT (BEP-20) and BTC</p>
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">Enter Amount</h3>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-bold text-xl">₹</span>
                <input
                  type="number"
                  placeholder="Enter amount (Min ₹500)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl pl-12 pr-4 py-4 text-xl font-bold focus:border-green-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold text-sm transition"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400 flex items-center gap-2">
                <Shield size={16} />
                Withdrawals are processed within 24 hours
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleWithdraw}
              disabled={loading || !amount}
              className="w-full bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl text-xl transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={20} />
                  Request Submitted!
                </>
              ) : (
                `Withdraw ₹${amount || 0}`
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl flex items-center gap-2 text-red-400">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl flex items-center gap-2 text-green-400">
                <CheckCircle size={18} />
                Withdrawal request submitted! Transaction ID: {transactionId}
              </div>
            )}
          </div>

          {/* Right - Info Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Withdrawal Limits */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-green-400" />
                Withdrawal Limits
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Minimum</span>
                  <span className="text-green-400 font-bold">₹500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Maximum</span>
                  <span className="text-green-400 font-bold">₹50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Per Day</span>
                  <span className="text-green-400 font-bold">₹1,00,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Processing Time</span>
                  <span className="text-green-400 font-bold">24 hrs</span>
                </div>
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <ArrowUpRight size={18} className="text-green-400" />
                Processing Steps
              </h4>
              <ol className="text-sm text-zinc-400 space-y-3">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Submit withdrawal request</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Admin reviews your request</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Amount transferred to your account</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <span>Status updated to completed</span>
                </li>
              </ol>
            </div>

            {/* Support */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
              <h4 className="font-bold mb-2">Need Help?</h4>
              <p className="text-sm text-zinc-400">
                Contact our support team for any withdrawal issues.
              </p>
              <button className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-sm transition">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}