"use client";

import { useState } from "react";

import {
  Shield,
  Bomb,
  Gem,
  Wallet,
  Activity,
  Settings,
} from "lucide-react";

export default function MinesAdminPage() {

  const [gameEnabled, setGameEnabled] =
    useState(true);

  const [maintenanceMode, setMaintenanceMode] =
    useState(false);

  const [minesCount, setMinesCount] =
    useState(5);

  const [minBet, setMinBet] =
    useState(10);

  const [maxBet, setMaxBet] =
    useState(10000);

  const [totalGames] =
    useState(2842);

  const [totalWins] =
    useState(1481);

  const [totalProfit] =
    useState(582300);

  const [onlinePlayers] =
    useState(128);

  return (

    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <div className="border-b border-zinc-800 bg-zinc-950">

        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-black text-green-400">
              MINES ADMIN
            </h1>

            <p className="text-zinc-500 mt-1">
              Advanced Game Control Panel
            </p>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3">

            <Shield className="text-green-400" />

            <div>

              <p className="text-zinc-500 text-xs">
                Status
              </p>

              <h2 className="font-black text-green-400">
                ONLINE
              </h2>

            </div>

          </div>

        </div>

      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-zinc-500">
                  Total Games
                </p>

                <h2 className="text-4xl font-black mt-2 text-green-400">
                  {totalGames}
                </h2>

              </div>

              <Activity className="text-green-400" />

            </div>

          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-zinc-500">
                  Total Wins
                </p>

                <h2 className="text-4xl font-black mt-2 text-yellow-400">
                  {totalWins}
                </h2>

              </div>

              <TrophyIcon />

            </div>

          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-zinc-500">
                  Profit
                </p>

                <h2 className="text-4xl font-black mt-2 text-red-400">
                  ₹{totalProfit}
                </h2>

              </div>

              <Wallet className="text-red-400" />

            </div>

          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-zinc-500">
                  Online
                </p>

                <h2 className="text-4xl font-black mt-2 text-purple-400">
                  {onlinePlayers}
                </h2>

              </div>

              <Gem className="text-purple-400" />

            </div>

          </div>

        </div>

        {/* CONTROLS */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* GAME SETTINGS */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-8">

              <Settings className="text-green-400" />

              <h2 className="text-3xl font-black">
                GAME SETTINGS
              </h2>

            </div>

            <div className="space-y-6">

              {/* GAME ENABLE */}
              <div className="flex items-center justify-between bg-black border border-zinc-800 rounded-2xl p-5">

                <div>

                  <h3 className="font-black text-xl">
                    Enable Game
                  </h3>

                  <p className="text-zinc-500">
                    Allow players to play mines
                  </p>

                </div>

                <button
                  onClick={() =>
                    setGameEnabled(
                      !gameEnabled
                    )
                  }
                  className={`
                  px-6 py-3 rounded-2xl font-black transition-all
                  ${
                    gameEnabled
                      ? "bg-green-500 text-black"
                      : "bg-red-500"
                  }
                  `}
                >

                  {gameEnabled
                    ? "ON"
                    : "OFF"}

                </button>

              </div>

              {/* MAINTENANCE */}
              <div className="flex items-center justify-between bg-black border border-zinc-800 rounded-2xl p-5">

                <div>

                  <h3 className="font-black text-xl">
                    Maintenance
                  </h3>

                  <p className="text-zinc-500">
                    Disable game temporarily
                  </p>

                </div>

                <button
                  onClick={() =>
                    setMaintenanceMode(
                      !maintenanceMode
                    )
                  }
                  className={`
                  px-6 py-3 rounded-2xl font-black transition-all
                  ${
                    maintenanceMode
                      ? "bg-yellow-400 text-black"
                      : "bg-zinc-800"
                  }
                  `}
                >

                  {maintenanceMode
                    ? "ACTIVE"
                    : "OFF"}

                </button>

              </div>

              {/* MINES */}
              <div className="bg-black border border-zinc-800 rounded-2xl p-5">

                <p className="text-zinc-500 mb-3">
                  Default Mines
                </p>

                <select
                  value={minesCount}
                  onChange={(e) =>
                    setMinesCount(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 outline-none"
                >

                  <option value={3}>
                    3 Mines
                  </option>

                  <option value={5}>
                    5 Mines
                  </option>

                  <option value={7}>
                    7 Mines
                  </option>

                  <option value={10}>
                    10 Mines
                  </option>

                </select>

              </div>

              {/* BET LIMITS */}
              <div className="grid grid-cols-2 gap-4">

                <div className="bg-black border border-zinc-800 rounded-2xl p-5">

                  <p className="text-zinc-500 mb-3">
                    Min Bet
                  </p>

                  <input
                    type="number"
                    value={minBet}
                    onChange={(e) =>
                      setMinBet(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 outline-none"
                  />

                </div>

                <div className="bg-black border border-zinc-800 rounded-2xl p-5">

                  <p className="text-zinc-500 mb-3">
                    Max Bet
                  </p>

                  <input
                    type="number"
                    value={maxBet}
                    onChange={(e) =>
                      setMaxBet(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 outline-none"
                  />

                </div>

              </div>

            </div>

          </div>

          {/* LIVE FEED */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-8">

              <Bomb className="text-red-400" />

              <h2 className="text-3xl font-black">
                LIVE ACTIVITY
              </h2>

            </div>

            <div className="space-y-4">

              {[
                "Player123 lost ₹1200",
                "Rohan won ₹5800",
                "Aryan hit x9.2",
                "Kabir cashed out ₹2300",
                "Rahul exploded on mine",
              ].map((activity, index) => (

                <div
                  key={index}
                  className="bg-black border border-zinc-800 rounded-2xl p-5"
                >

                  <p className="font-bold text-green-400">
                    {activity}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </main>

  );

}

function TrophyIcon() {

  return (

    <div className="text-yellow-400 text-3xl">
      🏆
    </div>

  );

}