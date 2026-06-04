"use client";

import {
  useEffect,
  useState,
} from "react";
import axios from "axios";
import Link from "next/link";
import { useWallet } from "../context/WalletContext";

import {
  ArrowLeft,
  Wallet,
  Trophy,
} from "lucide-react";

export default function SkyGame() {
  const [plane, setPlane] =
    useState(1);

  const [flying, setFlying] =
    useState(false);

  const [betAmount, setBetAmount] =
    useState("");

  const [cashedOut, setCashedOut] =
    useState(false);

  const [lastWin, setLastWin] =
    useState(0);

  const [crashed, setCrashed] =
    useState(false);

    const {
  wallet,
  setWallet,
  loadWallet,
} = useWallet();

const [loadingWallet, setLoadingWallet] =
  useState(true);

  // Load Wallet
useEffect(() => {
  const fetchWallet = async () => {
    try {
      await loadWallet();
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingWallet(false);
    }
  };

  fetchWallet();
}, [loadWallet]);

  // Flying Logic
  useEffect(() => {
    let interval: any;

    if (flying) {
      interval = setInterval(() => {
        setPlane((prev) => {
          // Crash Chance
          if (
            Math.random() < 0.02
          ) {
            clearInterval(
              interval
            );

            setFlying(false);

            setCrashed(true);

            if (!cashedOut) {
              setLastWin(0);
            }

            return prev;
          }

          return Number(
            (
              prev + 0.04
            ).toFixed(2)
          );
        });
      }, 100);
    }

    return () =>
      clearInterval(interval);
  }, [flying, cashedOut]);

  // Start
  const startFlying = async () => {
  if (!betAmount) {
    alert("Enter bet amount");
    return;
  }

  if (Number(betAmount) > wallet) {
    alert("Low balance");
    return;
  }

  try {
    const token =
      localStorage.getItem("token");

    const res = await axios.put(
      "http://localhost:5000/api/wallet/update",
      {
        amount: Number(betAmount),
        type: "remove",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setWallet(res.data.wallet);

    setPlane(1);
    setFlying(true);
    setCrashed(false);
    setCashedOut(false);
    setLastWin(0);

  } catch (error) {
    console.log(error);
  }
};

  // Cashout
const cashout = async () => {
    if (
      !flying ||
      cashedOut
    )
      return;

    const win =
  Number(betAmount) * plane;

const token =
  localStorage.getItem("token");

const cashout = async () => {
  if (!flying || cashedOut)
    return;

  try {
    const win =
      Number(betAmount) * plane;

    const token =
      localStorage.getItem("token");

    const res = await axios.put(
      "http://localhost:5000/api/wallet/update",
      {
        amount: win,
        type: "add",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setWallet(res.data.wallet);

    setLastWin(
      Number(win.toFixed(2))
    );

    setCashedOut(true);

    setFlying(false);

  } catch (error) {
    console.log(error);
    alert("Cashout failed");
  }
};

    setLastWin(
      Number(
        win.toFixed(2)
      )
    );

    setCashedOut(true);
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        {/* Top */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">

          {/* Wallet */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <p className="text-zinc-500 mb-2">
              Wallet
            </p>

            <div className="flex items-center gap-3">
              <Wallet className="text-green-400" />

              <h2 className="text-4xl font-black text-green-400">
                ₹{wallet}
              </h2>
            </div>
          </div>

          {/* Multiplier */}
          <div className="bg-zinc-950 border border-yellow-500 rounded-3xl p-6">
            <p className="text-zinc-500 mb-2">
              Live Multiplier
            </p>

            <h2 className="text-5xl font-black text-yellow-400">
              {plane}x
            </h2>
          </div>

          {/* Win */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <p className="text-zinc-500 mb-2">
              Last Win
            </p>

            <div className="flex items-center gap-3">
              <Trophy className="text-green-400" />

              <h2 className="text-4xl font-black text-green-400">
                ₹{lastWin}
              </h2>
            </div>
          </div>
        </div>

        {/* Sky */}
        <div className="relative h-96 bg-sky-950 rounded-3xl border border-sky-800 overflow-hidden mb-8">

          {/* Clouds */}
          <div className="absolute top-10 left-0 text-7xl opacity-20 animate-pulse">
            ☁️
          </div>

          <div className="absolute top-24 right-10 text-8xl opacity-20 animate-bounce">
            ☁️
          </div>

          <div className="absolute bottom-24 left-1/4 text-7xl opacity-10 animate-pulse">
            ☁️
          </div>

          {/* Stars */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse" />

          <div className="absolute top-16 left-1/3 w-2 h-2 bg-white rounded-full animate-pulse" />

          <div className="absolute top-20 right-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />

          {/* Flight Path */}
          <svg
            className="absolute inset-0"
            width="100%"
            height="100%"
          >
            <path
              d="M0 350 Q400 180 900 0"
              stroke="#22c55e"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="14"
              opacity="0.4"
            />
          </svg>

          {/* Plane */}
          <div
            className={`absolute text-8xl transition-all duration-100 ${
              flying
                ? "rotate-12"
                : ""
            }`}
            style={{
              left: `${
                plane * 7
              }%`,
              bottom: `${
                plane * 5
              }%`,
              filter:
                "drop-shadow(0px 0px 18px #facc15)",
            }}
          >
            ✈️
          </div>

          {/* Engine Fire */}
          {flying && (
            <div
              className="absolute text-4xl"
              style={{
                left: `${
                  plane * 7 - 2
                }%`,
                bottom: `${
                  plane * 5 - 1
                }%`,
              }}
            >
              🔥
            </div>
          )}

          {/* Flying Multiplier */}
          {flying && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <div className="bg-black bg-opacity-70 border border-yellow-500 px-10 py-5 rounded-3xl">
                <h2 className="text-7xl font-black text-yellow-400 animate-pulse">
                  {plane}x
                </h2>
              </div>
            </div>
          )}

          {/* Crash Explosion */}
          {crashed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">

              <div className="text-center animate-pulse">

                <div className="text-9xl mb-4">
                  💥
                </div>

                <h1 className="text-8xl font-black text-red-500 mb-4">
                  CRASH
                </h1>

                <p className="text-3xl text-white">
                  Flew away at {plane}x
                </p>

              </div>

            </div>
          )}

          {/* Bottom Glow */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-green-500 opacity-10 blur-3xl" />

        </div>

        {/* Controls */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

          <h2 className="text-4xl font-black mb-8">
            Sky Aviator
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Input */}
            <input
              type="number"
              placeholder="Bet Amount"
              value={betAmount}
              onChange={(e) =>
                setBetAmount(
                  e.target.value
                )
              }
              className="bg-black border border-zinc-700 rounded-2xl px-6 py-5 outline-none text-2xl font-black"
            />

            {/* Fly */}
            <button
              onClick={startFlying}
              disabled={flying}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black py-5 rounded-2xl text-2xl font-black transition"
            >
              FLY
            </button>

            {/* Cashout */}
            <button
              onClick={cashout}
              disabled={
                !flying ||
                cashedOut
              }
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 py-5 rounded-2xl text-2xl font-black transition"
            >
              CASHOUT
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}