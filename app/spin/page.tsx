"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Wallet,
  Trophy,
  Timer,
} from "lucide-react";

export default function SpinningWheelPage() {
  const [wallet, setWallet] =
    useState(0);

  const [timer, setTimer] =
    useState(20);

  const [selectedCard, setSelectedCard] =
    useState("");

  const [betAmount, setBetAmount] =
    useState("");

  const [result, setResult] =
    useState("");

  // Load User
  useEffect(() => {
    const user =
      localStorage.getItem("user");

    if (user) {
      const parsed = JSON.parse(user);

      setWallet(parsed.wallet);
    }
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          spinWheel();

          return 20;
        }

        return prev - 1;
      });
    }, 1000);

    return () =>
      clearInterval(interval);
  }, []);

  // Spin Result
  const spinWheel = () => {
    const cards = [
      "hearts",
      "spades",
      "clubs",
      "diamonds",
    ];

    const random =
      cards[
        Math.floor(
          Math.random() *
            cards.length
        )
      ];

    setResult(random);
  };

  // Place Bet
  const placeBet = () => {
    if (!selectedCard) {
      return alert(
        "Select card"
      );
    }

    if (!betAmount) {
      return alert(
        "Enter amount"
      );
    }

    if (
      Number(betAmount) > wallet
    ) {
      return alert(
        "Insufficient balance"
      );
    }

    const updatedWallet =
      wallet - Number(betAmount);

    setWallet(updatedWallet);

    const user =
      localStorage.getItem("user");

    if (user) {
      const parsed = JSON.parse(user);

      parsed.wallet =
        updatedWallet;

      localStorage.setItem(
        "user",
        JSON.stringify(parsed)
      );
    }

    alert(
      `Bet placed on ${selectedCard}`
    );
  };

  const cards = [
    {
      name: "hearts",
      symbol: "♥",
      color: "text-red-500",
      border: "border-red-500",
      bg: "bg-red-500/20",
    },

    {
      name: "spades",
      symbol: "♠",
      color: "text-black",
      border: "border-zinc-700",
      bg: "bg-zinc-800",
    },

    {
      name: "clubs",
      symbol: "♣",
      color: "text-green-400",
      border: "border-green-500",
      bg: "bg-green-500/20",
    },

    {
      name: "diamonds",
      symbol: "♦",
      color: "text-blue-400",
      border: "border-blue-500",
      bg: "bg-blue-500/20",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        {/* Top Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {/* Timer */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 p-4 rounded-2xl">
                <Timer
                  className="text-green-400"
                  size={32}
                />
              </div>

              <div>
                <p className="text-zinc-500">
                  Timer
                </p>

                <h2 className="text-5xl font-black text-green-400">
                  {timer}s
                </h2>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 p-4 rounded-2xl">
                <Wallet
                  className="text-green-400"
                  size={32}
                />
              </div>

              <div>
                <p className="text-zinc-500">
                  Wallet
                </p>

                <h2 className="text-5xl font-black text-green-400">
                  ₹{wallet}
                </h2>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 p-4 rounded-2xl">
                <Trophy
                  className="text-green-400"
                  size={32}
                />
              </div>

              <div>
                <p className="text-zinc-500">
                  Last Result
                </p>

                <h2 className="text-4xl font-black text-green-400 capitalize">
                  {result || "-"}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Wheel */}
        {/* Wheel */}
<div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-10 mb-10">
  <h2 className="text-4xl font-black mb-10">
    Spinning Wheel
  </h2>

  {/* Wheel Container */}
  <div className="flex justify-center mb-10">
    <div
      className={`relative w-96 h-96 rounded-full border-8 border-zinc-700 overflow-hidden transition-all duration-1000 ${
        timer <= 3
          ? "animate-spin"
          : ""
      }`}
    >
      {/* Hearts */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-red-500 flex items-center justify-center">
        <span className="text-7xl font-black text-white">
          ♥
        </span>
      </div>

      {/* Spades */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1/2 h-1/2 bg-zinc-900 flex items-center justify-center">
        <span className="text-7xl font-black text-white">
          ♠
        </span>
      </div>

      {/* Clubs */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-green-500 flex items-center justify-center">
        <span className="text-7xl font-black text-white">
          ♣
        </span>
      </div>

      {/* Diamonds */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-1/2 bg-blue-500 flex items-center justify-center">
        <span className="text-7xl font-black text-white">
          ♦
        </span>
      </div>

      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-black border-4 border-white z-50" />
      </div>
    </div>
  </div>

  {/* Select Cards */}
  <div className="grid md:grid-cols-4 gap-6">
    {cards.map((card) => (
      <button
        key={card.name}
        onClick={() =>
          setSelectedCard(
            card.name
          )
        }
        className={`h-32 rounded-3xl border-2 transition flex flex-col items-center justify-center ${
          selectedCard ===
          card.name
            ? `${card.bg} ${card.border}`
            : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
        }`}
      >
        <span
          className={`text-5xl font-black ${card.color}`}
        >
          {card.symbol}
        </span>

        <span
          className={`text-2xl font-black mt-2 capitalize ${card.color}`}
        >
          {card.name}
        </span>
      </button>
    ))}
  </div>
</div>

        {/* Betting */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-3xl font-black mb-8">
            Place Bet
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Enter Bet Amount"
              value={betAmount}
              onChange={(e) =>
                setBetAmount(
                  e.target.value
                )
              }
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-2xl font-bold"
            />

            <button
              onClick={placeBet}
              className="bg-green-600 hover:bg-green-500 transition rounded-2xl text-2xl font-black"
            >
              Place Bet
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
