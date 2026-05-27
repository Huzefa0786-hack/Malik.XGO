"use client";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

type TransactionType = {
  _id: string;

  type: string;

  amount: number;

  status: string;

  createdAt: string;
};

export default function HistoryPage() {
  const [history, setHistory] =
    useState<
      TransactionType[]
    >([]);

  useEffect(() => {
    const user =
      localStorage.getItem("user");

    if (!user) return;

    const parsed =
      JSON.parse(user);

    axios
      .get(
        `http://localhost:5000/api/transaction/${parsed.username}`
      )
      .then((res) => {
        setHistory(res.data);
      });
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl font-black text-green-400 mb-10">
          Transaction History
        </h1>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">

          {/* Header */}
          <div className="grid grid-cols-4 gap-4 bg-zinc-900 p-5 font-bold text-zinc-400">
            <p>Type</p>

            <p>Amount</p>

            <p>Status</p>

            <p>Date</p>
          </div>

          {/* Data */}
          {history.length ===
          0 ? (
            <div className="p-10 text-center text-zinc-500">
              No Transactions
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-4 gap-4 p-5 border-t border-zinc-900"
              >
                <p className="capitalize font-bold">
                  {item.type}
                </p>

                <p className="text-green-400 font-black">
                  ₹{item.amount}
                </p>

                <p>
                  {item.status}
                </p>

                <p className="text-zinc-500 text-sm">
                  {new Date(
                    item.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            ))
          )}

        </div>
      </div>
    </main>
  );
}