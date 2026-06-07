"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Wallet,
  Users,
  Timer,
  Trophy,
  Coins,
} from "lucide-react";

export default function GamePage() {
  const [time, setTime] = useState(30);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        if (prev <= 0) {
          return 30;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/20 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full"></div>
      </div>

      {/* NAVBAR */}
      <nav className="border-b border-zinc-800 bg-black/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-2xl shadow-lg shadow-green-500/40">
              <Crown className="text-black" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black">
              Matka<span className="text-green-400">.king</span>
            </h1>
          </div>

          <button className="bg-green-500 text-black px-5 py-2 rounded-2xl font-bold shadow-lg shadow-green-500/40">
            Wallet ₹1000
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="xl:col-span-2">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 text-zinc-400">
                <Wallet size={18} />
                Wallet
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-green-400 mt-3">
                ₹1000
              </h2>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 text-zinc-400">
                <Users size={18} />
                Players
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-blue-400 mt-3">
                1245
              </h2>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 text-zinc-400">
                <Timer size={18} />
                Timer
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-red-400 mt-3">
                {time}s
              </h2>
            </div>
          </div>

          {/* NUMBER CARDS */}
          <div className="mt-6 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-black">
                Select Number
              </h2>

              <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-2xl">
                Live Round
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {cards.map((card) => (
                <button
                  key={card}
                  onClick={() => setSelectedCard(card)}
                  className={`aspect-square rounded-3xl text-3xl md:text-5xl font-black transition-all duration-300 ${
                    selectedCard === card
                      ? "bg-green-500 text-black scale-105 shadow-lg shadow-green-500/40"
                      : "bg-black border border-zinc-800 hover:border-green-500"
                  }`}
                >
                  {card}
                </button>
              ))}
            </div>
          </div>

          {/* BETTING */}
          <div className="mt-6 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-black mb-6">
              Place Bet
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[10, 50, 100, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`py-4 rounded-2xl font-black text-lg transition-all ${
                    betAmount === amount
                      ? "bg-green-500 text-black shadow-lg shadow-green-500/40"
                      : "bg-black border border-zinc-800"
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            <button className="w-full mt-6 bg-green-500 text-black py-5 rounded-3xl text-xl md:text-2xl font-black shadow-lg shadow-green-500/40 hover:scale-[1.01] transition-all">
              Place Bet
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* LIVE RESULTS */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-400" />

              <h2 className="text-2xl md:text-3xl font-black">
                Live Results
              </h2>
            </div>

            <div className="space-y-4">
              {[7, 3, 9, 1, 5].map((num, i) => (
                <div
                  key={i}
                  className="bg-black border border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
                >
                  <span className="text-zinc-400">
                    Round #{1200 + i}
                  </span>

                  <div className="w-14 h-14 rounded-2xl bg-green-500 text-black flex items-center justify-center text-2xl font-black shadow-lg shadow-green-500/40">
                    {num}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MULTIPLIER */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <Coins className="text-yellow-400" />

              <h2 className="text-2xl font-black">
                Winning Multiplier
              </h2>
            </div>

            <div className="bg-black border border-zinc-800 rounded-3xl p-8 text-center">
              <h1 className="text-6xl md:text-7xl font-black text-green-400">
                9x
              </h1>

              <p className="text-zinc-400 mt-4">
                Guess correct number and win rewards.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
