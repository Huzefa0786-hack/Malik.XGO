"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { io } from "socket.io-client";

import {
  ArrowLeft,
  Timer,
  Trophy,
  Wallet,
} from "lucide-react";

const socket = io(
  "http://localhost:5000"
);

export default function NumCardsPage() {

  const router =
    useRouter();

  const [
    selectedNumber,
    setSelectedNumber,
  ] = useState<
    string | null
  >(null);

  const [
    betAmount,
    setBetAmount,
  ] = useState("");

  const [timer, setTimer] =
    useState(30);

  const [wallet, setWallet] =
    useState(0);

  const [
    lastResult,
    setLastResult,
  ] = useState<
    number | null
  >(null);

  const [liveBets, setLiveBets] =
    useState<any[]>([]);

  const [
    betHistory,
    setBetHistory,
  ] = useState<any[]>([]);

  const [control, setControl] =
    useState<any>(null);

  // LOGIN CHECK
  useEffect(() => {

    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {

      router.push(
        "/login"
      );

    }

    const user =
      localStorage.getItem(
        "user"
      );

    if (user) {

      const parsed =
        JSON.parse(user);

      setWallet(
        parsed.wallet || 0
      );

    }

  }, []);

  // LOAD CONTROL
  useEffect(() => {

    const fetchControl =
      async () => {

        try {

          const res =
            await axios.get(
              "http://localhost:5000/api/control"
            );

          setControl(
            res.data
          );

        } catch (error) {

          console.log(
            error
          );

        }

      };

    fetchControl();

    const interval =
      setInterval(
        fetchControl,
        2000
      );

    return () =>
      clearInterval(
        interval
      );

  }, []);

  // SOCKET EVENTS
  useEffect(() => {

    socket.on(
      "timer_update",
      (value) => {

        setTimer(value);

      }
    );

    socket.on(
      "result_update",
      (value) => {

        setLastResult(
          value
        );

      }
    );

    socket.on(
      "live_bet",
      (bet) => {

        setLiveBets(
          (prev) => [
            bet,
            ...prev,
          ]
        );

      }
    );

    socket.on(
      "bet_result",
      (data) => {

        setBetHistory(
          (prev) => [
            data,
            ...prev,
          ].slice(0, 15)
        );

      }
    );

    return () => {

      socket.off(
        "timer_update"
      );

      socket.off(
        "result_update"
      );

      socket.off(
        "live_bet"
      );

      socket.off(
        "bet_result"
      );

    };

  }, []);

  // PLACE BET
  const placeBet =
    async () => {

      try {

        if (
          !selectedNumber
        ) {

          return alert(
            "Select number"
          );

        }

        if (
          !betAmount
        ) {

          return alert(
            "Enter amount"
          );

        }

        const user =
          JSON.parse(
            localStorage.getItem(
              "user"
            ) || "{}"
          );

        if (
          !user?._id
        ) {

          return alert(
            "Login required"
          );

        }

        const res =
          await axios.post(
            "http://localhost:5000/api/bet/place",
            {
              userId:
                user._id,
              selection:
                selectedNumber,
              amount:
                Number(
                  betAmount
                ),
              roundId:
                "current-round",
            }
          );

        setWallet(
          res.data.wallet
        );

        user.wallet =
          res.data.wallet;

        localStorage.setItem(
          "user",
          JSON.stringify(
            user
          )
        );

        socket.emit(
          "place_bet",
          {
            userName:
              user.name,
            selection:
              selectedNumber,
            amount:
              Number(
                betAmount
              ),
          }
        );

        setLastResult(
  res.data.result
);

if (res.data.win) {

  alert(
    `YOU WON ₹${res.data.winAmount}`
  );

} else {

  alert(
    `YOU LOST
Result was ${res.data.result}`
  );

}

        setBetAmount("");

      } catch (
        err: any
      ) {

        alert(
          err?.response
            ?.data
            ?.error ||
            "Bet failed"
        );

      }
    };

  // GAME STOP
  if (
    control?.gameStatus ===
    "STOPPED"
  ) {

    return (

      <main className="min-h-screen bg-black text-white flex items-center justify-center">

        <div className="text-center">

          <h1 className="text-7xl font-black text-red-500 mb-6">
            GAME STOPPED
          </h1>

          <p className="text-zinc-500 text-2xl">
            Server under maintenance
          </p>

        </div>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto p-6">

        {/* BACK */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        {/* TOP */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">

          {/* TIMER */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">

            <div className="flex items-center gap-4">

              <Timer
                className="text-green-400"
                size={32}
              />

              <div>

                <p className="text-gray-500">
                  Time Left
                </p>

                <h2 className="text-5xl font-black text-green-400">
                  {timer}s
                </h2>

              </div>

            </div>

          </div>

          {/* WALLET */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">

            <div className="flex items-center gap-4">

              <Wallet
                className="text-green-400"
                size={32}
              />

              <div>

                <p className="text-gray-500">
                  Wallet Balance
                </p>

                <h2 className="text-5xl font-black text-green-400">
                  ₹{wallet}
                </h2>

              </div>

            </div>

          </div>

          {/* RESULT */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">

            <div className="flex items-center gap-4">

              <Trophy
                className="text-green-400"
                size={32}
              />

              <div>

                <p className="text-gray-500">
                  Last Result
                </p>

                <h2 className="text-5xl font-black text-green-400">
                  {lastResult ?? "-"}
                </h2>

              </div>

            </div>

          </div>

        </div>

        {/* NUMBERS */}
        <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8 mb-8">

          <h2 className="text-3xl font-black mb-8">
            Select Number
          </h2>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">

            {Array.from({
              length: 10,
            }).map((_, i) => (

              <button
                key={i}
                onClick={() =>
                  setSelectedNumber(
                    String(
                      i + 1
                    )
                  )
                }
                className={`h-20 rounded-2xl border-2 text-2xl font-black transition ${
                  selectedNumber ===
                  String(i + 1)
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-gray-900 border-gray-800 hover:border-gray-600"
                }`}
              >
                {i + 1}
              </button>

            ))}

          </div>

        </div>

        {/* PLACE BET */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">

            <h2 className="text-3xl font-black mb-6">
              Place Bet
            </h2>

            <input
  type="number"
  min="1"
  value={betAmount}
  onChange={(e) =>
    setBetAmount(
      e.target.value
    )
  }
  placeholder="Enter Bet Amount"
  className="w-full bg-black border-2 border-zinc-800 focus:border-green-500 outline-none rounded-2xl px-6 py-5 text-2xl font-black text-white placeholder:text-zinc-500 mb-6"
/>
        <div className="grid grid-cols-4 gap-3 mb-6">

  {[100, 500, 1000, 5000].map(
    (amount) => (

      <button
        key={amount}
        onClick={() =>
          setBetAmount(
            String(amount)
          )
        }
        className="bg-zinc-900 border border-zinc-700 hover:border-green-500 h-14 rounded-2xl font-black transition"
      >
        ₹{amount}
      </button>

    )
  )}

</div>    
            <button
              onClick={
                placeBet
              }
              disabled={
                control?.gameStatus ===
                "PAUSED"
              }
              className={`w-full rounded-2xl py-5 text-2xl font-black ${
                control?.gameStatus ===
                "PAUSED"
                  ? "bg-zinc-700"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              {control?.gameStatus ===
              "PAUSED"
                ? "BETTING PAUSED"
                : "PLACE BET"}
            </button>

          </div>

          {/* LIVE BETS */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">

            <h2 className="text-3xl font-black mb-6">
              🔴 Live Bets
            </h2>

            <div className="space-y-3 max-h-96 overflow-auto">

              {liveBets.length ===
                0 && (

                <p className="text-gray-500">
                  No bets yet
                </p>

              )}

              {liveBets.map(
                (
                  bet,
                  index
                ) => (

                  <div
                    key={index}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                  >

                    <p className="text-green-400 font-bold">
                      {bet.userName}
                    </p>

                    <p className="text-sm text-gray-400">
                      Bet on{" "}
                      {
                        bet.selection
                      }{" "}
                      • ₹
                      {
                        bet.amount
                      }
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    </main>

  );
}