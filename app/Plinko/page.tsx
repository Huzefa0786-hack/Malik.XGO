"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, Wallet, Trophy, TrendingUp, Play, History } from "lucide-react";

const WIDTH = 700;
const HEIGHT = 800;

const LOW_RISK = [2, 1.5, 1.2, 1, 0.8, 1, 1.2, 1.5, 2];
const MEDIUM_RISK = [5, 3, 2, 1, 0.5, 1, 2, 3, 5];
const HIGH_RISK = [10, 5, 2, 1, 0.2, 1, 2, 5, 10];

type HistoryItem = { multiplier: number; payout: number };

export default function PlinkoPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [running, setRunning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/plinko");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setWallet(parsedUser.wallet || 0);
    setLoading(false);
    fetchStats(token);
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5000/api/bet/history?game=plinko", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats({
          totalWins: response.data.stats?.totalWins || 0,
          totalLosses: response.data.stats?.totalLosses || 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const getMultipliers = () => {
    if (risk === "low") return LOW_RISK;
    if (risk === "high") return HIGH_RISK;
    return MEDIUM_RISK;
  };

  const dropBall = async () => {
    if (running) return;
    if (!engineRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login?redirect=/plinko");
      return;
    }

    if (betAmount <= 0 || betAmount < 10) {
      alert("Minimum bet is ₹10");
      return;
    }

    if (betAmount > wallet) {
      alert("Insufficient Balance");
      return;
    }

    try {
      setRunning(true);

      const betResponse = await axios.post(
        "http://localhost:5000/api/bet/place",
        { game: "plinko", amount: betAmount, selection: "drop", betType: "plinko", multiplier: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setWallet(betResponse.data.wallet);
      setCurrentBetId(betResponse.data.betId);
      setHistoryRefresh(prev => prev + 1);
      
      const updatedUser = { ...user, wallet: betResponse.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      const { Bodies, World, Events } = Matter;
      const ball = Bodies.circle(WIDTH / 2, 40, 10, {
        restitution: 0.8,
        friction: 0.01,
        density: 0.001,
        render: { fillStyle: "#22c55e", strokeStyle: "#86efac", lineWidth: 2 }
      });

      World.add(engineRef.current.world, ball);
      const multipliers = getMultipliers();

      const eventHandler = async () => {
        if (ball.position.y > HEIGHT - 120) {
          let slot = Math.floor(ball.position.x / (WIDTH / 9));
          if (slot < 0) slot = 0;
          if (slot > 8) slot = 8;
          
          const multiplier = multipliers[slot];
          const payout = Number((betAmount * multiplier).toFixed(2));
          
          if (payout > 0 && currentBetId) {
            const cashoutResponse = await axios.post(
              "http://localhost:5000/api/bet/cashout",
              { betId: currentBetId, winAmount: payout, result: `${multiplier}x`, multiplier: multiplier },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setWallet(cashoutResponse.data.wallet);
            setHistoryRefresh(prev => prev + 1);
            fetchStats(token);
            
            const updatedUserData = { ...user, wallet: cashoutResponse.data.wallet };
            localStorage.setItem("user", JSON.stringify(updatedUserData));
            setUser(updatedUserData);
          }
          
          const gameProfit = payout - betAmount;
          setLastWin(payout);
          setTotalProfit(prev => prev + gameProfit);
          setGamesPlayed(prev => prev + 1);
          setBiggestWin(prev => payout > prev ? payout : prev);
          setHistory(prev => [{ multiplier, payout }, ...prev.slice(0, 14)]);
          
          World.remove(engineRef.current!.world, ball);
          Events.off(engineRef.current!, "afterUpdate", eventHandler);
          setRunning(false);
          setCurrentBetId(null);
        }
      };

      Events.on(engineRef.current, "afterUpdate", eventHandler);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to start game");
      setRunning(false);
    }
  };

  useEffect(() => {
    if (!sceneRef.current || loading) return;
    
    const { Engine, Render, Runner, World, Bodies } = Matter;
    const engine = Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { width: WIDTH, height: HEIGHT, wireframes: false, background: "#09090b" }
    });

    const ground = Bodies.rectangle(WIDTH / 2, HEIGHT + 20, WIDTH, 40, { isStatic: true, render: { fillStyle: "#18181b" } });
    const leftWall = Bodies.rectangle(-10, HEIGHT / 2, 20, HEIGHT, { isStatic: true });
    const rightWall = Bodies.rectangle(WIDTH + 10, HEIGHT / 2, 20, HEIGHT, { isStatic: true });
    
    const pegs: Matter.Body[] = [];
    for (let row = 0; row < 14; row++) {
      const cols = row + 3;
      for (let col = 0; col < cols; col++) {
        const x = WIDTH / 2 - ((cols - 1) * 38) / 2 + col * 42;
        const y = 100 + row * 45;
        pegs.push(Bodies.circle(x, y, 6, { isStatic: true, render: { fillStyle: "#22c55e" } }));
      }
    }
    
    const slotWalls: Matter.Body[] = [];
    const slotWidth = WIDTH / 9;
    for (let i = 0; i <= 9; i++) {
      slotWalls.push(Bodies.rectangle(i * slotWidth, HEIGHT - 70, 4, 140, { isStatic: true, render: { fillStyle: "#27272a" } }));
    }
    
    World.add(engine.world, [ground, leftWall, rightWall, ...pegs, ...slotWalls]);
    
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);
    
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [loading]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={18} /> Back
          </Link>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl"
          >
            <History size={18} /> History
          </button>
        </div>
        
        <h1 className="text-5xl font-black text-green-400 mb-8">PLINKO</h1>

        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <Wallet className="text-green-400" />
              <div>
                <p className="text-zinc-500">Balance</p>
                <h2 className="text-3xl font-black text-green-400">₹{wallet.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" />
              <div>
                <p className="text-zinc-500">Last Win</p>
                <h2 className="text-3xl font-black text-yellow-400">₹{lastWin.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-400" />
              <div>
                <p className="text-zinc-500">Profit</p>
                <h2 className="text-3xl font-black text-green-400">₹{totalProfit.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <p className="text-zinc-500">Games Played</p>
            <h2 className="text-3xl font-black">{gamesPlayed}</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <p className="text-zinc-500">Win/Loss</p>
            <h2 className="text-2xl font-black">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600"> / </span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-2xl font-black mb-5">Bet Settings</h2>
            <label className="block mb-2">Bet Amount (Min ₹10)</label>
            <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-4" />
            
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[10, 50, 100, 500].map((amount) => (
                <button key={amount} onClick={() => setBetAmount(amount)} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl py-2 font-bold">₹{amount}</button>
              ))}
            </div>
            
            <label className="block mb-2">Risk Level</label>
            <select value={risk} onChange={(e) => setRisk(e.target.value as "low" | "medium" | "high")} className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-5">
              <option value="low">Low Risk (1-2x)</option>
              <option value="medium">Medium Risk (0.5-5x)</option>
              <option value="high">High Risk (0.2-10x)</option>
            </select>
            
            <button onClick={dropBall} disabled={running} className="w-full bg-green-500 hover:bg-green-600 text-black rounded-xl py-4 font-black flex items-center justify-center gap-2">
              <Play size={18} /> {running ? "PLAYING..." : "DROP BALL"}
            </button>
            
            <div className="mt-8 space-y-3">
              <div className="bg-black rounded-xl p-3">Biggest Win <span className="float-right text-green-400">₹{biggestWin.toLocaleString()}</span></div>
              <div className="bg-black rounded-xl p-3">Total Profit <span className="float-right text-green-400">₹{totalProfit.toLocaleString()}</span></div>
            </div>
          </div>

          <div>
            <div ref={sceneRef} className="border border-green-500 rounded-3xl overflow-hidden" style={{ maxWidth: "100%", height: HEIGHT }} />
            <div className="grid grid-cols-9 gap-1 mt-3">
              {getMultipliers().map((multi, index) => (
                <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-lg py-3 text-center font-black text-green-400">{multi}x</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bet History */}
      {showHistory && (
        <div className="max-w-7xl mx-auto mt-8">
          <BetHistory game="plinko" refreshTrigger={historyRefresh} />
        </div>
      )}
    </main>
  );
}
