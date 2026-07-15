"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import { 
  ArrowLeft, Wallet, CreditCard, Banknote, 
  Coins, CheckCircle, Clock, AlertCircle, 
  Copy, Check, QrCode, ArrowUpRight, Loader2
} from "lucide-react";

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank" | "crypto">("upi");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // UPI Details
  const upiDetails = {
    upiId: "malikxgo@paytm",
    name: "Malik.XGO Gaming",
    qrCode: "/upi-qr.png"
  };

  // Bank Details
  const bankDetails = {
    accountNumber: "1234567890",
    bankName: "State Bank of India",
    ifscCode: "SBIN0001234",
    accountHolder: "Malik.XGO Gaming Pvt Ltd",
    branch: "Mumbai Main Branch"
  };

  // Crypto Details
  const cryptoDetails = {
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    network: "BNB Smart Chain (BEP-20)",
    currency: "USDT"
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/deposit");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setWallet(parsedUser.wallet || 0);
  }, [router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount < 100) {
      setError("Minimum deposit amount is ₹100");
      return;
    }

    if (depositAmount > 100000) {
      setError("Maximum deposit amount is ₹100,000");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/transaction/deposit/request", {
        amount: depositAmount,
        method,
        details: {
          upiId: method === "upi" ? upiDetails.upiId : undefined,
          bankAccount: method === "bank" ? bankDetails.accountNumber : undefined,
          cryptoAddress: method === "crypto" ? cryptoDetails.address : undefined
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setTransactionId(response.data.transaction.id);
        setAmount("");
        
        // Show success message
        setTimeout(() => {
          router.push("/deposit-history");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate deposit");
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <h1 className="text-3xl md:text-4xl font-black text-green-400 mb-2">Deposit Funds</h1>
        <p className="text-zinc-400 mb-8">Add money to your wallet securely</p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Deposit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Balance */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <p className="text-zinc-500 text-sm">Current Balance</p>
              <p className="text-3xl font-bold text-green-400">₹{wallet.toLocaleString()}</p>
            </div>

            {/* Payment Method */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">Payment Method</h3>
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

            {/* Amount Input */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">Enter Amount</h3>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-bold text-xl">₹</span>
                <input
                  type="number"
                  placeholder="Enter amount (Min ₹100)"
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
            </div>

            {/* Submit Button */}
            <button
              onClick={handleDeposit}
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
                `Deposit ₹${amount || 0}`
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
                Deposit request submitted! Transaction ID: {transactionId}
              </div>
            )}
          </div>

          {/* Right - Payment Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* UPI Details */}
            {method === "upi" && (
              <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-green-400" />
                  UPI Details
                </h3>
                <div className="space-y-4">
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">UPI ID</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-bold text-green-400">{upiDetails.upiId}</p>
                      <button
                        onClick={() => handleCopy(upiDetails.upiId)}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
                      >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-black rounded-xl p-4 text-center">
                    <QrCode size={48} className="mx-auto text-green-400 mb-2" />
                    <p className="text-sm text-zinc-400">Scan QR to pay</p>
                  </div>
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Account Name</p>
                    <p className="text-white font-bold">{upiDetails.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details */}
            {method === "bank" && (
              <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Banknote size={18} className="text-green-400" />
                  Bank Details
                </h3>
                <div className="space-y-3">
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Account Number</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-bold text-green-400">{bankDetails.accountNumber}</p>
                      <button
                        onClick={() => handleCopy(bankDetails.accountNumber)}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
                      >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Bank Name</p>
                    <p className="text-white font-bold">{bankDetails.bankName}</p>
                  </div>
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">IFSC Code</p>
                    <p className="text-white font-bold">{bankDetails.ifscCode}</p>
                  </div>
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Account Holder</p>
                    <p className="text-white font-bold">{bankDetails.accountHolder}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Crypto Details */}
            {method === "crypto" && (
              <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Coins size={18} className="text-green-400" />
                  Crypto Details
                </h3>
                <div className="space-y-3">
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Network</p>
                    <p className="text-white font-bold">{cryptoDetails.network}</p>
                  </div>
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Currency</p>
                    <p className="text-white font-bold">{cryptoDetails.currency}</p>
                  </div>
                  <div className="bg-black rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Wallet Address</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-mono text-green-400 break-all">{cryptoDetails.address}</p>
                      <button
                        onClick={() => handleCopy(cryptoDetails.address)}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition shrink-0 ml-2"
                      >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Clock size={18} className="text-green-400" />
                Processing Time
              </h4>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex justify-between">
                  <span>UPI:</span>
                  <span className="text-green-400">Instant</span>
                </li>
                <li className="flex justify-between">
                  <span>Bank Transfer:</span>
                  <span className="text-green-400">15-30 mins</span>
                </li>
                <li className="flex justify-between">
                  <span>Crypto:</span>
                  <span className="text-green-400">5-15 mins</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}