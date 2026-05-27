"use client";

import {
  useEffect,
  useState,
} from "react";

export default function RocketGame() {

  const [multiplier, setMultiplier] =
    useState(1);

  const [running, setRunning] =
    useState(false);

  const [crashed, setCrashed] =
    useState(false);

  useEffect(() => {

    let interval: any;

    if (running) {

      interval = setInterval(() => {

        setMultiplier((prev) => {

          const next =
            prev + 0.1;

          // RANDOM CRASH
          if (
            Math.random() <
            0.03
          ) {

            clearInterval(
              interval
            );

            setRunning(false);

            setCrashed(true);

          }

          return Number(
            next.toFixed(2)
          );

        });

      }, 100);

    }

    return () =>
      clearInterval(interval);

  }, [running]);

  return (

    <main className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-6xl font-black text-green-400 mb-10">
          🚀 Rocket Crash
        </h1>

        <div className="text-8xl font-black mb-10">

          {crashed
            ? "💥 CRASHED"
            : `${multiplier}x`}

        </div>

        <button
          onClick={() => {

            setMultiplier(1);

            setCrashed(false);

            setRunning(true);

          }}
          className="bg-green-600 hover:bg-green-500 px-10 py-5 rounded-3xl text-3xl font-black"
        >
          START
        </button>

      </div>

    </main>

  );

}