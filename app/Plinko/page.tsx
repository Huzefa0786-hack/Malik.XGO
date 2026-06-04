"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useWallet } from "../context/WalletContext";

const WIDTH = 420;
const HEIGHT = 600;

const multipliers = [10, 5, 2, 1, 0.5, 1, 2, 5, 10];

export default function PlinkoReal() {
  const { wallet, setWallet } = useWallet();

  const scene = useRef<HTMLDivElement>(null);
  const engine = useRef<Matter.Engine | null>(null);

  const [bet, setBet] = useState(10);
  const [running, setRunning] = useState(false);

  const ballsRef = useRef<Matter.Body[]>([]);

  // 🎮 INIT PHYSICS WORLD
  useEffect(() => {
    const { Engine, Render, World, Bodies, Runner, Events } = Matter;

    const eng = Engine.create();
    engine.current = eng;

    const render = Render.create({
      element: scene.current!,
      engine: eng,
      options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: false,
        background: "#000",
      },
    });

    const ground = Bodies.rectangle(
      WIDTH / 2,
      HEIGHT,
      WIDTH,
      50,
      { isStatic: true }
    );

    // 🎯 PEGS
    const pegs: Matter.Body[] = [];

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 8; col++) {
        pegs.push(
          Bodies.circle(40 + col * 45 + (row % 2 ? 20 : 0), 80 + row * 40, 5, {
            isStatic: true,
            render: { fillStyle: "#00ff88" },
          })
        );
      }
    }

    // 🎯 SLOT WALLS
    const walls: Matter.Body[] = [];

    for (let i = 0; i <= multipliers.length; i++) {
      walls.push(
        Bodies.rectangle(i * (WIDTH / multipliers.length), HEIGHT - 60, 5, 120, {
          isStatic: true,
        })
      );
    }

    World.add(eng.world, [ground, ...pegs, ...walls]);

    const runner = Runner.create();
    Runner.run(runner, eng);
    Render.run(render);

    return () => {
      Render.stop(render);
      World.clear(eng.world, false);
      Engine.clear(eng);
    };
  }, []);

  // 🎮 DROP BALLS
  const dropBalls = () => {
    if (running || bet > wallet) return;

    setWallet((p) => p - bet);
    setRunning(true);

    const { Bodies, World, Events } = Matter;
    const eng = engine.current!;

    ballsRef.current = [];

    let completed = 0;
    let totalWin = 0;

    for (let i = 0; i < 6; i++) {
      const ball = Bodies.circle(WIDTH / 2, 50, 8, {
        restitution: 0.6,
        friction: 0.3,
        label: "ball",
      });

      ballsRef.current.push(ball);
      Matter.World.add(eng.world, ball);

      Events.on(eng, "afterUpdate", () => {
        const y = ball.position.y;

        if (y > HEIGHT - 70) {
          const index = Math.floor(
            (ball.position.x / WIDTH) * multipliers.length
          );

          const win = bet * multipliers[index];
          totalWin += win;

          Matter.World.remove(eng.world, ball);

          completed++;

          if (completed === 6) {
            setRunning(false);
            setWallet((p) => p + totalWin);
          }
        }
      });
    }
  };

  return (
    <div className="flex gap-6 p-6 bg-black text-white min-h-screen">

      {/* 🎛 CONTROL PANEL */}
      <div className="w-72 bg-zinc-900 border border-green-500 p-4 rounded-xl">
        <h2 className="text-green-400 font-bold text-xl">
          🎰 PLINKO PRO
        </h2>

        <div className="mt-3">
          💰 Balance: <span className="text-green-400">₹{wallet}</span>
        </div>

        <input
          type="number"
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          className="w-full mt-3 p-2 bg-black border border-green-500"
        />

        <button
          onClick={dropBalls}
          className="w-full mt-4 bg-green-500 hover:bg-green-600 p-2 rounded"
        >
          DROP BALLS
        </button>
      </div>

      {/* 🎯 GAME BOARD */}
      <div
        ref={scene}
        className="border border-green-500 rounded-xl overflow-hidden"
        style={{ width: WIDTH, height: HEIGHT }}
      />
    </div>
  );
}