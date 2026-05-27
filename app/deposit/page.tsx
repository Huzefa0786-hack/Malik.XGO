"use client";

import Link from "next/link";

import axios from "axios";

import {
  ArrowLeft,
  Wallet,
  IndianRupee,
  Copy,
  CheckCircle2,
} from "lucide-react";

import {
  useState,
  useEffect,
} from "react";

import toast from "react-hot-toast";

type UserType = {
  username: string;
  email: string;
  wallet: number;
};

export default function DepositPage() {
  const [amount, setAmount] = useState("");

  const [user, setUser] =
    useState<UserType | null>(null);

  const upiId = "matkaking@upi";

  // Load User
  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Copy UPI
  const copyUPI = async () => {
    await navigator.clipboard.writeText(
      upiId
    );

    toast.success("UPI Copied");
  };

  // Submit Deposit
  const handleDeposit = async () => {
    try {
      if (!amount) {
        return toast.error(
          "Enter amount"
        );
      }

      if (!user) {
        return toast.error(
          "Login required"
        );
      }

      await axios.post(
        "http://localhost:5000/api/deposit",
        {
          userId: user.email,
          username: user.username,
          amount: Number(amount),
        }
      );

      toast.success(
        "Deposit request submitted"
      );

      setAmount("");
    } catch (error) {
      toast.error("Deposit failed");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-green-400">
            Deposit Funds
          </h1>

          <p className="text-zinc-500 mt-3 text-lg">
            Add balance to your wallet
          </p>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            {/* Top */}
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-green-500/10 p-4 rounded-2xl">
                <Wallet
                  className="text-green-400"
                  size={32}
                />
              </div>

              <div>
                <h2 className="text-3xl font-black">
                  Deposit
                </h2>

                <p className="text-zinc-500">
                  Instant recharge request
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="text-zinc-400 text-sm block mb-3">
                Enter Amount
              </label>

              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-5">
                <IndianRupee
                  size={24}
                  className="text-green-400"
                />

                <input
                  type="number"
                  placeholder="500"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  className="w-full bg-transparent outline-none px-3 py-5 text-2xl font-bold"
                />
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[100, 500, 1000, 5000].map(
                (amt) => (
                  <button
                    key={amt}
                    onClick={() =>
                      setAmount(
                        String(amt)
                      )
                    }
                    className="bg-zinc-900 border border-zinc-800 hover:border-green-500 rounded-2xl py-4 transition font-bold"
                  >
                    ₹{amt}
                  </button>
                )
              )}
            </div>

            {/* Button */}
            <button
              onClick={handleDeposit}
              className="w-full bg-green-600 hover:bg-green-500 transition rounded-2xl py-5 text-xl font-black"
            >
              Deposit Now
            </button>

            {/* Info */}
            <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-green-400 mt-1" />

                <div>
                  <h3 className="font-bold mb-1">
                    Secure Payment
                  </h3>

                  <p className="text-zinc-500 text-sm">
                    Wallet balance updates
                    after admin approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-8">
              UPI Payment
            </h2>

            {/* QR */}
            <div className="bg-white rounded-3xl p-6 flex items-center justify-center mb-8">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${upiId}`}
                alt="QR"
                className="rounded-2xl"
              />
            </div>

            {/* UPI ID */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
              <p className="text-zinc-500 text-sm mb-2">
                UPI ID
              </p>

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {upiId}
                </h3>

                <button
                  onClick={copyUPI}
                  className="bg-green-600 hover:bg-green-500 transition p-3 rounded-xl"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="font-semibold">
                  1. Scan QR code
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="font-semibold">
                  2. Pay amount
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="font-semibold">
                  3. Click Deposit Now
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="font-semibold">
                  4. Admin approves payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}