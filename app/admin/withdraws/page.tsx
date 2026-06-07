"use client";

import axios from "axios";

import {
  Wallet,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

type WithdrawType = {
  _id: string;
  username: string;
  amount: number;
  upiId: string;
  status: string;
  createdAt: string;
};

export default function WithdrawAdmin() {
  const [withdraws, setWithdraws] =
    useState<WithdrawType[]>([]);

  // Load Withdraws
  const fetchWithdraws = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/withdraw"
      );

      setWithdraws(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  // Approve
  const approveWithdraw = async (
    id: string
  ) => {
    try {
      await axios.put(
        `http://localhost:5000/api/withdraw/approve/${id}`
      );

      fetchWithdraws();
    } catch (error) {
      console.log(error);
    }
  };

  // Reject
  const rejectWithdraw = async (
    id: string
  ) => {
    try {
      await axios.put(
        `http://localhost:5000/api/withdraw/reject/${id}`
      );

      fetchWithdraws();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-green-500/10 p-4 rounded-2xl">
            <Wallet
              className="text-green-400"
              size={32}
            />
          </div>

          <div>
            <h1 className="text-5xl font-black text-green-400">
              Withdraw Requests
            </h1>

            <p className="text-zinc-500 mt-2">
              Malik.XGO Admin
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 bg-zinc-900 px-6 py-5 border-b border-zinc-800 text-zinc-400 font-bold">
            <p>User</p>

            <p>Amount</p>

            <p>UPI ID</p>

            <p>Status</p>

            <p>Date</p>

            <p>Actions</p>
          </div>

          {/* Data */}
          {withdraws.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              No withdraw requests
            </div>
          ) : (
            withdraws.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-6 gap-4 px-6 py-5 border-b border-zinc-900 items-center"
              >
                {/* User */}
                <div>
                  <h3 className="font-bold">
                    {item.username}
                  </h3>
                </div>

                {/* Amount */}
                <div>
                  <h3 className="text-green-400 font-black text-lg">
                    ₹{item.amount}
                  </h3>
                </div>

                {/* UPI */}
                <div>
                  <p className="text-zinc-400">
                    {item.upiId}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <span
                    className={`px-4 py-2 rounded-2xl text-sm font-bold ${
                      item.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : item.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Date */}
                <div>
                  <p className="text-zinc-500 text-sm">
                    {new Date(
                      item.createdAt
                    ).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      approveWithdraw(
                        item._id
                      )
                    }
                    className="bg-green-600 hover:bg-green-500 transition p-3 rounded-2xl"
                  >
                    <CheckCircle2 size={20} />
                  </button>

                  <button
                    onClick={() =>
                      rejectWithdraw(
                        item._id
                      )
                    }
                    className="bg-red-600 hover:bg-red-500 transition p-3 rounded-2xl"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
