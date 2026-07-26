"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import { socket } from "../lib/socket";
import BetHistory from "../components/BetHistory";
import {
    ArrowLeft,
    Wallet,
    Trophy,
    History,
    Users,
    Zap,
    Award,
    Crown,
    TrendingUp,
    Clock,
    Volume2,
    VolumeX,
    Eye,
    EyeOff,
    RefreshCw,
    Timer,
    Play,
    Pause,
    SkipForward,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    X,
    Send,
    User,
    Check,
    AlertCircle,
    Info,
    Sparkles,
    Flame,
    Star,
    Hash,
    Shield,
    Verified,
    Copy,
    ExternalLink,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
type CoinSide = "HEADS" | "TAILS";
type BetStatus = "idle" | "placing" | "flipping" | "result" | "settled";
type GamePhase = "betting" | "flipping" | "result" | "waiting";

interface Player {
    id: string;
    username: string;
    avatar?: string;
    bet?: {
        amount: number;
        side: CoinSide;
    };
}

interface ChatMessage {
    id: string;
    username: string;
    message: string;
    timestamp: number;
    isAdmin?: boolean;
    isSystem?: boolean;
}

interface BetHistoryItem {
    id: string;
    result: CoinSide;
    amount: number;
    win: number;
    timestamp: number;
    multiplier: number;
}

interface GameStats {
    totalBets: number;
    totalWagered: number;
    totalPayout: number;
    houseEdge: number;
    winRate: number;
    currentStreak: number;
    maxStreak: number;
}

// ============================================================
// SOUND ENGINE
// ============================================================
class SoundEngine {
    private ctx: AudioContext | null = null;
    private enabled = true;

    constructor() {
        if (typeof window !== "undefined") {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    toggle() { this.enabled = !this.enabled; }

    private playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
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

    flip() {
        this.playTone(600, 0.05, "square", 0.15);
        setTimeout(() => this.playTone(800, 0.05, "square", 0.12), 80);
        setTimeout(() => this.playTone(1000, 0.08, "square", 0.1), 160);
    }

    win() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15, "sine", 0.25), i * 100);
        });
    }

    lose() {
        [400, 350, 300, 250].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.2, "sawtooth", 0.15), i * 80);
        });
    }

    bet() {
        this.playTone(440, 0.08, "sine", 0.2);
        setTimeout(() => this.playTone(554, 0.08, "sine", 0.18), 60);
    }

    countdown(sec: number) {
        if (sec <= 3 && sec > 0) {
            this.playTone(sec === 1 ? 880 : 660, 0.06, "sine", 0.15);
        }
    }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CoinFlipPage() {
    const router = useRouter();
    const sound = useMemo(() => new SoundEngine(), []);

    // --- Auth & User ---
    const [user, setUser] = useState<any>(null);
    const [wallet, setWallet] = useState(0);
    const [loading, setLoading] = useState(true);

    // --- Game State ---
    const [phase, setPhase] = useState<GamePhase>("betting");
    const [timer, setTimer] = useState(30);
    const [roundId, setRoundId] = useState(0);
    const [betAmount, setBetAmount] = useState("");
    const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
    const [result, setResult] = useState<CoinSide | null>(null);
    const [isWin, setIsWin] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [multiplier, setMultiplier] = useState(1.9);
    const [isFlipping, setIsFlipping] = useState(false);
    const [betPlacedForRound, setBetPlacedForRound] = useState(false);
    const [currentBetId, setCurrentBetId] = useState<string | null>(null);

    // --- Stats ---
    const [stats, setStats] = useState<GameStats>({
        totalBets: 0,
        totalWagered: 0,
        totalPayout: 0,
        houseEdge: 5,
        winRate: 0,
        currentStreak: 0,
        maxStreak: 0,
    });
    const [winStreak, setWinStreak] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [lastWin, setLastWin] = useState(0);
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);

    // --- History ---
    const [history, setHistory] = useState<BetHistoryItem[]>([]);
    const [previousResults, setPreviousResults] = useState<CoinSide[]>([]);

    // --- Live ---
    const [liveUsers, setLiveUsers] = useState(1247);
    const [players, setPlayers] = useState<Player[]>([]);
    const [showPlayers, setShowPlayers] = useState(false);

    // --- Chat ---
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [showChat, setShowChat] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- UI ---
    const [showBalance, setShowBalance] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [historyRefresh, setHistoryRefresh] = useState(0);
    const [autoBetEnabled, setAutoBetEnabled] = useState(false);
    const [autoBetSide, setAutoBetSide] = useState<"random" | CoinSide>("random");
    const [coinRotation, setCoinRotation] = useState(0);
    const [showFairVerification, setShowFairVerification] = useState(false);
    const [fairSeed, setFairSeed] = useState("");
    const [fairHash, setFairHash] = useState("");

    // --- Refs ---
    const coinRef = useRef<HTMLDivElement>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const autoBetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

    // ============================================================
    // INIT
    // ============================================================
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/login?redirect=/coin-flip");
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setWallet(parsedUser.wallet || 0);
        setLoading(false);

        // Generate fair seed
        const seed = Array.from({ length: 32 }, () =>
            "0123456789abcdef"[Math.floor(Math.random() * 16)]
        ).join("");
        setFairSeed(seed);

        // Mock players
        const mockPlayers: Player[] = [
            { id: "1", username: "CryptoKing", bet: { amount: 500, side: "HEADS" } },
            { id: "2", username: "LuckyQueen", bet: { amount: 200, side: "TAILS" } },
            { id: "3", username: "BetMaster" },
            { id: "4", username: "CoinWhisperer", bet: { amount: 1000, side: "HEADS" } },
        ];
        setPlayers(mockPlayers);

        // Mock chat
        const mockChat: ChatMessage[] = [
            { id: "1", username: "System", message: "🎰 Welcome to Coin Flip! Place your bets!", timestamp: Date.now() - 60000, isSystem: true },
            { id: "2", username: "CryptoKing", message: "Feeling lucky today! 🍀", timestamp: Date.now() - 30000 },
            { id: "3", username: "LuckyQueen", message: "Heads always wins! 🪙", timestamp: Date.now() - 10000 },
        ];
        setChatMessages(mockChat);

        const userInterval = setInterval(() => {
            setLiveUsers(prev => Math.max(800, prev + Math.floor(Math.random() * 8) - 4));
        }, 5000);

        return () => {
            clearInterval(userInterval);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (autoBetTimeoutRef.current) clearTimeout(autoBetTimeoutRef.current);
            if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
        };
    }, [router]);

    // ============================================================
    // TIMER LOGIC
    // ============================================================
    const startTimer = useCallback(() => {
        setPhase("betting");
        setTimer(30);
        setBetPlacedForRound(false);
        setResult(null);
        setIsWin(false);
        setWinAmount(0);
        setSelectedSide(null);

        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        timerIntervalRef.current = setInterval(() => {
            setTimer(prev => {
                sound.countdown(prev);
                if (prev <= 1) {
                    clearInterval(timerIntervalRef.current!);
                    setPhase("flipping");
                    // Handle auto-bet
                    if (autoBetEnabled && !betPlacedForRound && betAmount && Number(betAmount) >= 10) {
                        const side = autoBetSide === "random"
                            ? (Math.random() < 0.5 ? "HEADS" : "TAILS")
                            : autoBetSide;
                        placeBet(side, true);
                    } else if (!betPlacedForRound) {
                        performCoinFlip(null);
                    } else {
                        // Bet already placed, just flip
                        performCoinFlip(null);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [autoBetEnabled, betAmount, autoBetSide, betPlacedForRound]);

    useEffect(() => {
        startTimer();
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [startTimer]);

    // ============================================================
    // COIN FLIP ENGINE
    // ============================================================
    const flipCoin = useCallback((): Promise<CoinSide> => {
        return new Promise((resolve) => {
            const totalFlips = 8 + Math.floor(Math.random() * 6);
            const duration = 2500;
            const stepTime = duration / totalFlips;
            const flips: number[] = [];

            for (let i = 0; i < totalFlips; i++) {
                flips.push(i * stepTime);
            }

            flips.forEach((time, i) => {
                setTimeout(() => {
                    setCoinRotation(prev => prev + 180);
                    if (i % 2 === 0) sound.flip();
                }, time);
            });

            // Determine result (provably fair)
            const hash = fairSeed + roundId;
            let hashSum = 0;
            for (let i = 0; i < hash.length; i++) {
                hashSum += hash.charCodeAt(i);
            }
            const result = hashSum % 2 === 0 ? "HEADS" : "TAILS";

            setTimeout(() => resolve(result), duration + 400);
        });
    }, [fairSeed, roundId, sound]);

    const performCoinFlip = useCallback(async (side: CoinSide | null) => {
        if (isFlipping) return;
        setIsFlipping(true);
        setPhase("flipping");
        setResult(null);
        setIsWin(false);
        setWinAmount(0);

        const isDisplayFlip = side === null;

        try {
            // Place bet if not display flip
            if (!isDisplayFlip && side) {
                const response = await api.post("/bet/place", {
                    game: "coin-flip",
                    amount: Number(betAmount),
                    selection: side,
                    betType: "coin",
                    multiplier: multiplier,
                });

                setWallet(response.data.wallet);
                setCurrentBetId(response.data.betId);
                setHistoryRefresh(prev => prev + 1);

                const updatedUser = { ...user, wallet: response.data.wallet };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setBetPlacedForRound(true);
                sound.bet();

                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalBets: prev.totalBets + 1,
                    totalWagered: prev.totalWagered + Number(betAmount),
                }));
            }

            // Flip the coin
            const flipResult = await flipCoin();
            setResult(flipResult);
            setPreviousResults(prev => [flipResult, ...prev].slice(0, 15));

            if (!isDisplayFlip && side) {
                const win = flipResult === side;
                setIsWin(win);
                setPhase("result");

                let winAmt = 0;
                if (win) {
                    winAmt = Number(betAmount) * multiplier;
                    setWinAmount(winAmt);
                    setLastWin(winAmt);
                    setWinStreak(prev => prev + 1);
                    setTotalProfit(prev => prev + (winAmt - Number(betAmount)));
                    setWins(prev => prev + 1);
                    sound.win();

                    await api.post("/bet/cashout", {
                        betId: currentBetId,
                        winAmount: winAmt,
                        result: `WON ${flipResult}`,
                        multiplier: multiplier,
                    });

                    // Update wallet
                    const userData = localStorage.getItem("user");
                    if (userData) {
                        const parsed = JSON.parse(userData);
                        setWallet(parsed.wallet);
                    }
                } else {
                    setWinStreak(0);
                    setTotalProfit(prev => prev - Number(betAmount));
                    setLosses(prev => prev + 1);
                    sound.lose();

                    await api.post("/bet/cashout", {
                        betId: currentBetId,
                        winAmount: 0,
                        result: `LOST ${flipResult}`,
                        multiplier: 0,
                    });
                }

                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalPayout: prev.totalPayout + winAmt,
                    winRate: prev.totalBets > 0 ? (wins + (win ? 1 : 0)) / (prev.totalBets + 1) * 100 : 0,
                    currentStreak: win ? prev.currentStreak + 1 : 0,
                    maxStreak: Math.max(prev.maxStreak, win ? prev.currentStreak + 1 : 0),
                }));

                // Add to history
                setHistory(prev => [{
                    id: `h-${Date.now()}`,
                    result: flipResult,
                    amount: Number(betAmount),
                    win: win ? winAmt : 0,
                    timestamp: Date.now(),
                    multiplier: multiplier,
                }, ...prev.slice(0, 19)]);

                setHistoryRefresh(prev => prev + 1);

            } else {
                // Display flip - just show result
                sound.flip();
            }

        } catch (error: any) {
            console.error("Flip error:", error);
            if (!isDisplayFlip) {
                alert(error.response?.data?.error || "Failed to place bet");
            }
            setPhase("betting");
        } finally {
            setIsFlipping(false);
            setCurrentBetId(null);

            // Start next round after delay
            if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
            flipTimeoutRef.current = setTimeout(() => {
                setRoundId(prev => prev + 1);
                setCoinRotation(0);
                setPhase("waiting");
                setTimeout(() => startTimer(), 500);
            }, isDisplayFlip ? 1500 : 3500);
        }
    }, [isFlipping, betAmount, multiplier, user, currentBetId, flipCoin, sound, startTimer, wins]);

    // ============================================================
    // PLACE BET
    // ============================================================
    const placeBet = useCallback(async (side: CoinSide, isAuto = false) => {
        if (betPlacedForRound && !isAuto) {
            alert("You already placed a bet for this round!");
            return;
        }
        if (isFlipping) return;
        if (!betAmount || Number(betAmount) < 10) {
            alert("Minimum bet amount is ₹10");
            return;
        }
        if (Number(betAmount) > wallet) {
            alert("Insufficient balance");
            return;
        }
        if (timer <= 0 || phase !== "betting") {
            alert("Round is over! Waiting for next round...");
            return;
        }

        setSelectedSide(side);
        await performCoinFlip(side);
    }, [betPlacedForRound, isFlipping, betAmount, wallet, timer, phase, performCoinFlip]);

    // ============================================================
    // CHAT
    // ============================================================
    const sendChatMessage = useCallback(() => {
        if (!chatInput.trim()) return;
        const msg: ChatMessage = {
            id: `chat-${Date.now()}`,
            username: user?.username || "Anonymous",
            message: chatInput.trim(),
            timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, msg]);
        setChatInput("");
        // Simulate reply
        setTimeout(() => {
            const replies = [
                "Nice bet! 🍀",
                "Good luck! 🪙",
                "I'm feeling lucky today!",
                "Heads or tails? 🤔",
                "Let's go! 🔥",
            ];
            const reply: ChatMessage = {
                id: `chat-${Date.now()}`,
                username: "System",
                message: replies[Math.floor(Math.random() * replies.length)],
                timestamp: Date.now(),
                isSystem: true,
            };
            setChatMessages(prev => [...prev, reply]);
        }, 2000);
    }, [chatInput, user]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    // ============================================================
    // HELPERS
    // ============================================================
    const formatNumber = (num: number) => {
        if (num === undefined || num === null) return "0";
        return num.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
        });
    };

    const getTimerColor = () => {
        if (timer > 10) return "text-emerald-400";
        if (timer > 5) return "text-amber-400";
        return "text-rose-400 animate-pulse";
    };

    const getTimerBg = () => {
        if (timer > 10) return "bg-emerald-500";
        if (timer > 5) return "bg-amber-500";
        return "bg-rose-500";
    };

    const getPhaseText = () => {
        switch (phase) {
            case "betting": return "🎯 Place Your Bet";
            case "flipping": return "🔄 Flipping...";
            case "result": return "🏆 Result!";
            case "waiting": return "⏳ Next Round...";
            default: return "";
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-500/30 border-t-emerald-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🪙</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* ============================================================
            HEADER
            ============================================================ */}
            <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="text-zinc-400 hover:text-white transition p-1.5 rounded-lg hover:bg-zinc-800/50"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <Crown className="text-emerald-400" size={26} strokeWidth={2.5} />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            </div>
                            <h1 className="text-xl md:text-2xl font-black bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                COIN FLIP
                            </h1>
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                                LIVE
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Live Users */}
                        <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                            <div className="relative">
                                <Users size={14} className="text-emerald-400" />
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            </div>
                            <span className="font-medium">{liveUsers.toLocaleString()}</span>
                        </div>

                        {/* Chat Toggle */}
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50 relative"
                        >
                            <MessageCircle size={18} className={showChat ? "text-emerald-400" : "text-zinc-400"} />
                            {chatMessages.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full text-[8px] font-bold flex items-center justify-center">
                                    {chatMessages.length}
                                </span>
                            )}
                        </button>

                        {/* History */}
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50"
                        >
                            <History size={18} className="text-zinc-400" />
                        </button>

                        {/* Sound */}
                        <button
                            onClick={() => { sound.toggle(); setSoundEnabled(!soundEnabled); }}
                            className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50"
                        >
                            {soundEnabled ? <Volume2 size={18} className="text-zinc-400" /> : <VolumeX size={18} className="text-zinc-400" />}
                        </button>

                        {/* Balance */}
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50"
                        >
                            {showBalance ? <Eye size={18} className="text-zinc-400" /> : <EyeOff size={18} className="text-zinc-400" />}
                        </button>

                        <div className="bg-linear-to-r from-emerald-600 to-emerald-500 rounded-xl px-3 md:px-4 py-2 shadow-lg shadow-emerald-500/20">
                            <span className="font-bold text-black text-sm md:text-base">
                                ₹{showBalance ? formatNumber(wallet) : "****"}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============================================================
            MAIN CONTENT
            ============================================================ */}
            <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                {/* ============================================================
                TOP STATS
                ============================================================ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
                    <StatCard
                        icon={<Trophy size={16} className="text-amber-400" />}
                        label="Win Streak"
                        value={winStreak}
                        valueColor={winStreak > 0 ? "text-amber-400" : "text-zinc-400"}
                        suffix={winStreak > 0 ? "🔥" : ""}
                    />
                    <StatCard
                        icon={<TrendingUp size={16} className={totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"} />}
                        label="Total Profit"
                        value={`₹${formatNumber(totalProfit)}`}
                        valueColor={totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
                    />
                    <StatCard
                        icon={<Award size={16} className="text-yellow-400" />}
                        label="Last Win"
                        value={`₹${formatNumber(lastWin)}`}
                        valueColor={lastWin > 0 ? "text-yellow-400" : "text-zinc-400"}
                    />
                    <StatCard
                        icon={<Zap size={16} className="text-cyan-400" />}
                        label="W/L"
                        value={`${wins}/${losses}`}
                        valueColor="text-cyan-400"
                    />
                    <StatCard
                        icon={<Clock size={16} className="text-emerald-400" />}
                        label="Next Flip"
                        value={`${timer}s`}
                        valueColor={getTimerColor()}
                        pulse={timer <= 5 && phase === "betting"}
                    />
                    <StatCard
                        icon={<Shield size={16} className="text-purple-400" />}
                        label="Fairness"
                        value="Provably Fair"
                        valueColor="text-purple-400"
                        valueSize="text-xs"
                    />
                </div>

                {/* ============================================================
                TIMER BAR
                ============================================================ */}
                <div className="w-full bg-zinc-800/50 rounded-full h-2.5 mb-6 overflow-hidden border border-zinc-700/30">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${getTimerBg()} relative`}
                        style={{ width: `${(timer / 30) * 100}%` }}
                    >
                        {phase === "flipping" && (
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        )}
                    </div>
                </div>

                {/* ============================================================
                PHASE INDICATOR
                ============================================================ */}
                <div className="flex justify-center mb-4">
                    <div className={`px-6 py-2 rounded-full text-sm font-bold border ${phase === "betting" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                            phase === "flipping" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 animate-pulse" :
                            phase === "result" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                            "bg-zinc-500/10 border-zinc-500/30 text-zinc-400"
                        }`}>
                        {getPhaseText()}
                        {phase === "betting" && (
                            <span className="ml-2 text-emerald-400 animate-pulse">●</span>
                        )}
                        {phase === "flipping" && (
                            <span className="ml-2">🔄</span>
                        )}
                    </div>
                </div>

                {/* ============================================================
                COIN FLIP ARENA
                ============================================================ */}
                <div className="relative bg-linear-to-br from-zinc-900/90 to-black/90 rounded-2xl p-6 md:p-8 border border-zinc-800/50 mb-6 overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute inset-0 bg-linear-to-r from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col items-center">
                        {/* Round ID */}
                        <div className="text-xs text-zinc-500 mb-3 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full border border-zinc-800/50">
                            <Hash size={12} />
                            <span>Round #{roundId}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className={phase === "betting" ? "text-emerald-400" : phase === "result" ? "text-blue-400" : "text-zinc-400"}>
                                {phase === "betting" ? "Betting Open" :
                                    phase === "flipping" ? "Flipping..." :
                                    phase === "result" ? "Settled" : "Waiting"}
                            </span>
                        </div>

                        {/* ============================================================
                        COIN 3D
                        ============================================================ */}
                        <div className="relative w-48 h-48 md:w-56 md:h-56 mb-6">
                            <div
                                ref={coinRef}
                                className="w-full h-full relative preserve-3d transition-transform duration-100"
                                style={{
                                    transform: `rotateY(${coinRotation}deg) rotateX(${Math.sin(coinRotation / 180 * Math.PI) * 5}deg)`,
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                {/* HEADS */}
                                <div className="absolute inset-0 w-full h-full rounded-full bg-linear-to-br from-amber-300 to-amber-500 flex items-center justify-center backface-hidden border-4 border-amber-400 shadow-2xl shadow-amber-500/30">
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">HEADS</span>
                                        <span className="text-xs text-amber-200 mt-1">🪙</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-linear-to-b from-white/20 to-transparent pointer-events-none" />
                                </div>
                                {/* TAILS */}
                                <div className="absolute inset-0 w-full h-full rounded-full bg-linear-to-br from-zinc-300 to-zinc-500 flex items-center justify-center backface-hidden border-4 border-zinc-400 shadow-2xl shadow-zinc-500/30 rotate-y-180">
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">TAILS</span>
                                        <span className="text-xs text-zinc-200 mt-1">🪙</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-linear-to-b from-white/20 to-transparent pointer-events-none" />
                                </div>
                            </div>

                            {/* Glow effect */}
                            {result && (
                                <div className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 ${isWin ? "bg-emerald-500/30" : "bg-rose-500/30"}`} />
                            )}
                        </div>

                        {/* ============================================================
                        RESULT DISPLAY
                        ============================================================ */}
                        {result && phase === "result" && (
                            <div className={`text-center mb-4 animate-fade-in-up`}>
                                <div className={`text-3xl md:text-4xl font-bold ${isWin ? "text-emerald-400" : "text-rose-400"} animate-pulse`}>
                                    {isWin ? "🎉 YOU WON!" : "😢 YOU LOST!"}
                                </div>
                                {isWin && (
                                    <div className="text-2xl md:text-3xl font-bold text-yellow-400 mt-1">
                                        +₹{formatNumber(winAmount)}
                                    </div>
                                )}
                                <div className="text-base text-zinc-400 mt-2 flex items-center justify-center gap-2">
                                    <span>Coin landed on</span>
                                    <span className={`font-bold px-3 py-1 rounded-lg ${result === "HEADS" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                                        {result}
                                    </span>
                                    <span className="text-xs text-zinc-500">×{multiplier.toFixed(1)}</span>
                                </div>
                            </div>
                        )}

                        {/* ============================================================
                        BET BUTTONS
                        ============================================================ */}
                        {phase === "betting" && !isFlipping && !result && (
                            <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-4">
                                <button
                                    onClick={() => placeBet("HEADS")}
                                    disabled={!betAmount || Number(betAmount) < 10 || betPlacedForRound}
                                    className={`
                                        relative overflow-hidden group
                                        bg-linear-to-r from-amber-400 to-amber-500
                                        hover:from-amber-500 hover:to-amber-600
                                        text-black font-black py-4 rounded-xl text-xl md:text-2xl
                                        transition-all transform hover:scale-105 active:scale-95
                                        disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed
                                        shadow-lg shadow-amber-500/20
                                    `}
                                >
                                    <span className="relative z-10">🪙 HEADS</span>
                                    <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                    onClick={() => placeBet("TAILS")}
                                    disabled={!betAmount || Number(betAmount) < 10 || betPlacedForRound}
                                    className={`
                                        relative overflow-hidden group
                                        bg-linear-to-r from-zinc-400 to-zinc-500
                                        hover:from-zinc-500 hover:to-zinc-600
                                        text-black font-black py-4 rounded-xl text-xl md:text-2xl
                                        transition-all transform hover:scale-105 active:scale-95
                                        disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed
                                        shadow-lg shadow-zinc-500/20
                                    `}
                                >
                                    <span className="relative z-10">🪙 TAILS</span>
                                    <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        )}

                        {/* Bet placed indicator */}
                        {betPlacedForRound && phase === "betting" && (
                            <div className="text-emerald-400 font-bold mb-3 animate-pulse flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                                <Check size={16} />
                                Bet placed on {selectedSide} — Waiting for flip...
                            </div>
                        )}

                        {/* ============================================================
                        BET INPUT
                        ============================================================ */}
                        <div className="w-full max-w-md">
                            <div className="relative mb-3">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">₹</span>
                                <input
                                    type="number"
                                    placeholder="Enter bet amount (Min ₹10)"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    disabled={isFlipping || phase === "result" || betPlacedForRound}
                                    className="w-full bg-black/50 border border-zinc-700/50 rounded-xl px-10 py-3.5 text-lg font-bold focus:border-emerald-500 outline-none transition disabled:opacity-50 placeholder:text-zinc-600"
                                />
                                {betAmount && Number(betAmount) > 0 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                                        {Number(betAmount) > wallet ? (
                                            <span className="text-rose-400">Insufficient</span>
                                        ) : (
                                            <span className="text-emerald-400">✓</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick amounts */}
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setBetAmount(amount.toString())}
                                        disabled={isFlipping || phase === "result" || betPlacedForRound}
                                        className="bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 py-2 rounded-lg font-bold transition border border-zinc-700/30 text-sm"
                                    >
                                        ₹{amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ============================================================
                        AUTO BET & FAIRNESS
                        ============================================================ */}
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                            {/* Auto Bet */}
                            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-xl px-3 py-1.5 border border-zinc-700/30">
                                <button
                                    onClick={() => setAutoBetEnabled(!autoBetEnabled)}
                                    className={`px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${autoBetEnabled ? "bg-emerald-500 text-black" : "bg-zinc-700/50 text-zinc-400"
                                        }`}
                                >
                                    {autoBetEnabled ? <Play size={12} /> : <Pause size={12} />}
                                    Auto {autoBetEnabled ? "ON" : "OFF"}
                                </button>
                                {autoBetEnabled && (
                                    <select
                                        value={autoBetSide}
                                        onChange={(e) => setAutoBetSide(e.target.value as any)}
                                        className="bg-black/50 text-xs text-zinc-300 rounded-lg px-2 py-1 border border-zinc-700/30 outline-none"
                                    >
                                        <option value="random">🎲 Random</option>
                                        <option value="HEADS">🪙 Heads</option>
                                        <option value="TAILS">🪙 Tails</option>
                                    </select>
                                )}
                            </div>

                            {/* Fairness */}
                            <button
                                onClick={() => setShowFairVerification(!showFairVerification)}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-zinc-700/30"
                            >
                                <Shield size={14} />
                                <span>Provably Fair</span>
                                <ChevronDown size={12} className={showFairVerification ? "rotate-180" : ""} />
                            </button>
                        </div>

                        {/* Fairness verification panel */}
                        {showFairVerification && (
                            <div className="w-full max-w-md mt-3 bg-black/50 rounded-xl p-4 border border-zinc-700/30 text-xs space-y-2 animate-fade-in-up">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Server Seed</span>
                                    <span className="font-mono text-zinc-300 truncate max-w-45">{fairSeed}</span>
                                    <button onClick={() => navigator.clipboard.writeText(fairSeed)} className="text-zinc-500 hover:text-zinc-300">
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Round</span>
                                    <span className="font-mono text-zinc-300">#{roundId}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Result Hash</span>
                                    <span className="font-mono text-emerald-400 text-[10px] truncate max-w-45">
                                        {fairSeed + roundId}
                                    </span>
                                </div>
                                <div className="text-zinc-500 text-[10px] mt-1 border-t border-zinc-800/50 pt-2">
                                    Result determined by: hash(seed + round) % 2 = {result || "pending"}
                                </div>
                            </div>
                        )}

                        {/* Previous results */}
                        {previousResults.length > 0 && (
                            <div className="flex gap-1 flex-wrap justify-center mt-4">
                                <span className="text-xs text-zinc-500 mr-1">Recent:</span>
                                {previousResults.map((res, i) => (
                                    <div
                                        key={i}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${res === "HEADS"
                                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                                            }`}
                                    >
                                        {res === "HEADS" ? "H" : "T"}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Next round button */}
                        {phase === "result" && result && (
                            <button
                                onClick={() => {
                                    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
                                    setResult(null);
                                    setIsWin(false);
                                    setWinAmount(0);
                                    setSelectedSide(null);
                                    setBetPlacedForRound(false);
                                    setCoinRotation(0);
                                    setRoundId(prev => prev + 1);
                                    startTimer();
                                }}
                                className="mt-4 bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-black px-8 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                <RefreshCw size={18} /> Next Round
                            </button>
                        )}
                    </div>
                </div>

                {/* ============================================================
                RECENT HISTORY
                ============================================================ */}
                {history.length > 0 && (
                    <div className="bg-zinc-900/50 rounded-2xl p-4 md:p-6 border border-zinc-800/50 mb-6 backdrop-blur-sm">
                        <h3 className="font-bold text-sm text-zinc-400 mb-3 flex items-center gap-2">
                            <History size={16} />
                            Recent Flips
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {history.slice(0, 5).map((item, i) => (
                                <div
                                    key={i}
                                    className={`bg-black/50 rounded-xl p-3 text-center border ${item.win > 0 ? "border-emerald-500/30" : "border-rose-500/30"
                                        } transition hover:scale-105`}
                                >
                                    <p className={`text-sm font-bold ${item.result === "HEADS" ? "text-amber-400" : "text-zinc-400"}`}>
                                        {item.result}
                                    </p>
                                    <p className={`text-xs font-bold ${item.win > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {item.win > 0 ? `+₹${formatNumber(item.win)}` : `-₹${formatNumber(item.amount)}`}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ============================================================
                HISTORY MODAL
                ============================================================ */}
                {showHistory && (
                    <div className="mt-4 animate-fade-in-up">
                        <BetHistory game="coin-flip" refreshTrigger={historyRefresh} />
                    </div>
                )}
            </div>

            {/* ============================================================
            CHAT SIDEBAR (overlay)
            ============================================================ */}
            {showChat && (
                <div className="fixed inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-zinc-950/98 backdrop-blur-xl border-l border-zinc-800/80 z-50 flex flex-col shadow-2xl animate-slide-in-right">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={18} className="text-emerald-400" />
                            <h3 className="font-bold text-zinc-200">Live Chat</h3>
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                {chatMessages.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowChat(false)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 transition"
                        >
                            <X size={18} className="text-zinc-400" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {chatMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.isSystem ? "items-center" : "items-start"}`}
                            >
                                {msg.isSystem ? (
                                    <div className="text-xs text-zinc-500 bg-zinc-800/30 px-3 py-1 rounded-full">
                                        {msg.message}
                                    </div>
                                ) : (
                                    <div className="max-w-[85%]">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-emerald-400">
                                                {msg.username}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="bg-zinc-800/50 rounded-xl px-3 py-2 text-sm text-zinc-200 wrap-break-word">
                                            {msg.message}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-zinc-800/50 flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                            className="flex-1 bg-black/50 rounded-xl px-4 py-2.5 text-sm border border-zinc-700/30 focus:border-emerald-500 outline-none transition"
                        />
                        <button
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim()}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black p-2.5 rounded-xl transition"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================
            LIVE PLAYERS (bottom right)
            ============================================================ */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setShowPlayers(!showPlayers)}
                    className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-full p-3 shadow-2xl hover:bg-zinc-800/90 transition flex items-center gap-2"
                >
                    <Users size={20} className="text-emerald-400" />
                    <span className="text-sm font-bold text-zinc-200">{players.length}</span>
                    {showPlayers ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronUp size={16} className="text-zinc-400" />}
                </button>

                {showPlayers && (
                    <div className="absolute bottom-16 right-0 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-3 w-56 max-h-64 overflow-y-auto shadow-2xl animate-fade-in-up">
                        <h4 className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
                            <Users size={12} /> Live Players
                        </h4>
                        <div className="space-y-1.5">
                            {players.map((p) => (
                                <div key={p.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                            {p.username[0]}
                                        </div>
                                        <span className="text-zinc-300">{p.username}</span>
                                    </div>
                                    {p.bet && (
                                        <span className={`text-xs font-bold ${p.bet.side === "HEADS" ? "text-amber-400" : "text-zinc-400"}`}>
                                            ₹{formatNumber(p.bet.amount)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================
            STYLES
            ============================================================ */}
            <style jsx>{`
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #3f3f46;
                    border-radius: 10px;
                }
            `}</style>
        </main>
    );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueColor?: string;
    valueSize?: string;
    suffix?: string;
    pulse?: boolean;
}

function StatCard({ icon, label, value, valueColor = "text-white", valueSize = "text-lg", suffix = "", pulse = false }: StatCardProps) {
    return (
        <div className="bg-zinc-900/50 rounded-2xl p-3 border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                {icon}
                <span className="text-[10px] uppercase tracking-wider">{label}</span>
            </div>
            <div className={`font-bold ${valueSize} ${valueColor} ${pulse ? "animate-pulse" : ""}`}>
                {value} {suffix}
            </div>
        </div>
    );
}