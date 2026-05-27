"use client";

import Link from "next/link";
import axios from "axios";

import {
  ArrowLeft,
  Wallet,
  IndianRupee,
  Landmark,
  CheckCircle2,
} from "lucide-react";

import { useState, useEffect } from "react";

import toast from "react-hot-toast";

type UserType = {
  username: string;
  email: string;
  wallet: number;
};

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");

  const [upi, setUpi] = useState("");

  const [user, setUser] = useState<UserType | null>(
    null
  );

  useEffect(() => {
    const storedUser = localStorage.getItem(
      "user"
    );

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleWithdraw = async () => {
  try {
    if (!amount || !upi) {
      return toast.error(
        "Fill all fields"
      );
    }

    if (Number(amount) < 100) {
      return toast.error(
        "Minimum withdraw is ₹100"
      );
    }

    if (
      Number(amount) >
      (user?.wallet || 0)
    ) {
      return toast.error(
        "Insufficient balance"
      );
    }

    await axios.post(
      "http://localhost:5000/api/withdraw",
      {
        userId: user?.email,
        username: user?.username,
        amount,
        upiId: upi,
      }
    );

    toast.success(
      "Withdraw request submitted"
    );

    setAmount("");

    setUpi("");
  } catch (error) {
    toast.error("Withdraw failed");
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
            Withdraw Funds
          </h1>

          <p className="text-zinc-500 mt-3 text-lg">
            Withdraw winnings directly to
            your UPI account
          </p>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left */}
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
                  Withdraw
                </h2>

                <p className="text-zinc-500">
                  Instant payout request
                </p>
              </div>
            </div>

            {/* Wallet */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
              <p className="text-zinc-500 text-sm mb-2">
                Available Balance
              </p>

              <h2 className="text-5xl font-black text-green-400">
                ₹{user?.wallet || 0}
              </h2>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="text-zinc-400 text-sm block mb-3">
                Withdraw Amount
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
                    setAmount(e.target.value)
                  }
                  className="w-full bg-transparent outline-none px-3 py-5 text-2xl font-bold"
                />
              </div>
            </div>

            {/* UPI */}
            <div className="mb-8">
              <label className="text-zinc-400 text-sm block mb-3">
                UPI ID
              </label>

              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-5">
                <Landmark
                  size={22}
                  className="text-green-400"
                />

                <input
                  type="text"
                  placeholder="yourupi@paytm"
                  value={upi}
                  onChange={(e) =>
                    setUpi(e.target.value)
                  }
                  className="w-full bg-transparent outline-none px-3 py-5 text-lg"
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
                      setAmount(String(amt))
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
              onClick={handleWithdraw}
              className="w-full bg-green-600 hover:bg-green-500 transition rounded-2xl py-5 text-xl font-black"
            >
              Withdraw Now
            </button>
          </div>

          {/* Right */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-8">
              Withdrawal Info
            </h2>

            {/* Rules */}
            <div className="space-y-5">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-green-400 mt-1" />

                  <div>
                    <h3 className="font-bold mb-1">
                      Minimum Withdraw
                    </h3>

                    <p className="text-zinc-500 text-sm">
                      Minimum withdrawal amount
                      is ₹100.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-green-400 mt-1" />

                  <div>
                    <h3 className="font-bold mb-1">
                      Processing Time
                    </h3>

                    <p className="text-zinc-500 text-sm">
                      Withdrawals are processed
                      within 5-30 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-green-400 mt-1" />

                  <div>
                    <h3 className="font-bold mb-1">
                      Secure Payouts
                    </h3>

                    <p className="text-zinc-500 text-sm">
                      All transactions are
                      encrypted and verified
                      securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
              <h3 className="text-green-400 font-bold text-lg mb-2">
                Withdrawal Status
              </h3>

              <p className="text-zinc-300">
                No pending withdrawal requests
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}