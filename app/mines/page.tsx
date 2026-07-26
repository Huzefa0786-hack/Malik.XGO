"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import { socket } from "../lib/socket";
import BetHistory from "../components/BetHistory";
import { Bomb, Gem, Wallet, ArrowLeft, Trophy, TrendingUp, History, Zap, RefreshCw, Volume2, VolumeX, Eye, EyeOff, Crown, Award, Flame, Target } from "lucide-react";

const GRID_SIZE = 25; // 5x5

// ============================================================
// SOUND ENGINE (unchanged)
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

    tileClick() { this.playTone(600, 0.08, "sine", 0.12); }
    gemReveal() {
        this.playTone(800, 0.1, "sine", 0.15);
        setTimeout(() => this.playTone(1000, 0.1, "sine", 0.1), 80);
    }
    mineExplode() {
        this.playTone(200, 0.4, "sawtooth", 0.25);
        setTimeout(() => this.playTone(150, 0.3, "sawtooth", 0.2), 100);
        setTimeout(() => this.playTone(100, 0.5, "sawtooth", 0.3), 200);
    }
    winCashout() {
        [523, 659, 784, 1047, 1568].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15, "sine", 0.2), i * 100);
        });
    }
    gameOver() {
        this.playTone(400, 0.3, "sawtooth", 0.15);
        setTimeout(() => this.playTone(300, 0.3, "sawtooth", 0.12), 150);
        setTimeout(() => this.playTone(200, 0.4, "sawtooth", 0.15), 300);
    }
    startGame() {
        this.playTone(440, 0.1, "sine", 0.15);
        setTimeout(() => this.playTone(554, 0.1, "sine", 0.12), 80);
    }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MinesPage() {
    const router = useRouter();
    const sound = useMemo(() => new SoundEngine(), []);

    // --- User & Auth ---
    const [user, setUser] = useState<any>(null);
    const [wallet, setWallet] = useState(0);
    const [loading, setLoading] = useState(true);

    // --- Game State ---
    const [betAmount, setBetAmount] = useState(100);
    const [minesCount, setMinesCount] = useState(3);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
    const [minePositions, setMinePositions] = useState<number[]>([]);
    const [multiplier, setMultiplier] = useState(1);
    const [profit, setProfit] = useState(0);
    const [explodedMine, setExplodedMine] = useState<number | null>(null);
    const [streak, setStreak] = useState(0);
    const [history, setHistory] = useState<{ multiplier: number; profit: number; mines: number; gems: number }[]>([]);
    const [currentBetId, setCurrentBetId] = useState<string | null>(null);
    const [historyRefresh, setHistoryRefresh] = useState(0);
    const [showHistory, setShowHistory] = useState(false);

    // --- UI ---
    const [showBalance, setShowBalance] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [tileAnimating, setTileAnimating] = useState<number | null>(null);
    const [totalGames, setTotalGames] = useState(0);
    const [totalWins, setTotalWins] = useState(0);

    // ============================================================
    // FORCED RESULT FROM ADMIN
    // ============================================================
    useEffect(() => {
        const checkForcedResult = () => {
            const forcedData = localStorage.getItem("forced_mines_result");
            if (forcedData) {
                try {
                    const parsed = JSON.parse(forcedData);
                    if (!gameStarted && !gameOver) {
                        localStorage.setItem("_mines_force", parsed.result);
                    }
                    localStorage.removeItem("forced_mines_result");
                } catch (_) {}
            }
        };
        checkForcedResult();
        const interval = setInterval(checkForcedResult, 1000);
        return () => clearInterval(interval);
    }, [gameStarted, gameOver]);

    // ============================================================
    // INIT
    // ============================================================
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/login?redirect=/mines");
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

    // ============================================================
    // MULTIPLIER FUNCTION (NEW TIERED LOGIC)
    // ============================================================
    const getMultiplierForMines = (mines: number, revealed: number): number => {
        let base: number;
        if (mines >= 1 && mines <= 3) {
            // Low risk: 1.1x to 1.3x
            base = 1 + 0.1 * mines;
        } else if (mines >= 4 && mines <= 9) {
            // Medium risk: 1.7x to 2.7x
            base = 1.5 + 0.2 * (mines - 3);
        } else if (mines >= 10 && mines <= 15) {
            // High risk: 3.3x to 4.8x
            base = 3.0 + 0.3 * (mines - 9);
        } else {
            base = 1.0;
        }
        const bonus = revealed * 0.05; // each gem adds 0.05x
        return Number((base + bonus).toFixed(2));
    };

    // ============================================================
    // GAME LOGIC
    // ============================================================
    const generateMinesWithForce = (): number[] => {
        const force = localStorage.getItem("_mines_force");
        let mines: number[] = [];
        if (force === "WIN") {
            while (true) {
                const temp: number[] = [];
                while (temp.length < minesCount) {
                    const r = Math.floor(Math.random() * GRID_SIZE);
                    if (!temp.includes(r) && r !== 0) temp.push(r);
                }
                if (temp.length === minesCount) {
                    mines = temp;
                    break;
                }
            }
            localStorage.removeItem("_mines_force");
        } else if (force === "LOSE") {
            while (mines.length < minesCount) {
                const r = Math.floor(Math.random() * GRID_SIZE);
                if (!mines.includes(r)) mines.push(r);
            }
            localStorage.setItem("_mines_force_lose", "true");
            localStorage.removeItem("_mines_force");
        } else {
            while (mines.length < minesCount) {
                const r = Math.floor(Math.random() * GRID_SIZE);
                if (!mines.includes(r)) mines.push(r);
            }
        }
        return mines;
    };

    const startGame = async () => {
        if (wallet < betAmount) {
            alert("Insufficient balance");
            return;
        }

        if (betAmount < 10) {
            alert("Minimum bet is ₹10");
            return;
        }

        try {
            const response = await api.post("/bet/place", {
                game: "mines",
                amount: betAmount,
                selection: "start",
                betType: "mines",
                multiplier: 1,
            });

            setWallet(response.data.wallet);
            setCurrentBetId(response.data.betId);

            const updatedUser = { ...user, wallet: response.data.wallet };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            const mines = generateMinesWithForce();
            setMinePositions(mines);
            setRevealedTiles([]);
            setMultiplier(1);
            setProfit(0);
            setWon(false);
            setGameOver(false);
            setExplodedMine(null);
            setGameStarted(true);
            setTotalGames(prev => prev + 1);
            sound.startGame();

            localStorage.removeItem("_mines_force_lose");

        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to start game");
        }
    };

    const revealTile = async (index: number) => {
        if (revealedTiles.includes(index) || gameOver || !gameStarted) return;
        if (tileAnimating !== null) return;

        sound.tileClick();

        const forcedLose = localStorage.getItem("_mines_force_lose");
        let isMine = minePositions.includes(index);
        if (forcedLose === "true" && revealedTiles.length === 0) {
            isMine = true;
            localStorage.removeItem("_mines_force_lose");
            if (!minePositions.includes(index)) {
                setMinePositions(prev => [...prev, index]);
            }
        }

        if (isMine) {
            setTileAnimating(index);
            sound.mineExplode();
            setTimeout(() => setTileAnimating(null), 600);

            setExplodedMine(index);
            setRevealedTiles(Array.from({ length: GRID_SIZE }, (_, i) => i));
            setGameOver(true);
            setGameStarted(false);
            setWon(false);
            setStreak(0);

            if (currentBetId) {
                await api.post("/bet/cashout", {
                    betId: currentBetId,
                    winAmount: 0,
                    result: "mine",
                    multiplier: 0,
                });
                setHistoryRefresh(prev => prev + 1);
                fetchWallet();
            }
            sound.gameOver();
            return;
        }

        sound.gemReveal();
        setTileAnimating(index);
        setTimeout(() => setTileAnimating(null), 400);

        const updated = [...revealedTiles, index];
        setRevealedTiles(updated);
        const newMultiplier = getMultiplierForMines(minesCount, updated.length);
        setMultiplier(newMultiplier);
        setProfit(Math.floor(betAmount * newMultiplier));
    };

    const cashout = async () => {
        if (gameOver || revealedTiles.length === 0 || !gameStarted) return;
        if (!currentBetId) return;

        try {
            const response = await api.post("/bet/cashout", {
                betId: currentBetId,
                winAmount: profit,
                result: `cashout with ${revealedTiles.length} gems`,
                multiplier: multiplier,
            });

            setWallet(response.data.wallet);
            fetchWallet();
            setHistoryRefresh(prev => prev + 1);

            const updatedUser = { ...user, wallet: response.data.wallet };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            setWon(true);
            setGameOver(true);
            setGameStarted(false);
            setStreak(prev => prev + 1);
            setTotalWins(prev => prev + 1);
            setHistory(prev => [
                { multiplier, profit, mines: minesCount, gems: revealedTiles.length },
                ...prev.slice(0, 9),
            ]);

            // Reveal all tiles to show mines
            setRevealedTiles(Array.from({ length: GRID_SIZE }, (_, i) => i));

            sound.winCashout();

        } catch (error: any) {
            alert(error.response?.data?.error || "Cashout failed");
        }
    };

    const resetGame = () => {
        setGameStarted(false);
        setGameOver(false);
        setWon(false);
        setExplodedMine(null);
        setMultiplier(1);
        setProfit(0);
        setRevealedTiles([]);
        setCurrentBetId(null);
        setTileAnimating(null);
        localStorage.removeItem("_mines_force_lose");
        localStorage.removeItem("_mines_force");
    };

    const tiles = Array.from({ length: GRID_SIZE });

    // ============================================================
    // RENDER
    // ============================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-500/30 border-t-emerald-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">💎</div>
                </div>
            </div>
        );
    }

    const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    return (
        <main className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Header (unchanged) */}
            <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-zinc-400 hover:text-white transition p-1.5 rounded-lg hover:bg-zinc-800/50">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <Bomb className="text-orange-400" size={26} strokeWidth={2} />
                            <h1 className="text-xl md:text-2xl font-black bg-linear-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                MINES
                            </h1>
                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 animate-pulse">
                                LIVE
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex items-center gap-3 text-xs">
                            <span className="text-zinc-500">Games: <span className="text-white font-bold">{totalGames}</span></span>
                            <span className="text-zinc-500">Wins: <span className="text-green-400 font-bold">{totalWins}</span></span>
                            <span className="text-zinc-500">Win Rate: <span className="text-blue-400 font-bold">{winRate.toFixed(1)}%</span></span>
                        </div>
                        <button onClick={() => { sound.toggle(); setSoundEnabled(!soundEnabled); }} className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50">
                            {soundEnabled ? <Volume2 size={18} className="text-zinc-400" /> : <VolumeX size={18} className="text-zinc-400" />}
                        </button>
                        <button onClick={() => setShowHistory(!showHistory)} className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50">
                            <History size={18} className="text-zinc-400" />
                        </button>
                        <button onClick={() => setShowBalance(!showBalance)} className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50">
                            {showBalance ? <Eye size={18} className="text-zinc-400" /> : <EyeOff size={18} className="text-zinc-400" />}
                        </button>
                        <div className="bg-linear-to-r from-emerald-600 to-emerald-500 rounded-xl px-3 md:px-4 py-2 shadow-lg shadow-emerald-500/20">
                            <span className="font-bold text-black text-sm md:text-base">
                                ₹{showBalance ? wallet.toLocaleString() : "****"}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-[320px_1fr_280px] gap-6">
                {/* Left Panel: Controls */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6 backdrop-blur-sm space-y-4">
                    <h2 className="text-lg font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                        <Zap className="text-orange-400" size={18} />
                        Game Panel
                    </h2>
                    <div>
                        <label className="text-zinc-500 text-sm">Bet Amount (₹)</label>
                        <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={gameStarted} className="w-full bg-black/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-lg font-bold focus:border-orange-500 outline-none transition disabled:opacity-50" min={10} />
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {[100, 500, 1000, 5000].map((amt) => (
                                <button key={amt} onClick={() => setBetAmount(amt)} disabled={gameStarted} className="bg-zinc-800/50 hover:bg-zinc-700/50 px-3 py-1 rounded-lg text-xs font-bold transition">₹{amt.toLocaleString()}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-zinc-500 text-sm">Number of Mines</label>
                        <select value={minesCount} onChange={(e) => setMinesCount(Number(e.target.value))} disabled={gameStarted} className="w-full bg-black/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-lg font-bold focus:border-orange-500 outline-none transition disabled:opacity-50">
                            {[...Array(15).keys()].map(i => i+1).map((count) => (
                                <option key={count} value={count}>{count} Mines</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={startGame} disabled={gameStarted || gameOver} className="w-full bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black font-black rounded-xl py-4 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-orange-500/20">
                        {gameStarted ? "GAME IN PROGRESS" : "🚀 START GAME"}
                    </button>
                    <button onClick={cashout} disabled={!gameStarted || gameOver || revealedTiles.length === 0} className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black font-black rounded-xl py-4 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-green-500/20">
                        💰 CASH OUT (x{multiplier})
                    </button>
                    <button onClick={resetGame} className="w-full bg-linear-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 border border-zinc-700/30 rounded-xl py-4 font-bold transition flex items-center justify-center gap-2">
                        <RefreshCw size={18} /> Reset Game
                    </button>
                    <div className="bg-black/50 rounded-xl p-4 text-center border border-zinc-800/30">
                        <p className="text-xs text-zinc-500">Status</p>
                        <p className={`font-bold ${gameStarted ? "text-green-400" : gameOver ? won ? "text-emerald-400" : "text-red-400" : "text-zinc-400"}`}>
                            {gameStarted ? "🟢 In Progress" : gameOver ? won ? "✅ Won" : "💥 Lost" : "⏸ Waiting"}
                        </p>
                        {gameStarted && <p className="text-xs text-zinc-500 mt-1">Gems: {revealedTiles.length} / {GRID_SIZE - minesCount}</p>}
                    </div>
                </div>

                {/* Center: Grid */}
                <div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 text-center">
                            <p className="text-xs text-zinc-500">Multiplier</p>
                            <h2 className="text-2xl font-black text-green-400">x{multiplier}</h2>
                        </div>
                        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 text-center">
                            <p className="text-xs text-zinc-500">Potential Profit</p>
                            <h2 className="text-2xl font-black text-yellow-400">₹{profit.toLocaleString()}</h2>
                        </div>
                        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 text-center">
                            <p className="text-xs text-zinc-500">Win Streak</p>
                            <h2 className="text-2xl font-black text-blue-400">{streak}</h2>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6 backdrop-blur-sm">
                        <div className="grid grid-cols-5 gap-3">
                            {tiles.map((_, index) => {
                                const revealed = revealedTiles.includes(index);
                                const exploded = explodedMine === index;
                                const isAnimating = tileAnimating === index;
                                const isMine = minePositions.includes(index);
                                const isGem = revealed && !isMine && !exploded;

                                let bgColor = "bg-zinc-800/50 border-zinc-700/50";
                                let hoverEffect = "hover:border-orange-400 hover:scale-105";
                                let icon = null;

                                if (exploded) {
                                    bgColor = "bg-red-500/30 border-red-500 shadow-red-500/30";
                                    hoverEffect = "";
                                    icon = <Bomb className="w-8 h-8 text-red-400 animate-pulse" />;
                                } else if (isGem) {
                                    bgColor = "bg-emerald-500/20 border-emerald-400 shadow-emerald-500/20";
                                    hoverEffect = "";
                                    icon = <Gem className="w-8 h-8 text-emerald-400 animate-scale-in" />;
                                } else if (revealed && isMine) {
                                    bgColor = "bg-red-500/20 border-red-400";
                                    hoverEffect = "";
                                    icon = <Bomb className="w-8 h-8 text-red-400" />;
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => revealTile(index)}
                                        disabled={gameOver || !gameStarted || revealed}
                                        className={`aspect-square rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${bgColor} ${hoverEffect} ${isAnimating ? "scale-110" : ""} ${!gameStarted && !gameOver ? "opacity-50" : "opacity-100"}`}
                                        style={{ boxShadow: isGem ? "0 0 20px rgba(16, 185, 129, 0.3)" : "none" }}
                                    >
                                        {icon}
                                        {!revealed && !gameOver && <div className="w-4 h-4 bg-zinc-600/30 rounded-full" />}
                                        {gameOver && !revealed && <span className="text-zinc-600 text-xs">?</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex justify-between text-xs text-zinc-500 border-t border-zinc-800/30 pt-4">
                            <span>Mines: {minesCount}</span>
                            <span>Safe tiles: {GRID_SIZE - minesCount}</span>
                            <span>Revealed: {revealedTiles.length}</span>
                        </div>
                    </div>

                    {gameOver && (
                        <div className={`mt-4 p-4 rounded-xl text-center font-bold text-lg ${won ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400" : "bg-red-500/20 border border-red-500 text-red-400"}`}>
                            {won ? `🎉 You won ₹${profit.toLocaleString()}!` : "💥 You hit a mine! Game Over."}
                            {won && <p className="text-sm font-normal text-zinc-400">Multiplier: x{multiplier}</p>}
                            <div className="mt-2 text-xs text-zinc-500">
                                {won ? "All mines revealed below (red bombs)" : "The red bombs show where the mines were hidden"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Recent Wins */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2 mb-4">
                        <Trophy className="text-yellow-400" size={18} />
                        Recent Wins
                    </h2>
                    <div className="space-y-3 max-h-125 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                        {history.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">No games yet</p>
                        ) : (
                            history.slice(0, 10).map((item, i) => (
                                <div key={i} className="bg-black/50 border border-zinc-800/50 rounded-xl p-4 transition hover:border-yellow-500/30">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-green-400 font-bold text-lg">x{item.multiplier}</span>
                                            <span className="text-xs text-zinc-500 ml-2">{item.mines} mines</span>
                                        </div>
                                        <span className="text-yellow-400 font-bold">+₹{item.profit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                        <span>Gems: {item.gems}</span>
                                        <span>{new Date().toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {history.length > 0 && (
                        <button onClick={() => setShowHistory(true)} className="w-full mt-4 text-center text-xs text-zinc-500 hover:text-white transition">
                            View full history →
                        </button>
                    )}
                </div>
            </div>

            {/* History Modal */}
            {showHistory && (
                <div className="max-w-7xl mx-auto px-4 pb-6 animate-fade-in-up">
                    <BetHistory game="mines" refreshTrigger={historyRefresh} />
                </div>
            )}

            {/* Styles */}
            <style jsx>{`
                @keyframes scale-in {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
            `}</style>
        </main>
    );
}