"use client";

import Link from "next/link";
import axios from "axios";
import {
  useWallet,
} from "../context/WalletContext";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bomb,
  Gem,
  Wallet,
  ArrowLeft,
} from "lucide-react";

const GRID_SIZE = 25;

export default function MinesPage() {


  const {
  wallet,
  setWallet,
  loadWallet,
} = useWallet();

useEffect(() => {
  loadWallet();
}, []);

const [loadingWallet, setLoadingWallet] =
  useState(true);
  const [betAmount, setBetAmount] = useState(100);
  const [minesCount, setMinesCount] = useState(5);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);

  const [multiplier, setMultiplier] = useState(1);
  const [profit, setProfit] = useState(0);
  const [explodedMine, setExplodedMine] = useState<number | null>(null);

  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [history, setHistory] = useState<
    {
      multiplier: number;
      profit: number;
    }[]
  >([]);

  const [livePlayers, setLivePlayers] = useState([
    "Rohan won ₹4500",
    "Aryan hit x8.2",
    "Kabir won ₹8900",
  ]);

  const tiles = useMemo(() => {
    return Array.from({ length: GRID_SIZE });
  }, []);
    useEffect(() => {
    const interval = setInterval(() => {
      const names = [
        "Rohan",
        "Kabir",
        "Aryan",
        "Rahul",
        "Ayaan",
      ];

      const player =
        names[Math.floor(Math.random() * names.length)];

      const amount =
        Math.floor(Math.random() * 9000) + 1000;

      setLivePlayers((prev) => [
        `${player} won ₹${amount}`,
        ...prev.slice(0, 4),
      ]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const generateMines = () => {
    const mines: number[] = [];

    while (mines.length < minesCount) {
      const random = Math.floor(
        Math.random() * GRID_SIZE
      );

      if (!mines.includes(random)) {
        mines.push(random);
      }
    }

    return mines;
  };
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

const startGame = async () => {
    if (wallet < betAmount) {
      alert("Insufficient Wallet");
      return;
    }

    try {

  const token =
    localStorage.getItem("token");

  const res =
    await axios.put(
      "http://localhost:5000/api/wallet/update",
      {
        amount: betAmount,
        type: "remove",
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  setWallet(
    res.data.wallet
  );
await loadWallet();

} catch {

  alert(
    "Wallet Update Failed"
  );

  return;

}

    setMinePositions(generateMines());

    setRevealedTiles([]);
    setMultiplier(1);
    setProfit(0);
    setWon(false);
    setGameOver(false);
    setExplodedMine(null);
    setGameStarted(true);
  };

  const revealTile = (index: number) => {
    if (
      revealedTiles.includes(index) ||
      gameOver ||
      !gameStarted
    )
      return;

    if (minePositions.includes(index)) {
      setExplodedMine(index);

      setRevealedTiles(
        Array.from(
          { length: GRID_SIZE },
          (_, i) => i
        )
      );

      setGameOver(true);
      setGameStarted(false);
      setWon(false);
      setStreak(0);

      return;
    }

    const updated = [...revealedTiles, index];

    setRevealedTiles(updated);

    const nextMultiplier = Number(
      (
        multiplier +
        0.25 +
        minesCount * 0.08
      ).toFixed(2)
    );

    setMultiplier(nextMultiplier);

    const nextProfit = Math.floor(
      betAmount * nextMultiplier
    );

    setProfit(nextProfit);
  };

 const cashout = async () => {
    if (
      gameOver ||
      revealedTiles.length === 0
    )
      return;

   try {

  const token =
    localStorage.getItem("token");

  const res =
    await axios.put(
      "http://localhost:5000/api/wallet/update",
      {
        amount: profit,
        type: "add",
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  setWallet(
    res.data.wallet
  );

} catch {

  alert(
    "Cashout Failed"
  );

}

    setWon(true);
    setGameOver(true);
    setGameStarted(false);

    setStreak((prev) => prev + 1);

    setHistory((prev) => [
      {
        multiplier,
        profit,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWon(false);

    setExplodedMine(null);

    setMultiplier(1);
    setProfit(0);

    setRevealedTiles([]);
  };
    return (
    <main className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div className="flex items-center gap-4">

            <Link
              href="/"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3"
            >
              <ArrowLeft />
            </Link>

            <div>
              <h1 className="text-4xl font-black text-green-400">
                MINES
              </h1>

              <p className="text-zinc-500">
                Professional Edition
              </p>
            </div>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3">

            <Wallet className="text-green-400" />

           <h2 className="font-black text-green-400 text-xl">
  {loadingWallet
    ? "Loading..."
    : `₹${wallet}`}
</h2>
          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-[320px_1fr_300px] gap-6">

        {/* Left Panel */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

          <h2 className="text-2xl font-black mb-6">
            Game Panel
          </h2>

          <input
            type="number"
            value={betAmount}
            onChange={(e) =>
              setBetAmount(Number(e.target.value))
            }
            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 mb-4"
          />
<select
  value={minesCount}
  onChange={(e) =>
    setMinesCount(Number(e.target.value))
  }
  className="w-full bg-black border border-zinc-800 rounded-2xl p-4 mb-4"
>
  {[1,2,3,4,5,6,7,8,9,10].map((count) => (
    <option key={count} value={count}>
      {count} Mines
    </option>
  ))}
</select>
          <button
            onClick={startGame}
            className="w-full bg-green-500 text-black font-black rounded-2xl py-4 mb-3"
          >
            START GAME
          </button>

          <button
            onClick={cashout}
            className="w-full bg-yellow-400 text-black font-black rounded-2xl py-4 mb-3"
          >
            CASH OUT
          </button>

          <button
            onClick={resetGame}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4"
          >
            RESET
          </button>

        </div>
<div className="grid grid-cols-3 gap-3 mb-6">

  <div className="bg-black border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-500">Multiplier</p>
    <h2 className="text-green-400 text-2xl font-black">
      x{multiplier}
    </h2>
  </div>

  <div className="bg-black border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-500">Profit</p>
    <h2 className="text-yellow-400 text-2xl font-black">
      ₹{profit}
    </h2>
  </div>

  <div className="bg-black border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-500">Streak</p>
    <h2 className="text-blue-400 text-2xl font-black">
      {streak}
    </h2>
  </div>

</div>
        {/* Grid */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

          <div className="mb-6 bg-black border border-zinc-800 rounded-2xl p-4 flex justify-between">

            <span>Gems: {revealedTiles.length}</span>
            <span>x{multiplier}</span>
            <span>{minesCount} Mines</span>

          </div>

          <div className="grid grid-cols-5 gap-3">

            {tiles.map((_, index) => {

              const revealed =
                revealedTiles.includes(index);

              const exploded =
                explodedMine === index;

              return (
                <motion.button
                  key={index}
                  whileHover={{
                    scale: 1.05,
                    rotate: 2,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  onClick={() =>
                    revealTile(index)
                  }
                  className={`aspect-square rounded-2xl border ${
                    revealed
                      ? "bg-green-500/20 border-green-500"
                      : "bg-zinc-900 border-zinc-800"
                  } ${
                    exploded
                      ? "bg-red-500/20 border-red-500"
                      : ""
                  }`}
                >
                  {revealed ? (
                    minePositions.includes(index) ? (
                      <Bomb className="mx-auto text-red-500" />
                    ) : (
                      <Gem className="mx-auto text-green-400" />
                    )
                  ) : null}
                </motion.button>
              );
            })}

          </div>

        </div>

        {/* Right Panel */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

          <h2 className="text-2xl font-black mb-4">
            Live Wins
          </h2>

          <div className="space-y-3">

            {livePlayers.map((player, i) => (
              <div
                key={i}
                className="bg-black border border-zinc-800 rounded-2xl p-4"
              >
                {player}
              </div>
            ))}

          </div>

        </div>

      </div>

    </main>
  );
}