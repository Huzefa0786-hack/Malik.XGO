"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, Wallet, Trophy, TrendingUp, Play, History, Layers } from "lucide-react";

const WIDTH = 800;
const HEIGHT = 700;

// Risk level multipliers
const LOW_RISK = [1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2];
const MEDIUM_RISK = [2.0, 1.5, 1.0, 0.5, 0.2, 0.5, 1.0, 1.5, 2.0];
const HIGH_RISK = [10.0, 5.0, 2.0, 1.0, 0.2, 1.0, 2.0, 5.0, 10.0];

type HistoryItem = { multiplier: number; payout: number };
type Ball = { id: number; body: Matter.Body; betAmount: number; betId: string };

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
  const [activeBalls, setActiveBalls] = useState<Ball[]>([]);
  const [nextBallId, setNextBallId] = useState(1);
  const [multiBallCount, setMultiBallCount] = useState(1);

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
    fetchWallet();
  }, [router]);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet/balance");
      if (res.data.success) {
        setWallet(res.data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  };

  const getMultipliers = () => {
    if (risk === "low") return LOW_RISK;
    if (risk === "high") return HIGH_RISK;
    return MEDIUM_RISK;
  };

  const getRandomMultiplier = (): number => {
    const multipliers = getMultipliers();
    // Weighted random based on risk level
    const random = Math.random();
    if (risk === "low") {
      // Low risk: higher chance of 1x-1.2x
      if (random < 0.4) return multipliers[4]; // center (1.0x)
      if (random < 0.7) return multipliers[3] || multipliers[5];
      return multipliers[Math.floor(Math.random() * multipliers.length)];
    } else if (risk === "high") {
      // High risk: higher chance of extreme values
      if (random < 0.3) return multipliers[0] || multipliers[8]; // high multiplier
      if (random < 0.5) return multipliers[4]; // center
      return multipliers[Math.floor(Math.random() * multipliers.length)];
    } else {
      // Medium risk: balanced
      return multipliers[Math.floor(Math.random() * multipliers.length)];
    }
  };

  const dropBall = async () => {
    if (running) return;
    if (!engineRef.current) return;

    const totalCost = betAmount * multiBallCount;

    if (betAmount <= 0 || betAmount < 10) {
      alert("Minimum bet is ₹10");
      return;
    }

    if (totalCost > wallet) {
      alert(`Insufficient Balance! Need ₹${totalCost.toLocaleString()}`);
      return;
    }

    setRunning(true);
    
    try {
      // Place a single bet for all balls
      const betResponse = await api.post("/bet/place", {
        game: "plinko",
        amount: totalCost,
        selection: `${risk}-risk`,
        betType: "plinko",
        multiplier: 1
      });
      
      setWallet(betResponse.data.wallet);
      const updatedUser = { ...user, wallet: betResponse.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      const mainBetId = betResponse.data.betId;
      const ballsToDrop: Ball[] = [];
      const { Bodies, World, Events } = Matter;
      
      // Create all balls
      for (let i = 0; i < multiBallCount; i++) {
        const dropX = WIDTH / 2 + (i - (multiBallCount - 1) / 2) * 15;
        const clampedX = Math.max(50, Math.min(WIDTH - 50, dropX));
        
        const ball = Bodies.circle(clampedX, 50, 8, {
          restitution: 0.65,
          friction: 0.05,
          density: 0.004,
          render: {
            fillStyle: `hsl(${Math.random() * 60 + 100}, 70%, 55%)`,
            strokeStyle: "#ffffff",
            lineWidth: 1
          }
        });
        
        World.add(engineRef.current.world, ball);
        ballsToDrop.push({
          id: nextBallId + i,
          body: ball,
          betAmount: betAmount,
          betId: mainBetId
        });
      }
      
      setNextBallId(prev => prev + multiBallCount);
      setActiveBalls(prev => [...prev, ...ballsToDrop]);
      
      let totalWin = 0;
      let completedBalls = 0;
      
      const checkPositions = setInterval(async () => {
        for (const ball of ballsToDrop) {
          if (ball.body && ball.body.position.y > HEIGHT - 80) {
            const slot = Math.floor(ball.body.position.x / (WIDTH / 9));
            const clampedSlot = Math.max(0, Math.min(8, slot));
            const multiplier = getMultipliers()[clampedSlot];
            const winAmount = Number((ball.betAmount * multiplier).toFixed(2));
            
            totalWin += winAmount;
            completedBalls++;
            
            // Visual feedback - highlight slot
            const slotElement = document.getElementById(`slot-${clampedSlot}`);
            if (slotElement) {
              slotElement.classList.add('animate-pulse', winAmount > ball.betAmount ? 'bg-green-500/30' : 'bg-red-500/30');
              setTimeout(() => {
                slotElement.classList.remove('animate-pulse', 'bg-green-500/30', 'bg-red-500/30');
              }, 500);
            }
            
            // Remove ball
            if (ball.body) {
              World.remove(engineRef.current!.world, ball.body);
              setActiveBalls(prev => prev.filter(b => b.id !== ball.id));
            }
          }
        }
        
        if (completedBalls === ballsToDrop.length && completedBalls > 0) {
          clearInterval(checkPositions);
          
          // Update final win/loss
          if (totalWin > 0) {
            const cashoutResponse = await api.post("/bet/cashout", {
              betId: mainBetId,
              winAmount: totalWin,
              result: `Won ₹${totalWin.toLocaleString()}`,
              multiplier: totalWin / totalCost
            });
            
            setWallet(cashoutResponse.data.wallet);
            fetchWallet();
            setLastWin(totalWin);
            setTotalProfit(prev => prev + (totalWin - totalCost));
            setBiggestWin(prev => totalWin > prev ? totalWin : prev);
            setHistory(prev => [{ multiplier: totalWin / totalCost, payout: totalWin }, ...prev.slice(0, 14)]);
            setGamesPlayed(prev => prev + 1);
            setHistoryRefresh(prev => prev + 1);
            
            if (totalWin > totalCost) {
              alert(`🎉 BIG WIN! You won ₹${totalWin.toLocaleString()} from ${multiBallCount} balls! 🎉`);
            } else if (totalWin > 0) {
              alert(`💰 You won ₹${totalWin.toLocaleString()} from ${multiBallCount} balls`);
            }
          } else {
            setGamesPlayed(prev => prev + 1);
            setHistoryRefresh(prev => prev + 1);
            alert(`😢 No wins this time. Total loss: ₹${totalCost.toLocaleString()}`);
          }
          
          setRunning(false);
        }
      }, 100);
      
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to drop balls");
      setRunning(false);
    }
  };

  // Initialize Matter.js engine
  useEffect(() => {
    if (!sceneRef.current || loading) return;
    
    const { Engine, Render, Runner, World, Bodies } = Matter;
    
    const engine = Engine.create();
    engine.gravity.x = 0;
    engine.gravity.y = 1;
    engine.positionIterations = 15;
    engine.velocityIterations = 15;
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { 
        width: WIDTH, 
        height: HEIGHT, 
        wireframes: false, 
        background: "#0a0a0f",
        showAngleIndicator: false
      }
    });

    // Create boundaries
    const walls = [];
    
    const ground = Bodies.rectangle(WIDTH / 2, HEIGHT + 30, WIDTH, 60, { 
      isStatic: true, 
      render: { fillStyle: "#1a1a2e" },
      restitution: 0.5
    });
    walls.push(ground);
    
    const leftWall = Bodies.rectangle(-15, HEIGHT / 2, 30, HEIGHT, { 
      isStatic: true, 
      restitution: 0.7,
      render: { fillStyle: "#1a1a2e" }
    });
    walls.push(leftWall);
    
    const rightWall = Bodies.rectangle(WIDTH + 15, HEIGHT / 2, 30, HEIGHT, { 
      isStatic: true, 
      restitution: 0.7,
      render: { fillStyle: "#1a1a2e" }
    });
    walls.push(rightWall);
    
    const topWall = Bodies.rectangle(WIDTH / 2, -15, WIDTH, 30, { 
      isStatic: true, 
      render: { fillStyle: "#1a1a2e" }
    });
    walls.push(topWall);
    
    // Create pegs in triangular pattern
    const pegs: Matter.Body[] = [];
    const startY = 90;
    const rows = 12;
    
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 5;
      const rowWidth = (pegsInRow - 1) * 35;
      const startX = (WIDTH - rowWidth) / 2;
      const y = startY + row * 40;
      const offset = (row % 2) * 17.5;
      
      for (let i = 0; i < pegsInRow; i++) {
        const x = startX + i * 35 + offset;
        if (x > 30 && x < WIDTH - 30) {
          const peg = Bodies.circle(x, y, 5, {
            isStatic: true,
            restitution: 0.85,
            friction: 0.1,
            render: { fillStyle: "#22c55e", strokeStyle: "#15803d", lineWidth: 1 }
          });
          pegs.push(peg);
        }
      }
    }
    
    // Create slot dividers
    const slotCount = 9;
    const slotWidth = WIDTH / slotCount;
    const slotY = HEIGHT - 60;
    
    for (let i = 1; i < slotCount; i++) {
      const divider = Bodies.rectangle(i * slotWidth, slotY - 20, 4, 80, {
        isStatic: true,
        render: { fillStyle: "#334155" }
      });
      walls.push(divider);
    }
    
    World.add(engine.world, [...walls, ...pegs]);
    
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);
    
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, [loading]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  const multipliers = getMultipliers();

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
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
          <div className="bg-linear-to-r from-zinc-900 to-black rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Wallet className="text-green-400" />
              <div>
                <p className="text-zinc-500">Balance</p>
                <h2 className="text-2xl font-black text-green-400">₹{wallet.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-yellow-900/20 to-black rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" />
              <div>
                <p className="text-zinc-500">Last Win</p>
                <h2 className="text-2xl font-black text-yellow-400">₹{lastWin.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-green-900/20 to-black rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-400" />
              <div>
                <p className="text-zinc-500">Profit</p>
                <h2 className="text-2xl font-black text-green-400">₹{totalProfit.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-blue-900/20 to-black rounded-2xl p-5">
            <p className="text-zinc-500">Games Played</p>
            <h2 className="text-2xl font-black">{gamesPlayed}</h2>
          </div>
          <div className="bg-linear-to-r from-purple-900/20 to-black rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Layers className="text-purple-400" />
              <div>
                <p className="text-zinc-500">Active Balls</p>
                <h2 className="text-2xl font-black text-purple-400">{activeBalls.length}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Left Panel - Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <div>
              <h2 className="text-xl font-black mb-3">Bet Settings</h2>
              <label className="block mb-1 text-zinc-400 text-sm">Bet Amount per Ball</label>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))} 
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-3 focus:border-green-500 outline-none"
              />
              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((amount) => (
                  <button key={amount} onClick={() => setBetAmount(amount)} className="bg-zinc-800 hover:bg-zinc-700 rounded-lg py-1.5 text-sm font-bold transition">
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-zinc-400 text-sm">Number of Balls</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMultiBallCount(Math.max(1, multiBallCount - 1))}
                  className="bg-zinc-800 p-2 rounded-xl hover:bg-zinc-700"
                >
                  <span className="text-lg font-bold">-</span>
                </button>
                <span className="text-2xl font-bold w-12 text-center">{multiBallCount}</span>
                <button
                  onClick={() => setMultiBallCount(Math.min(5, multiBallCount + 1))}
                  className="bg-zinc-800 p-2 rounded-xl hover:bg-zinc-700"
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
              <p className="text-zinc-500 text-xs mt-2">Total: ₹{(betAmount * multiBallCount).toLocaleString()}</p>
            </div>

            <div>
              <label className="block mb-1 text-zinc-400 text-sm">Risk Level</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setRisk("low")}
                  className={`py-2 rounded-xl font-bold text-sm transition ${
                    risk === "low" ? "bg-green-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  🟢 LOW
                </button>
                <button
                  onClick={() => setRisk("medium")}
                  className={`py-2 rounded-xl font-bold text-sm transition ${
                    risk === "medium" ? "bg-yellow-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  🟡 MEDIUM
                </button>
                <button
                  onClick={() => setRisk("high")}
                  className={`py-2 rounded-xl font-bold text-sm transition ${
                    risk === "high" ? "bg-red-500 text-white" : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  🔴 HIGH
                </button>
              </div>
            </div>
            
            <button 
              onClick={dropBall} 
              disabled={running || betAmount > wallet || betAmount < 10} 
              className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all ${
                running || betAmount > wallet || betAmount < 10
                  ? "bg-zinc-700 cursor-not-allowed" 
                  : "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black"
              }`}
            >
              {running ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  DROPPING...
                </>
              ) : (
                <>
                  <Play size={18} /> DROP {multiBallCount} BALL{multiBallCount > 1 ? "S" : ""}
                </>
              )}
            </button>
            
            <div className="bg-black rounded-xl p-3">
              <p className="text-zinc-500 text-xs mb-2">Multiplier Range</p>
              <div className="flex justify-between">
                <span className="text-green-400">Min: {Math.min(...multipliers)}x</span>
                <span className="text-yellow-400">Max: {Math.max(...multipliers)}x</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Game Board */}
          <div>
            <div 
              ref={sceneRef} 
              className="border border-green-500/50 rounded-2xl overflow-hidden bg-black"
              style={{ width: WIDTH, height: HEIGHT }}
            />
            
            {/* Multiplier slots */}
            <div className="grid grid-cols-9 gap-0.5 mt-3">
              {multipliers.map((multi, index) => (
                <div
                  key={index}
                  id={`slot-${index}`}
                  className={`py-2 text-center font-black text-sm rounded-lg transition-all ${
                    multi > 1.5 ? "bg-green-500/20 text-green-400" : 
                    multi > 0.8 ? "bg-yellow-500/20 text-yellow-400" : 
                    "bg-red-500/20 text-red-400"
                  }`}
                >
                  {multi}x
                </div>
              ))}
            </div>

            {/* Active Balls Indicator */}
            {activeBalls.length > 0 && (
              <div className="mt-4 bg-zinc-900/50 rounded-xl p-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold">Balls dropping: {activeBalls.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="mt-6 bg-zinc-900 rounded-2xl p-5">
            <h3 className="font-bold mb-3">Recent Results</h3>
            <div className="flex gap-2 flex-wrap">
              {history.slice(0, 10).map((item, i) => (
                <div key={i} className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  item.multiplier > 1.5 ? "bg-green-500/20 text-green-400" :
                  item.multiplier > 0.8 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {item.multiplier}x
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bet History */}
        {showHistory && (
          <div className="mt-6">
            <BetHistory game="plinko" refreshTrigger={historyRefresh} />
          </div>
        )}
      </div>
    </main>
  );
}