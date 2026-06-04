"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock3,
  Trophy,
  Users,
  Crown,
} from "lucide-react";

export default function ColorTradePage() {
  const [wallet, setWallet] = useState(5000);

  const [timer, setTimer] = useState(30);

  const [period, setPeriod] =
    useState("202606030001");

  const [selectedType, setSelectedType] =
    useState("");

  const [selectedValue, setSelectedValue] =
    useState("");

  const [betAmount, setBetAmount] =
    useState(100);

  const [showBetModal, setShowBetModal] =
    useState(false);

 const [history, setHistory] = useState<
  {
    type: string;
    value: string;
    amount: number;
    status: string;
  }[]
>([]);

  const [results, setResults] = useState<
  {
    number: number;
    color: string;
  }[]
>([]);

  const [onlineUsers, setOnlineUsers] =
    useState(2847);

 const [liveWins, setLiveWins] =
  useState([
    "Rahul won ₹4,500",
    "Aryan won ₹8,200",
    "Kabir won ₹2,900",
  ]);

const generateResult = () => {
  const number = Math.floor(
    Math.random() * 10
  );

  let color = "GREEN";

  if (
    number === 0 ||
    number === 5
  ) {
    color = "VIOLET";
  } else if (
    number % 2 === 0
  ) {
    color = "RED";
  }

  setResults((prev) => [
    {
      number,
      color,
    },
    ...prev.slice(0, 9),
  ]);

  setPeriod((prev) =>
    String(Number(prev) + 1)
  );
};

useEffect(() => {
  generateResult();

  const interval = setInterval(
    generateResult,
    30000
  );

  return () =>
    clearInterval(interval);
}, []);

  useEffect(() => {

    const interval = setInterval(() => {

      const names = [
        "Rahul",
        "Aryan",
        "Kabir",
        "Ayaan",
        "Rohit",
      ];

      const winner =
        names[
          Math.floor(
            Math.random() *
              names.length
          )
        ];

      const amount =
        Math.floor(
          Math.random() *
            9000
        ) + 1000;

      setLiveWins(
        (prev) => [
          `${winner} won ₹${amount}`,
          ...prev.slice(
            0,
            4
          ),
        ]
      );

      setOnlineUsers(
        (prev) =>
          prev +
          Math.floor(
            Math.random() * 3
          )
      );

    }, 5000);

    return () =>
      clearInterval(
        interval
      );

  }, []);

useEffect(() => {

  const generateResult = () => {

    const number =
      Math.floor(
        Math.random() * 10
      );

    let color = "GREEN";

    if (
      number === 0 ||
      number === 5
    ) {
      color = "VIOLET";
    } else if (
      number % 2 === 0
    ) {
      color = "RED";
    }

    setResults((prev: any) => [
      {
        number,
        color,
      },
      ...prev.slice(0, 9),
    ]);
  };

  generateResult();

  const interval =
    setInterval(
      generateResult,
      30000
    );

  return () =>
    clearInterval(interval);

}, []);
const placeBet = () => {
  if (!selectedValue) {
    alert("Select an option");
    return;
  }

  if (betAmount <= 0) {
    alert("Invalid bet amount");
    return;
  }

  if (betAmount > wallet) {
    alert("Insufficient balance");
    return;
  }

  setWallet((prev) => prev - betAmount);

  setHistory((prev) => [
    {
      type: selectedType,
      value: selectedValue,
      amount: betAmount,
      status: "Pending",
    },
    ...prev,
  ]);

  setShowBetModal(false);

  alert(`Bet placed on ${selectedValue}`);
};
  return (
    <main className="min-h-screen bg-black text-white">

      {/* Background */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 blur-[150px] rounded-full" />

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full" />

      </div>

      {/* Header */}

      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">

        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <Crown className="text-green-400" />

            <span className="text-3xl font-black text-green-400">
              MATKA.KING
            </span>

          </Link>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-2">

            <Wallet className="text-green-400" />

            <span className="font-black text-green-400">
              ₹{wallet}
            </span>

          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto p-4">

        {/* Wallet Card */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">

          <h2 className="text-center text-3xl font-black">
            Wallet Balance
          </h2>

          <h1 className="text-center text-6xl font-black text-green-400 mt-4">
            ₹{wallet}
          </h1>

          <div className="grid grid-cols-2 gap-4 mt-6">

            <Link
              href="/withdraw"
              className="bg-red-500 rounded-2xl py-4 text-center font-black"
            >
              <ArrowUpCircle className="mx-auto mb-2" />
              Withdraw
            </Link>

            <Link
              href="/deposit"
              className="bg-green-500 text-black rounded-2xl py-4 text-center font-black"
            >
              <ArrowDownCircle className="mx-auto mb-2" />
              Deposit
            </Link>

          </div>

        </div>

        {/* Timer Card */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">

          <div className="flex justify-between items-center">

            <div>

              <h2 className="text-3xl font-black">
                WinGo 30s
              </h2>

              <p className="text-zinc-500 mt-2">
                Period: {period}
              </p>

            </div>

            <div className="text-center">

              <Clock3 className="mx-auto text-green-400 mb-2" />

              <h1 className="text-6xl font-black text-green-400">
                {timer}
              </h1>

            </div>

          </div>

        </div>
                {/* Online Users */}

        <div className="grid md:grid-cols-2 gap-6 mb-6">

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-3">

              <Users className="text-green-400" />

              <h2 className="text-2xl font-black">
                Online Players
              </h2>

            </div>

            <h1 className="text-5xl font-black text-green-400">
              {onlineUsers}
            </h1>

          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-3">

              <Trophy className="text-yellow-400" />

              <h2 className="text-2xl font-black">
                Last Result
              </h2>

            </div>

            <h1 className="text-5xl font-black text-yellow-400">
              {results[0]?.number}
            </h1>

          </div>

        </div>

        {/* Color Betting */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">

          <h2 className="text-3xl font-black mb-6">
            Color Betting
          </h2>

          <div className="grid grid-cols-3 gap-4">

            <button
              onClick={() => {
                setSelectedType("color");
                setSelectedValue("GREEN");
                setShowBetModal(true);
              }}
              className="h-20 rounded-2xl bg-green-500 hover:scale-105 transition-all font-black text-2xl"
            >
              GREEN
            </button>

            <button
              onClick={() => {
                setSelectedType("color");
                setSelectedValue("VIOLET");
                setShowBetModal(true);
              }}
              className="h-20 rounded-2xl bg-purple-500 hover:scale-105 transition-all font-black text-2xl"
            >
              VIOLET
            </button>

            <button
              onClick={() => {
                setSelectedType("color");
                setSelectedValue("RED");
                setShowBetModal(true);
              }}
              className="h-20 rounded-2xl bg-red-500 hover:scale-105 transition-all font-black text-2xl"
            >
              RED
            </button>

          </div>

        </div>

        {/* Number Betting */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">

          <h2 className="text-3xl font-black mb-6">
            Number Betting
          </h2>

          <div className="grid grid-cols-5 gap-4">

            {[0,1,2,3,4,5,6,7,8,9].map((num) => (

              <button
                key={num}
                onClick={() => {
                  setSelectedType("number");
                  setSelectedValue(String(num));
                  setShowBetModal(true);
                }}
                className={`
                  h-20
                  rounded-2xl
                  text-3xl
                  font-black
                  transition-all
                  hover:scale-105
                  ${
                    num % 2 === 0
                      ? "bg-red-500/20 border border-red-500"
                      : "bg-green-500/20 border border-green-500"
                  }
                `}
              >
                {num}
              </button>

            ))}

          </div>

        </div>

        {/* Big Small */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">

          <h2 className="text-3xl font-black mb-6">
            Big / Small
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <button
              onClick={() => {
                setSelectedType("size");
                setSelectedValue("BIG");
                setShowBetModal(true);
              }}
              className="h-24 rounded-2xl bg-orange-500 font-black text-3xl hover:scale-105 transition-all"
            >
              BIG
            </button>

            <button
              onClick={() => {
                setSelectedType("size");
                setSelectedValue("SMALL");
                setShowBetModal(true);
              }}
              className="h-24 rounded-2xl bg-blue-500 font-black text-3xl hover:scale-105 transition-all"
            >
              SMALL
            </button>

          </div>

        </div>

        {/* Quick Amounts */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">

          <h2 className="text-3xl font-black mb-6">
            Quick Bet Amount
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">

            {[10,50,100,500,1000,5000].map((amt) => (

              <button
                key={amt}
                onClick={() =>
                  setBetAmount(amt)
                }
                className="h-14 bg-zinc-900 border border-zinc-700 rounded-xl hover:border-green-500 hover:bg-green-500/10 font-black transition-all"
              >
                ₹{amt}
              </button>

            ))}

          </div>

        </div>

        {/* Bet Modal */}

        {showBetModal && (

          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 w-96">

              <h2 className="text-3xl font-black mb-5">
                Place Bet
              </h2>

              <div className="bg-black border border-zinc-800 rounded-2xl p-4 mb-5">

                <p className="text-zinc-500">
                  Selected
                </p>

                <h1 className="text-3xl font-black text-green-400">
                  {selectedValue}
                </h1>

              </div>

              <input
                type="number"
                value={betAmount}
                onChange={(e) =>
                  setBetAmount(
                    Number(e.target.value)
                  )
                }
                className="w-full bg-black border border-zinc-700 rounded-2xl p-4 text-xl"
              />

              <div className="grid grid-cols-2 gap-4 mt-6">

                <button
                  onClick={() =>
                    setShowBetModal(false)
                  }
                  className="bg-zinc-800 rounded-2xl py-4 font-black"
                >
                  CANCEL
                </button>

                <button
  onClick={placeBet}
  className="bg-green-500 text-black rounded-2xl py-4 font-black"
>
  CONFIRM
</button>
              </div>

            </div>

          </div>

        )}
        {/* Betting History */}

<div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

  <div className="flex items-center justify-between mb-5">

    <h2 className="text-2xl font-black">
      Recent Bets
    </h2>

    <span className="text-green-400 font-bold">
      {history.length} Bets
    </span>

  </div>

  {history.length === 0 ? (

    <div className="text-center py-10 text-zinc-500">
      No Bets Yet
    </div>

  ) : (

    <div className="space-y-3">

      {history.map((bet: any, index) => (

        <div
          key={index}
          className="bg-black border border-zinc-800 rounded-2xl p-4 flex justify-between items-center"
        >

          <div>

            <p className="font-bold">
              {bet.type}
            </p>

            <p className="text-zinc-500 text-sm">
              {bet.value}
            </p>

          </div>

          <div className="text-right">

            <p className="text-green-400 font-bold">
              ₹{bet.amount}
            </p>

            <p className="text-zinc-500 text-sm">
              Pending
            </p>

          </div>

        </div>

      ))}

    </div>

  )}

</div>

{/* Recent Results */}

<div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

  <h2 className="text-2xl font-black mb-5">
    Recent Results
  </h2>

  <div className="grid grid-cols-5 gap-3">

    {results.map((item, index) => (
      <div
        key={index}
        className="bg-black border border-zinc-800 rounded-xl p-3 text-center"
      >
        <div className="text-2xl font-black">
          {item.number}
        </div>

        <div
          className={`mt-2 h-3 rounded-full ${
            item.color === "GREEN"
              ? "bg-green-500"
              : item.color === "RED"
              ? "bg-red-500"
              : "bg-purple-500"
          }`}
        />
      </div>
    ))}

  </div>

</div>

</div>

</main>
);
}