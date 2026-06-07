"use client";

import {
  useEffect,
  useState,
} from "react";

export default function MultiplierGame() {

  const [multi, setMulti] =
    useState(1);

  const [play, setPlay] =
    useState(false);

  useEffect(() => {

    let interval: any;

    if (play) {

      interval = setInterval(() => {

        setMulti((prev) => {

          if (
            Math.random() <
            0.04
          ) {

            clearInterval(
              interval
            );

            setPlay(false);

            return prev;

          }

          return Number(
            (
              prev + 0.15
            ).toFixed(2)
          );

        });

      }, 120);

    }

    return () =>
      clearInterval(interval);

  }, [play]);

  return (

    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-6xl font-black text-purple-500 mb-10">
          💎 Multiplier X
        </h1>

        <div className="text-8xl font-black mb-10">
          {multi}x
        </div>

        <button
          onClick={() => {

            setMulti(1);

            setPlay(true);

          }}
          className="bg-purple-600 px-10 py-5 rounded-3xl text-3xl font-black"
        >
          PLAY
        </button>

      </div>

    </main>

  );

}
