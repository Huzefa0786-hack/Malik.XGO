"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import BetHistory from "../components/BetHistory";
import {
    ArrowLeft, Wallet, Trophy, TrendingUp, Play, History,
    Layers, Volume2, VolumeX, Eye, EyeOff, RefreshCw, Zap, Award, Flame, Sparkles, Target
} from "lucide-react";

// ----- Real Plinko Constants -----
const WIDTH = 820;
const HEIGHT = 740;
const SLOT_COUNT = 9;
const PEG_ROWS = 16;
const PEG_RADIUS = 5.5;
const BALL_RADIUS = 9;
const GRAVITY_Y = 0.8;
const PEG_SPACING_X = 34;
const PEG_SPACING_Y = 36;
const START_Y = 90;

// Risk multipliers (slot 0 left, 8 right)
const RISK_MULTIPLIERS = {
    low: [1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2],
    medium: [2.0, 1.5, 1.0, 0.5, 0.2, 0.5, 1.0, 1.5, 2.0],
    high: [10.0, 5.0, 2.0, 1.0, 0.2, 1.0, 2.0, 5.0, 10.0],
};

// Color scheme for slots based on multiplier
const getSlotColor = (multiplier: number) => {
    if (multiplier >= 5) return "from-purple-600 to-pink-600 text-white border-purple-400";
    if (multiplier >= 2) return "from-green-500 to-emerald-500 text-black border-green-400";
    if (multiplier >= 1) return "from-yellow-400 to-amber-400 text-black border-yellow-300";
    return "from-red-500 to-rose-500 text-white border-red-400";
};

type PlinkoBall = Matter.Body & {
    hasLanded?: boolean;
    slotIndex?: number;
    betAmount?: number;
    betId?: string;
    isBall?: boolean;
};

// ============================================================
// SOUND ENGINE (Professional)
// ============================================================
class SoundEngine {
    private ctx: AudioContext | null = null;
    private enabled = true;

    constructor() {
        if (typeof window !== "undefined") {
            try {
                this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (_) { /* ignore */ }
        }
    }

    toggle() { this.enabled = !this.enabled; }

    private playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.2) {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (_) { /* ignore */ }
    }

    drop() {
        this.playTone(440, 0.1, "sine", 0.15);
        setTimeout(() => this.playTone(554, 0.08, "sine", 0.1), 80);
    }

    bounce() {
        this.playTone(600 + Math.random() * 400, 0.035, "sine", 0.07);
    }

    slotHit(multiplier: number) {
        const freq = 300 + multiplier * 70;
        this.playTone(freq, 0.15, "sine", 0.15);
        setTimeout(() => this.playTone(freq * 1.4, 0.1, "sine", 0.1), 80);
    }

