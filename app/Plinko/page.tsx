"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, Wallet, Trophy, TrendingUp, Play, History, Plus, Minus, Layers } from "lucide-react";
import { useGame } from "../context/GameContext";

const WIDTH = 800;
const HEIGHT = 700;

// LOW RISK - Mostly small wins, rarely lose
const LOW_RISK_MULTIPLIERS = [
  { value: 0.8, chance: 10 },
  { value: 0.9, chance: 15 },
  { value: 1.0, chance: 30 },
  { value: 1.1, chance: 20 },
  { value: 1.2, chance: 15 },
  { value: 1.5, chance: 8 },
  { value: 3.0, chance: 2 },
];

// MEDIUM RISK - Balanced wins and losses
const MEDIUM_RISK_MULTIPLIERS = [
  { value: 0.3, chance: 50 },
  { value: 0.5, chance: 40 },
  { value: 0.7, chance: 15 },
  { value: 1.0, chance: 25 },
  { value: 1.3, chance: 20 },
  { value: 1.8, chance: 12 },
  { value: 2.5, chance: 8 },
  { value: 4.0, chance: 1 },
  { value: 6.0, chance: 0.2 },
];

// HIGH RISK - Big wins but high chance of loss
const HIGH_RISK_MULTIPLIERS = [
  { value: 0.1, chance: 40 },
  { value: 0.2, chance: 60 },
  { value: 0.3, chance: 15 },
  { value: 0.5, chance: 20 },
  { value: 1.0, chance: 20 },
  { value: 2.0, chance: 10 },
  { value: 5.0, chance: 8 },
  { value: 10.0, chance: 1 },
  { value: 20.0, chance: 0.5 },
  { value: 50.0, chance: 0.1 },
];

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
  const [isDropping, setIsDropping] = useState(false);
  const [recentMultipliers, setRecentMultipliers] = useState<number[]>([]);
  const { gameState, socket } = useGame();

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

  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0 });

  // Get random multiplier based on risk level
  const getRandomMultiplier = (): number => {
    let multipliers;
    switch (risk) {
      case "low":
        multipliers = LOW_RISK_MULTIPLIERS;
        break;
      case "high":
        multipliers = HIGH_RISK_MULTIPLIERS;
        break;
      default:
        multipliers = MEDIUM_RISK_MULTIPLIERS;
    }
    
    const totalChance = multipliers.reduce((sum, m) => sum + m.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const multiplier of multipliers) {
      if (random <= multiplier.chance) {
        return multiplier.value;
      }
      random -= multiplier.chance;
    }
    return 1;
  };

  // Get display multipliers for UI
  const getDisplayMultipliers = () => {
    switch (risk) {
      case "low":
        return [ 2.0, 1.1,0.8, 0.9, 1.2, 1.5, 3.0];
      case "high":
        return [ 20.0, 2.0, 5.0, 0.1, 0.2, 0.5, 10.0, 20.0];
      default:
        return [ 1.0, 1.3, 0.3, 0.5, 0.7,1.8, 2.5, 4.0, 6.0];
    }
  };

  const getSlotFromX = (x: number): number => {
    const slotWidth = WIDTH / 9;
    let slot = Math.floor(x / slotWidth);
    if (slot < 0) slot = 0;
    if (slot > 8) slot = 8;
    return slot;
  };

  const createBall = (x: number, betAmount: number, betId: string): Matter.Body => {
    const { Bodies } = Matter;
    return Bodies.circle(x, 50, 8, {
      restitution: 0.65,
      friction: 0.05,
      density: 0.004,
      label: `ball_${Date.now()}_${Math.random()}`,
      render: {
        fillStyle: `hsl(${Math.random() * 60 + 100}, 80%, 55%)`,
        strokeStyle: "#ffffff",
        lineWidth: 1.5
      }
    });
  };

  const dropSingleBall = async (amount: number, betId: string, ballIndex: number): Promise<number> => {
    return new Promise(async (resolve) => {
      if (!engineRef.current) {
        resolve(0);
        return;
      }

      const { Bodies, World, Events } = Matter;
      
      // Always drop from center with small spread for multiple balls
      const dropX = WIDTH / 2;
      const finalX = dropX + (ballIndex - (multiBallCount - 1) / 2) * 8;
      const clampedX = Math.max(40, Math.min(WIDTH - 40, finalX));
      
      const ball = Bodies.circle(clampedX, 45, 7, {
        restitution: 0.7 + Math.random() * 0.1,
        friction: 0.03,
        density: 0.003,
        render: {
          fillStyle: `hsl(${Math.random() * 60 + 100}, 80%, 55%)`,
          strokeStyle: "#ffffff",
          lineWidth: 1.5
        }
      });

      const ballId = nextBallId + ballIndex;
      
      World.add(engineRef.current.world, ball);
      setActiveBalls(prev => [...prev, { id: ballId, body: ball, betAmount: amount, betId: betId }]);

      const checkPosition = () => {
        if (ball.position.y > HEIGHT - 80) {
          const slot = getSlotFromX(ball.position.x);
          const multiplier = getRandomMultiplier();
          const winAmount = Number((amount * multiplier).toFixed(2));
          
          // Highlight slot
          const slotElement = document.getElementById(`slot-${slot}`);
          if (slotElement) {
            slotElement.classList.add('animate-pulse', winAmount > amount ? 'bg-green-500/30' : 'bg-red-500/30');
            setTimeout(() => {
              slotElement.classList.remove('animate-pulse', 'bg-green-500/30', 'bg-red-500/30');
            }, 500);
          }
          
          // Remove ball
          World.remove(engineRef.current!.world, ball);
          setActiveBalls(prev => prev.filter(b => b.id !== ballId));
          Events.off(engineRef.current!, "afterUpdate", checkPosition);
          
          resolve(winAmount);
        }
      };

      Events.on(engineRef.current, "afterUpdate", checkPosition);
    });
  };

  const dropBalls = async () => {
    if (running || isDropping) return;
    if (!engineRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login?redirect=/plinko");
      return;
    }

    const totalCost = betAmount * multiBallCount;

    if (betAmount <= 0 || betAmount < 10) {
      alert("Minimum bet is ₹10");
      return;
    }

    if (totalCost > wallet) {
      alert(`Insufficient Balance! Need ₹${totalCost.toLocaleString()}`);
      return;
    }

    setIsDropping(true);
    setRunning(true);
    
    try {
      const betResponse = await axios.post(
        "http://localhost:5000/api/bet/place",
        { game: "plinko", amount: totalCost, selection: "multi-drop", betType: "plinko", multiplier: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setWallet(betResponse.data.wallet);
      const updatedUser = { ...user, wallet: betResponse.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      const mainBetId = betResponse.data.betId;
      
      const dropPromises = [];
      for (let i = 0; i < multiBallCount; i++) {
        dropPromises.push(dropSingleBall(betAmount, mainBetId, i));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const results = await Promise.all(dropPromises);
      const totalWin = results.reduce((sum, win) => sum + win, 0);
      const newMultipliers = results.map(win => win / betAmount);
      setRecentMultipliers(prev => [...newMultipliers, ...prev].slice(0, 20));
      
      if (totalWin > 0) {
        const finalResponse = await axios.post(
          "http://localhost:5000/api/bet/cashout",
          { betId: mainBetId, winAmount: totalWin, result: `${totalWin}`, multiplier: totalWin / totalCost },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setWallet(finalResponse.data.wallet);
        const finalUser = { ...user, wallet: finalResponse.data.wallet };
        localStorage.setItem("user", JSON.stringify(finalUser));
        setUser(finalUser);
        
        setLastWin(totalWin);
        setTotalProfit(prev => prev + (totalWin - totalCost));
        setBiggestWin(prev => totalWin > prev ? totalWin : prev);
        setHistory(prev => [{ multiplier: totalWin / totalCost, payout: totalWin }, ...prev.slice(0, 14)]);
        setGamesPlayed(prev => prev + 1);
        setHistoryRefresh(prev => prev + 1);
        fetchStats(token);
        
        if (totalWin > totalCost) {
          alert(`🎉 WIN! Won ₹${totalWin.toLocaleString()} from ${multiBallCount} balls! 🎉`);
        } else if (totalWin > 0) {
          alert(`💰 Won ₹${totalWin.toLocaleString()} from ${multiBallCount} balls`);
        } else {
          alert(`😢 Lost ₹${totalCost.toLocaleString()}`);
        }
      } else {
        setGamesPlayed(prev => prev + 1);
        setHistoryRefresh(prev => prev + 1);
        fetchStats(token);
        alert(`😢 Total loss: ₹${totalCost.toLocaleString()}`);
      }
      
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to drop balls");
    } finally {
      setIsDropping(false);
      setRunning(false);
    }
  };

  // Initialize Matter.js engine
  useEffect(() => {
    if (!sceneRef.current || loading) return;
    
    const { Engine, Render, Runner, World, Bodies } = Matter;
    
    const engine = Engine.create();
    engine.gravity.x = 0;
    engine.gravity.y = 1.2;
    engine.positionIterations = 20;
    engine.velocityIterations = 20;
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
    
    // Create pegs
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

  const displayMultipliers = getDisplayMultipliers();
  const riskColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-red-500"
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={18} /> Back
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-700"
            >
              <History size={18} /> {showHistory ? "Hide History" : "Show History"}
            </button>
          </div>
        </div>
        
        <h1 className="text-5xl font-black text-green-400 mb-6">PLINKO</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Wallet className="text-green-400" size={18} />
              <p className="text-zinc-500 text-sm">Balance</p>
            </div>
            <h2 className="text-xl font-black text-green-400">₹{wallet.toLocaleString()}</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400" size={18} />
              <p className="text-zinc-500 text-sm">Last Win</p>
            </div>
            <h2 className="text-xl font-black text-yellow-400">₹{lastWin.toLocaleString()}</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-400" size={18} />
              <p className="text-zinc-500 text-sm">Profit</p>
            </div>
            <h2 className="text-xl font-black text-green-400">₹{totalProfit.toLocaleString()}</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Games</p>
            <h2 className="text-xl font-black">{gamesPlayed}</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Win Rate</p>
            <h2 className="text-xl font-black">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Layers className="text-blue-400" size={18} />
              <p className="text-zinc-500 text-sm">Active</p>
            </div>
            <h2 className="text-xl font-black text-blue-400">{activeBalls.length}</h2>
          </div>
        </div>

        {/* Risk Level Selector */}
        <div className="bg-zinc-900/50 rounded-2xl p-4 mb-4">
          <p className="text-zinc-400 text-sm mb-3">Select Risk Level</p>
          <div className="flex gap-3">
            <button
              onClick={() => setRisk("low")}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                risk === "low" 
                  ? "bg-green-500 text-black scale-105" 
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              🟢 LOW RISK
            </button>
            <button
              onClick={() => setRisk("medium")}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                risk === "medium" 
                  ? "bg-yellow-500 text-black scale-105" 
                  : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
              }`}
            >
              🟡 MEDIUM RISK
            </button>
            <button
              onClick={() => setRisk("high")}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                risk === "high" 
                  ? "bg-red-500 text-white scale-105" 
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
            >
              🔴 HIGH RISK
            </button>
          </div>
        </div>

        {/* Multiplier */}
        <div className="bg-zinc-900/50 rounded-2xl p-3 mb-4">
          <p className="text-zinc-500 text-xs text-center mb-2">
            {risk === "low" && "🟢 Low Risk: Mostly 0.8x-2.0x (90% chance to win or break even)"}
            {risk === "medium" && "🟡 Medium Risk: 0.3x-6.0x (Balanced wins and losses)"}
            {risk === "high" && "🔴 High Risk: 0.1x-50.0x (Big wins but high chance of loss)"}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {displayMultipliers.map((multi, i) => (
              <span key={i} className={`text-xs font-bold px-2 py-1 rounded ${
                multi >= 2 ? "bg-green-500/20 text-green-400" :
                multi >= 1 ? "bg-yellow-500/20 text-yellow-400" : 
                "bg-red-500/20 text-red-400"
              }`}>
                {multi}x
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
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
                {[10, 100, 500,1000].map((amount) => (
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
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-bold w-12 text-center">{multiBallCount}</span>
                <button
                  onClick={() => setMultiBallCount(Math.min(10, multiBallCount + 1))}
                  className="bg-zinc-800 p-2 rounded-xl hover:bg-zinc-700"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-zinc-500 text-xs mt-2">Total: ₹{(betAmount * multiBallCount).toLocaleString()}</p>
            </div>
            
            <button 
              onClick={dropBalls} 
              disabled={running || isDropping || betAmount > wallet || betAmount < 10} 
              className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all ${
                running || isDropping || betAmount > wallet || betAmount < 10
                  ? "bg-zinc-700 cursor-not-allowed" 
                  : "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black"
              }`}
            >
              {running || isDropping ? (
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

            {/* Recent Multipliers */}
            {recentMultipliers.length > 0 && (
              <div className="bg-black rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-2">Recent Results</p>
                <div className="flex gap-1 flex-wrap">
                  {recentMultipliers.slice(0, 10).map((multi, i) => (
                    <span key={i} className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      multi > 2 ? "bg-green-500/30 text-green-400" :
                      multi >= 1 ? "bg-yellow-500/30 text-yellow-400" : 
                      "bg-red-500/30 text-red-400"
                    }`}>
                      {multi}x
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Game Board */}
          <div>
            <div 
              ref={sceneRef} 
              className="border border-green-500/50 rounded-2xl overflow-hidden bg-black cursor-pointer"
              style={{ width: WIDTH, height: HEIGHT }}
            />
            
            {/* Multiplier slots */}
            <div className="grid grid-cols-9 gap-0.5 mt-3">
              {displayMultipliers.slice(0, 9).map((multi, index) => (
                <div
                  key={index}
                  id={`slot-${index}`}
                  className={`py-2 text-center font-black text-xs rounded-lg transition-all ${
                    multi >= 2 ? "bg-green-500/20 text-green-400" :
                    multi >= 1 ? "bg-yellow-500/20 text-yellow-400" : 
                    "bg-red-500/20 text-red-400"
                  }`}
                >
                  {multi}x
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Balls Indicator */}
        {activeBalls.length > 0 && (
          <div className="mt-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold">Dropping: {activeBalls.length} balls</span>
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