    win() {
        [523, 659, 784, 1047, 1568].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15, "sine", 0.2), i * 100);
        });
    }

    lose() {
        [400, 350, 300, 250].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15, "sawtooth", 0.12), i * 100);
        });
    }

    allDropped() {
        this.playTone(880, 0.1, "sine", 0.1);
        setTimeout(() => this.playTone(1100, 0.1, "sine", 0.08), 60);
    }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PlinkoPage() {
    const router = useRouter();
    const sound = useMemo(() => new SoundEngine(), []);

    // ---- User & Wallet ----
    const [user, setUser] = useState<any>(null);
    const [wallet, setWallet] = useState(0);
    const [loading, setLoading] = useState(true);

    // ---- Game State ----
    const [betAmount, setBetAmount] = useState(100);
    const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
    const [multiBallCount, setMultiBallCount] = useState(1);
    const [running, setRunning] = useState(false);
    const [lastWin, setLastWin] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [gamesPlayed, setGamesPlayed] = useState(0);
    const [biggestWin, setBiggestWin] = useState(0);
    const [history, setHistory] = useState<{ multiplier: number; payout: number; balls: number }[]>([]);
    const [activeBalls, setActiveBalls] = useState<PlinkoBall[]>([]);
    const [slotHighlights, setSlotHighlights] = useState<number[]>([]);
    const [showBalance, setShowBalance] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [historyRefresh, setHistoryRefresh] = useState(0);
    const [ballResults, setBallResults] = useState<{ slot: number; multiplier: number; win: number }[]>([]);
    const [gameStatus, setGameStatus] = useState<"idle" | "dropping" | "settled">("idle");

    // ---- Refs ----
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const ballBodiesRef = useRef<PlinkoBall[]>([]);
    const settlementIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isDroppingRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    // ---- Multipliers ----
    const getMultipliers = useCallback(() => RISK_MULTIPLIERS[risk], [risk]);

    // ---- Admin forced result (hidden) ----
    useEffect(() => {
        const checkForcedResult = () => {
            const forced = localStorage.getItem("forced_plinko_result");
            if (forced) {
                try {
                    const parsed = JSON.parse(forced);
                    const slot = parseInt(parsed.result);
                    if (!isNaN(slot) && slot >= 0 && slot <= 8) {
                        localStorage.setItem("_plinko_force_slot", String(slot));
                    }
                    localStorage.removeItem("forced_plinko_result");
                } catch (_) { /* ignore */ }
            }
        };
        checkForcedResult();
        const interval = setInterval(checkForcedResult, 1000);
        return () => clearInterval(interval);
    }, []);

    // ---- Fetch wallet ----
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
            if (res.data.success) setWallet(res.data.balance);
        } catch (_) { /* ignore */ }
    };

    // ---- Matter.js initialization (Realistic Plinko board) ----
    useEffect(() => {
        if (!sceneRef.current || loading) return;

        const { Engine, Render, Runner, World, Bodies, Events } = Matter;

        const engine = Engine.create({
            gravity: { x: 0, y: GRAVITY_Y },
            positionIterations: 20,
            velocityIterations: 20,
        });
        engineRef.current = engine;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: WIDTH,
                height: HEIGHT,
                wireframes: false,
                background: "#0a0a0f",
                showAngleIndicator: false,
                pixelRatio: window.devicePixelRatio || 1,
            },
        });
        renderRef.current = render;

        // ---- Walls (invisible but physical) ----
        const wallOptions = { isStatic: true, restitution: 0.5, render: { visible: false } };
        const wallBorder = { isStatic: true, restitution: 0.7, render: { visible: false } };
        const walls = [
            Bodies.rectangle(WIDTH / 2, HEIGHT + 30, WIDTH + 60, 60, wallOptions),
            Bodies.rectangle(-15, HEIGHT / 2, 30, HEIGHT, wallBorder),
            Bodies.rectangle(WIDTH + 15, HEIGHT / 2, 30, HEIGHT, wallBorder),
            Bodies.rectangle(WIDTH / 2, -15, WIDTH, 30, { ...wallOptions, restitution: 0 }),
        ];

        // ---- Pegs (glowing green) ----
        const pegs: Matter.Body[] = [];
        for (let row = 0; row < PEG_ROWS; row++) {
            const cols = row + 5;
            const rowWidth = (cols - 1) * PEG_SPACING_X;
            const startX = (WIDTH - rowWidth) / 2;
            const y = START_Y + row * PEG_SPACING_Y;
            const offset = (row % 2) * (PEG_SPACING_X / 2);
            for (let i = 0; i < cols; i++) {
                const x = startX + i * PEG_SPACING_X + offset;
                if (x > 30 && x < WIDTH - 30) {
                    const peg = Bodies.circle(x, y, PEG_RADIUS, {
                        isStatic: true,
                        restitution: 0.85,
                        friction: 0.05,
                        render: {
                            fillStyle: "#22c55e",
                            strokeStyle: "#15803d",
                            lineWidth: 1,
                        },
                    });
                    pegs.push(peg);
                }
            }
        }

        // ---- Slot dividers ----
        const slotWidth = WIDTH / SLOT_COUNT;
        const slotY = HEIGHT - 60;
        for (let i = 1; i < SLOT_COUNT; i++) {
            const divider = Bodies.rectangle(i * slotWidth, slotY - 20, 4, 80, {
                isStatic: true,
                render: { fillStyle: "#334155" },
            });
            walls.push(divider);
        }

        // ---- Bottom wall for ball detection ----
        // We'll use collision events instead of manual position checks for better accuracy

        World.add(engine.world, [...walls, ...pegs]);

        // ---- Bounce sound on peg collision ----
        Events.on(engine, "collisionStart", (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;
                const isPegA = pegs.includes(bodyA as any);
                const isPegB = pegs.includes(bodyB as any);
                const isBallA = (bodyA as any).isBall;
                const isBallB = (bodyB as any).isBall;
                if ((isPegA && isBallB) || (isPegB && isBallA)) {
                    sound.bounce();
                }
            });
        });

        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);

        return () => {
            if (renderRef.current) {
                Render.stop(renderRef.current);
                if (renderRef.current.canvas) renderRef.current.canvas.remove();
            }
            if (runnerRef.current) Runner.stop(runnerRef.current);
            if (engineRef.current) {
                World.clear(engineRef.current.world, false);
                Engine.clear(engineRef.current);
            }
            if (settlementIntervalRef.current) clearInterval(settlementIntervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [loading, sound]);

    // ---- Drop Balls (Realistic behavior) ----
    const dropBalls = useCallback(async () => {
        if (running || isDroppingRef.current) return;
        if (!engineRef.current) return;

        const totalCost = betAmount * multiBallCount;
        if (betAmount < 10) {
            alert("Minimum bet per ball is ₹10");
            return;
        }
        if (totalCost > wallet) {
            alert(`Insufficient balance! Need ₹${totalCost.toLocaleString()}`);
            return;
        }

        setBallResults([]);
        setSlotHighlights([]);
        setGameStatus("dropping");
        isDroppingRef.current = true;
        setRunning(true);
        sound.drop();

        try {
            // Place bet
            const betResponse = await api.post("/bet/place", {
                game: "plinko",
                amount: totalCost,
                selection: `${risk}-risk`,
                betType: "plinko",
                multiplier: 1,
            });
            setWallet(betResponse.data.wallet);
            const updatedUser = { ...user, wallet: betResponse.data.wallet };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            const mainBetId = betResponse.data.betId;

            const { Bodies, World } = Matter;
            const engine = engineRef.current;

            // Forced slot from admin
            const forcedSlotStr = localStorage.getItem("_plinko_force_slot");
            let forcedSlot: number | null = null;
            if (forcedSlotStr !== null) {
                forcedSlot = parseInt(forcedSlotStr);
                if (isNaN(forcedSlot) || forcedSlot < 0 || forcedSlot > 8) forcedSlot = null;
                localStorage.removeItem("_plinko_force_slot");
            }

            // Create balls
            const ballsToDrop: PlinkoBall[] = [];
            const dropXBase = WIDTH / 2;
            const spacing = Math.min(18, 180 / multiBallCount);
            const startX = dropXBase - ((multiBallCount - 1) * spacing) / 2;

            for (let i = 0; i < multiBallCount; i++) {
                const x = startX + i * spacing + (Math.random() - 0.5) * 4;
                const clampedX = Math.max(40, Math.min(WIDTH - 40, x));
                const ball = Bodies.circle(clampedX, 50, BALL_RADIUS, {
                    restitution: 0.65,
                    friction: 0.05,
                    density: 0.004,
                    render: {
                        fillStyle: `hsl(${Math.random() * 60 + 100}, 80%, 55%)`,
                        strokeStyle: "#ffffff",
                        lineWidth: 1,
                    },
                }) as PlinkoBall;
                // Assign custom properties after creation
                ball.isBall = true;
                ball.betId = mainBetId;
                ball.betAmount = betAmount;
                ball.hasLanded = false;
                ball.slotIndex = -1;
                // Give a small random horizontal push for realism
                Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * 0.6, y: 1.5 });
                World.add(engine.world, ball);
                ballsToDrop.push(ball);
                ballBodiesRef.current.push(ball);
            }

            setActiveBalls(prev => [...prev, ...ballsToDrop]);

            // ---- Settlement tracker (using interval) ----
            let settledCount = 0;
            const totalBalls = ballsToDrop.length;
            const results: { slot: number; multiplier: number; win: number }[] = [];

            if (settlementIntervalRef.current) clearInterval(settlementIntervalRef.current);
            settlementIntervalRef.current = setInterval(() => {
                for (const ball of ballsToDrop) {
                    if (ball.hasLanded) continue;
                    if (ball.position.y > HEIGHT - 70) {
                        let slot = Math.floor(ball.position.x / (WIDTH / SLOT_COUNT));
                        slot = Math.max(0, Math.min(SLOT_COUNT - 1, slot));
                        if (forcedSlot !== null) {
                            slot = forcedSlot;
                            // Smoothly move ball to slot center
                            const targetX = slot * (WIDTH / SLOT_COUNT) + (WIDTH / SLOT_COUNT) / 2;
                            Matter.Body.setPosition(ball, { x: targetX, y: ball.position.y });
                        }
                        const multipliers = getMultipliers();
                        const multiplier = multipliers[slot];
                        const win = Number(((ball.betAmount ?? betAmount) * multiplier).toFixed(2));
                        ball.slotIndex = slot;
                        ball.hasLanded = true;
                        settledCount++;
                        results.push({ slot, multiplier, win });

                        // Visual feedback
                        setSlotHighlights(prev => [...prev, slot]);
                        sound.slotHit(multiplier);

                        // Remove ball after a moment
                        setTimeout(() => {
                            World.remove(engine.world, ball);
                            setActiveBalls(prev => prev.filter(b => b !== ball));
                            ballBodiesRef.current = ballBodiesRef.current.filter(b => b !== ball);
                        }, 300);

                        if (settledCount === totalBalls) {
                            clearInterval(settlementIntervalRef.current!);
                            settlementIntervalRef.current = null;
                            // All settled
                            const totalWin = results.reduce((sum, r) => sum + r.win, 0);
                            const profit = totalWin - totalCost;
                            setLastWin(totalWin);
                            setTotalProfit(prev => prev + profit);
                            setBiggestWin(prev => totalWin > prev ? totalWin : prev);
                            setHistory(prev => [{ multiplier: totalWin / totalCost, payout: totalWin, balls: totalBalls }, ...prev.slice(0, 14)]);
                            setGamesPlayed(prev => prev + 1);
                            setHistoryRefresh(prev => prev + 1);
                            setBallResults(results);
                            setGameStatus("settled");
                            setRunning(false);
                            isDroppingRef.current = false;

                            // Cashout
                            api.post("/bet/cashout", {
                                betId: mainBetId,
                                winAmount: totalWin,
                                result: `Won ₹${totalWin.toLocaleString()}`,
                                multiplier: totalWin / totalCost,
                            }).then(() => fetchWallet());

                            sound.allDropped();
                            if (profit > 0) sound.win();
                            else if (profit < 0) sound.lose();

                            setTimeout(() => {
                                if (profit > 0) {
                                    alert(`🎉 You won ₹${totalWin.toLocaleString()}! (+₹${profit.toLocaleString()})`);
                                } else if (profit < 0) {
                                    alert(`😢 You lost ₹${Math.abs(profit).toLocaleString()}`);
                                } else {
                                    alert(`💰 Break even.`);
                                }
                                setTimeout(() => setSlotHighlights([]), 1500);
                            }, 400);
                        }
                    }
                }
            }, 50);

        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Failed to drop balls");
            setRunning(false);
            isDroppingRef.current = false;
            setGameStatus("idle");
        }
    }, [betAmount, multiBallCount, risk, wallet, sound, user, getMultipliers, running]);

    // ---- Clear balls ----
    const clearBalls = useCallback(() => {
        if (!engineRef.current) return;
        const { World } = Matter;
        for (const ball of ballBodiesRef.current) {
            World.remove(engineRef.current.world, ball);
        }
        ballBodiesRef.current = [];
        setActiveBalls([]);
        setRunning(false);
        setBallResults([]);
        setGameStatus("idle");
        isDroppingRef.current = false;
        if (settlementIntervalRef.current) {
            clearInterval(settlementIntervalRef.current);
            settlementIntervalRef.current = null;
        }
        localStorage.removeItem("_plinko_force_slot");
    }, []);

    // ---- Helpers ----
    const totalCost = betAmount * multiBallCount;

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500" />
            </div>
        );
    }

    const multipliers = getMultipliers();

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition">
                        <ArrowLeft size={18} /> Back
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { sound.toggle(); setSoundEnabled(!soundEnabled); }}
                            className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
                            title="Toggle Sound"
                        >
                            {soundEnabled ? <Volume2 size={18} className="text-zinc-400" /> : <VolumeX size={18} className="text-zinc-400" />}
                        </button>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                        >
                            <History size={18} /> History
                        </button>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
                        >
                            {showBalance ? <Eye size={18} className="text-zinc-400" /> : <EyeOff size={18} className="text-zinc-400" />}
                        </button>
                        <div className="bg-linear-to-r from-emerald-600 to-emerald-500 rounded-xl px-4 py-2 shadow-lg shadow-emerald-500/20">
                            <span className="font-bold text-black">₹{showBalance ? wallet.toLocaleString() : "****"}</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-5xl font-black bg-linear-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-8">PLINKO</h1>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <StatCard icon={<Wallet className="text-green-400" />} label="Balance" value={`₹${wallet.toLocaleString()}`} />
                    <StatCard icon={<Trophy className="text-yellow-400" />} label="Last Win" value={`₹${lastWin.toLocaleString()}`} />
                    <StatCard icon={<TrendingUp className="text-green-400" />} label="Profit" value={`₹${totalProfit.toLocaleString()}`} valueColor={totalProfit >= 0 ? "text-green-400" : "text-red-400"} />
                    <StatCard icon={<Play className="text-blue-400" />} label="Games" value={gamesPlayed} />
                    <StatCard icon={<Layers className="text-purple-400" />} label="Active Balls" value={activeBalls.length} />
                </div>

                {/* Main layout */}
                <div className="grid lg:grid-cols-[320px_1fr] gap-6">
                    {/* Left Panel - Controls */}
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-5 backdrop-blur-sm">
                        <h2 className="text-xl font-black text-zinc-200">Controls</h2>

                        <div>
                            <label className="block mb-1 text-zinc-400 text-sm">Bet per Ball (₹)</label>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                min={10}
                                step={10}
                                className="w-full bg-black border border-zinc-700 rounded-xl p-3 focus:border-green-500 outline-none transition"
                            />
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {[10, 50, 100, 500].map((amt) => (
                                    <button key={amt} onClick={() => setBetAmount(amt)} className="bg-zinc-800 hover:bg-zinc-700 rounded-lg py-1.5 text-sm font-bold transition">
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-zinc-400 text-sm">Number of Balls</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMultiBallCount(Math.max(1, multiBallCount - 1))}
                                    className="bg-zinc-800 p-2 rounded-xl hover:bg-zinc-700 transition"
                                >
                                    <span className="text-lg font-bold">−</span>
                                </button>
                                <span className="text-2xl font-bold w-12 text-center">{multiBallCount}</span>
                                <button
                                    onClick={() => setMultiBallCount(Math.min(10, multiBallCount + 1))}
                                    className="bg-zinc-800 p-2 rounded-xl hover:bg-zinc-700 transition"
                                >
                                    <span className="text-lg font-bold">+</span>
                                </button>
                            </div>
                            <p className="text-zinc-500 text-xs mt-2">Total: ₹{totalCost.toLocaleString()}</p>
                        </div>

                        <div>
                            <label className="block mb-1 text-zinc-400 text-sm">Risk Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["low", "medium", "high"] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setRisk(level)}
                                        className={`py-2 rounded-xl font-bold text-sm transition ${risk === level
                                                ? level === "low"
                                                    ? "bg-green-500 text-black"
                                                    : level === "medium"
                                                        ? "bg-yellow-500 text-black"
                                                        : "bg-red-500 text-white"
                                                : "bg-zinc-800 hover:bg-zinc-700"
                                            }`}
                                    >
                                        {level === "low" && "🟢 LOW"}
                                        {level === "medium" && "🟡 MEDIUM"}
                                        {level === "high" && "🔴 HIGH"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={dropBalls}
                            disabled={running || betAmount < 10 || totalCost > wallet}
                            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all ${running || betAmount < 10 || totalCost > wallet
                                    ? "bg-zinc-700 cursor-not-allowed"
                                    : "bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black"
                                }`}
                        >
                            {running ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                                    DROPPING...
                                </>
                            ) : (
                                <>
                                    <Play size={18} /> DROP {multiBallCount} BALL{multiBallCount > 1 ? "S" : ""}
                                </>
                            )}
                        </button>

                        <button
                            onClick={clearBalls}
                            disabled={activeBalls.length === 0}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 py-2 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} /> Clear Balls
                        </button>

                        <div className="bg-black/50 rounded-xl p-3 border border-zinc-800/50">
                            <p className="text-zinc-500 text-xs mb-2">Multiplier Range</p>
                            <div className="flex justify-between">
                                <span className="text-green-400">Min: {Math.min(...multipliers)}x</span>
                                <span className="text-yellow-400">Max: {Math.max(...multipliers)}x</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Game Board */}
                    <div className="relative">
                        <div
                            ref={sceneRef}
                            className="border border-green-500/50 rounded-2xl overflow-hidden bg-black"
                            style={{ width: WIDTH, height: HEIGHT }}
                        />
                        {/* Slot multipliers overlay */}
                        <div className="grid grid-cols-9 gap-0.5 mt-2">
                            {multipliers.map((multi, index) => {
                                const isHighlighted = slotHighlights.includes(index);
                                return (
                                    <div
                                        key={index}
                                        className={`py-2 text-center font-black text-sm rounded-lg transition-all duration-300 border ${isHighlighted
                                                ? "bg-yellow-400/40 text-yellow-300 scale-110 border-yellow-400 shadow-lg shadow-yellow-500/50"
                                                : multi > 1.5
                                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                    : multi > 0.8
                                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                        : "bg-red-500/20 text-red-400 border-red-500/30"
                                            }`}
                                    >
                                        {multi}x
                                    </div>
                                );
                            })}
                        </div>
                        {activeBalls.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span>{activeBalls.length} ball{activeBalls.length > 1 ? "s" : ""} in play...</span>
                            </div>
                        )}
                        {ballResults.length > 0 && (
                            <div className="mt-3 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800/50 backdrop-blur-sm">
                                <div className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                    <Award className="text-yellow-400" size={16} />
                                    Results:
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {ballResults.map((r, i) => (
                                        <span key={i} className={`text-xs px-2 py-1 rounded-full font-bold ${r.win > r.multiplier ? "text-green-400 bg-green-500/20" : "text-red-400 bg-red-500/20"}`}>
                                            {r.multiplier}x (₹{r.win.toFixed(0)})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent History */}
                {history.length > 0 && (
                    <div className="mt-6 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Flame className="text-orange-400" size={18} />
                            Recent Results
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                            {history.slice(0, 10).map((item, i) => (
                                <div
                                    key={i}
                                    className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 ${item.multiplier > 1.5
                                            ? "bg-green-500/20 text-green-400"
                                            : item.multiplier > 0.8
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-red-500/20 text-red-400"
                                        }`}
                                >
                                    {item.multiplier.toFixed(2)}x
                                    <span className="text-xs opacity-60">({item.balls} balls)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bet History Modal */}
                {showHistory && (
                    <div className="mt-6">
                        <BetHistory game="plinko" refreshTrigger={historyRefresh} />
                    </div>
                )}
            </div>

            <style jsx>{`
                .animate-pulse {
                    animation: pulse 0.5s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.05); }
                }
                .animate-spin {
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================
function StatCard({ icon, label, value, valueColor = "text-white" }: { icon: React.ReactNode; label: string; value: string | number; valueColor?: string }) {
    return (
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
                {icon}
                <span className="text-xs uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-xl font-bold ${valueColor}`}>{value}</div>
        </div>
    );
}