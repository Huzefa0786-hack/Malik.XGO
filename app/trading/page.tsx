"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import BetHistory from "../components/BetHistory";
import { useGame } from "../context/GameContext";
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    TrendingDown,
    Clock,
    CandlestickChart,
    History,
    Zap,
    Eye,
    EyeOff,
    Volume2,
    VolumeX,
    BarChart3,
    Gauge,
    Percent,
    DollarSign,
    Activity,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Maximize2,
    Minimize2,
    RefreshCw,
    Settings,
    Info,
    X,
    Check,
    Plus,
    Minus,
    Star,
    Award,
    Flame,
    Shield,
    Lock,
    Unlock,
    Sliders,
    Edit,
    Target,
    Radar,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Users,
    Gamepad2,
    Crown,
    LogOut,
    Send,
    Ban,
    Trash2,
    CreditCard,
    Banknote,
    Coins,
    Filter,
    Download,
    Calendar,
    CheckCircle,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Play,
    Pause,
    StopCircle,
    Search,
} from "lucide-react";

// ============================================================
// TYPES & CONSTANTS (shared with admin panel)
// ============================================================

// Trading assets with realistic properties
const ASSETS = [
    {
        id: "EURUSD",
        name: "EUR/USD",
        symbol: "EURUSD",
        icon: "💶",
        minBet: 10,
        maxBet: 50000,
        return: 92,
        precision: 5,
        volatility: 0.0005,
        basePrice: 1.09250,
        spread: 0.0002,
        trend: 0.00001,
    },
    {
        id: "GBPUSD",
        name: "GBP/USD",
        symbol: "GBPUSD",
        icon: "💷",
        minBet: 10,
        maxBet: 50000,
        return: 91,
        precision: 5,
        volatility: 0.0006,
        basePrice: 1.26800,
        spread: 0.00025,
        trend: -0.000005,
    },
    {
        id: "BTCUSD",
        name: "BTC/USD",
        symbol: "BTCUSD",
        icon: "₿",
        minBet: 10,
        maxBet: 50000,
        return: 85,
        precision: 0,
        volatility: 120,
        basePrice: 65000,
        spread: 50,
        trend: 0.5,
    },
    {
        id: "ETHUSD",
        name: "ETH/USD",
        symbol: "ETHUSD",
        icon: "⟠",
        minBet: 10,
        maxBet: 50000,
        return: 87,
        precision: 1,
        volatility: 15,
        basePrice: 3500,
        spread: 8,
        trend: -0.2,
    },
    {
        id: "AAPL",
        name: "Apple",
        symbol: "AAPL",
        icon: "🍎",
        minBet: 10,
        maxBet: 50000,
        return: 93,
        precision: 2,
        volatility: 0.8,
        basePrice: 178.50,
        spread: 0.3,
        trend: 0.05,
    },
    {
        id: "GOOGL",
        name: "Google",
        symbol: "GOOGL",
        icon: "🔍",
        minBet: 10,
        maxBet: 50000,
        return: 92,
        precision: 2,
        volatility: 0.9,
        basePrice: 141.20,
        spread: 0.4,
        trend: -0.02,
    },
    {
        id: "TSLA",
        name: "Tesla",
        symbol: "TSLA",
        icon: "🚗",
        minBet: 10,
        maxBet: 50000,
        return: 88,
        precision: 2,
        volatility: 1.5,
        basePrice: 245.30,
        spread: 0.6,
        trend: 0.1,
    },
    {
        id: "NVDA",
        name: "NVIDIA",
        symbol: "NVDA",
        icon: "🎮",
        minBet: 10,
        maxBet: 50000,
        return: 89,
        precision: 2,
        volatility: 1.4,
        basePrice: 820.00,
        spread: 0.5,
        trend: 0.15,
    },
];

// Expiry times (in seconds)
const EXPIRY_TIMES = [
    { label: "30s", seconds: 30, color: "bg-purple-500" },
    { label: "1m", seconds: 60, color: "bg-blue-500" },
    { label: "2m", seconds: 120, color: "bg-cyan-500" },
    { label: "5m", seconds: 300, color: "bg-teal-500" },
    { label: "15m", seconds: 900, color: "bg-green-500" },
    { label: "30m", seconds: 1800, color: "bg-yellow-500" },
    { label: "1h", seconds: 3600, color: "bg-orange-500" },
    { label: "4h", seconds: 14400, color: "bg-red-500" },
];

// Timeframes for chart
const TIMEFRAMES = [
    { label: "1m", seconds: 60, multiplier: 1 },
    { label: "5m", seconds: 300, multiplier: 5 },
    { label: "15m", seconds: 900, multiplier: 15 },
    { label: "1h", seconds: 3600, multiplier: 60 },
];

// ------------------------------
// Candle Data Structure
// ------------------------------
interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

// ------------------------------
// Active Trade (open position)
// ------------------------------
interface ActiveTrade {
    id: string;
    assetId: string;
    assetName: string;
    amount: number;
    direction: "CALL" | "PUT";
    expirySeconds: number;
    entryPrice: number;
    expiryTime: number;
    betId: string;
    returnPercent: number;
    stopLoss?: number;
    takeProfit?: number;
}

// ------------------------------
// Completed Trade
// ------------------------------
interface CompletedTrade {
    id: string;
    asset: string;
    amount: number;
    direction: "CALL" | "PUT";
    result: "WIN" | "LOSS";
    profit: number;
    time: string;
    entryPrice: number;
    exitPrice: number;
}

// ------------------------------
// Price History for each asset (with multiple timeframes)
// ------------------------------
interface AssetData {
    id: string;
    current: number;
    history: Map<number, Candle[]>; // key: timeframe seconds
    direction: "UP" | "DOWN" | "SIDEWAYS";
    changePercent: number;
    high: number;
    low: number;
}

// ------------------------------
// Admin Panel Types
// ------------------------------
interface UserType {
    _id: string;
    name: string;
    email: string;
    uid: string;
    wallet: number;
    isBanned: boolean;
    role: string;
}

interface TransactionType {
    _id: string;
    userId: string;
    userName: string;
    userUid: string;
    type: "deposit" | "withdraw";
    amount: number;
    method: "upi" | "bank" | "crypto" | "wallet";
    status: "pending" | "approved" | "rejected" | "completed" | "failed";
    details: {
        upiId?: string;
        bankAccount?: string;
        bankName?: string;
        ifscCode?: string;
        accountHolder?: string;
        cryptoAddress?: string;
        cryptoNetwork?: string;
        transactionId?: string;
        notes?: string;
    };
    adminNotes?: string;
    processedBy?: string;
    processedAt?: string;
    createdAt: string;
}

// ============================================================
// SOUND ENGINE
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

    tradeOpen() {
        this.playTone(523, 0.1, "sine", 0.15);
        setTimeout(() => this.playTone(659, 0.1, "sine", 0.12), 80);
    }

    tradeWin() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15, "sine", 0.2), i * 120);
        });
    }

    tradeLose() {
        [400, 350, 300, 250].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15, "sawtooth", 0.12), i * 100);
        });
    }

    tick() {
        this.playTone(1200, 0.02, "sine", 0.05);
    }
}

// ============================================================
// MAIN COMPONENT: QuotexPage with Integrated Admin Panel
// ============================================================
export default function QuotexPage() {
    const router = useRouter();
    const sound = useMemo(() => new SoundEngine(), []);

    // --- User & Auth ---
    const [user, setUser] = useState<any>(null);
    const [wallet, setWallet] = useState(0);
    const [loading, setLoading] = useState(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // --- UI State ---
    const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
    const [betAmount, setBetAmount] = useState(100);
    const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_TIMES[2]);
    const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[0]);
    const [showBalance, setShowBalance] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [historyRefresh, setHistoryRefresh] = useState(0);
    const [isPlacingBet, setIsPlacingBet] = useState(false);
    const [isFullscreenChart, setIsFullscreenChart] = useState(false);

    // --- Admin Panel ---
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [adminSecret, setAdminSecret] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    // --- Admin State (same as admin page) ---
    const [adminActiveTab, setAdminActiveTab] = useState("dashboard");
    const [users, setUsers] = useState<UserType[]>([]);
    const [transactions, setTransactions] = useState<TransactionType[]>([]);
    const [adminLoading, setAdminLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [walletAmount, setWalletAmount] = useState<{ [key: string]: string }>({});
    const [message, setMessage] = useState<{ text: string; type: string; timestamp?: number } | null>(null);
    const [selectedGame, setSelectedGame] = useState("trading");
    const [gameStatus, setGameStatus] = useState("RUNNING");
    const [forceResultValue, setForceResultValue] = useState("");
    const [transactionFilter, setTransactionFilter] = useState<"all" | "deposit" | "withdraw">("all");
    const [transactionStatus, setTransactionStatus] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("all");
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [adminNote, setAdminNote] = useState("");
    const [transactionStats, setTransactionStats] = useState({
        totalDeposits: 0,
        totalWithdrawals: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        totalCompleted: 0,
        totalRejected: 0,
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        totalWallet: 0,
        totalDeposits: 125000,
        totalWithdrawals: 72400,
    });
    const [platformSettings, setPlatformSettings] = useState({
        siteName: "Malik.XGO",
        maintenance: false,
        depositBonus: 10,
        referralBonus: 5,
        minDeposit: 100,
        maxDeposit: 100000,
        minWithdraw: 500,
        maxWithdraw: 50000,
    });

    // --- Game Settings (shared) ---
    const [gameSettings, setGameSettings] = useState({
        colorTrade: {
            enabled: true,
            minBet: 10,
            maxBet: 10000,
            greenMultiplier: 2,
            violetMultiplier: 4.5,
            redMultiplier: 2,
            numberMultiplier: 9,
            bigMultiplier: 1.5,
            smallMultiplier: 1.5,
            lastForcedResult: null,
            forcedResult: null,
        },
        coinFlip: {
            enabled: true,
            minBet: 10,
            maxBet: 10000,
            multiplier: 1.9,
            lastForcedResult: null,
            forcedResult: null,
        },
        mines: {
            enabled: true,
            minBet: 10,
            maxBet: 10000,
            maxMines: 10,
            multipliers: [1.5, 2.0, 2.5, 3.2, 4.0, 5.0, 6.5, 8.0, 10.0, 12.5],
            lastForcedResult: null,
            forcedResult: null,
        },
        sky: {
            enabled: true,
            minBet: 10,
            maxBet: 10000,
            maxMultiplier: 20,
            crashRate: 0.03,
            lastForcedResult: null,
            forcedResult: null,
        },
        spin: {
            enabled: true,
            minBet: 10,
            maxBet: 10000,
            heartsMultiplier: 2,
            spadesMultiplier: 3,
            clubsMultiplier: 4,
            diamondsMultiplier: 5,
            lastForcedResult: null,
            forcedResult: null,
        },
        plinko: {
            enabled: true,
            minBet: 10,
            maxBet: 10000,
            lastForcedResult: null,
            forcedResult: null,
            riskLevels: ["LOW", "MEDIUM", "HIGH"],
            multipliers: {
                LOW: [1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2],
                MEDIUM: [2.0, 1.5, 1.0, 0.5, 0.2, 0.5, 1.0, 1.5, 2.0],
                HIGH: [10.0, 5.0, 2.0, 1.0, 0.2, 1.0, 2.0, 5.0, 10.0],
            },
        },
        lottery: {
            enabled: true,
            ticketPrice: 10,
            jackpot: 100000,
            lastForcedResult: null,
            forcedResult: null,
        },
        trading: {
            enabled: true,
            minBet: 10,
            maxBet: 10000,
            winProbability: 30,
            lossProbability: 70,
            lastForcedResult: null,
            forcedResult: null,
            // Extended trading settings
            volatility: 1.0,
            trend: 0,
            manualPriceMode: false,
            priceOverride: 0,
        },
    });

    // --- Trading Page Specific State ---
    const [assetDataMap, setAssetDataMap] = useState<Map<string, AssetData>>(new Map());
    const [currentPrice, setCurrentPrice] = useState(1.09250);
    const [marketSentiment, setMarketSentiment] = useState<"BULLISH" | "BEARISH" | "NEUTRAL">("NEUTRAL");
    const [sentimentScore, setSentimentScore] = useState(0);
    const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
    const [completedTrades, setCompletedTrades] = useState<CompletedTrade[]>([]);
    const [totalProfit, setTotalProfit] = useState(0);
    const [winStreak, setWinStreak] = useState(0);
    const [tradingStats, setTradingStats] = useState({ totalWins: 0, totalLosses: 0, totalTrades: 0 });
    const [countdowns, setCountdowns] = useState<Map<string, number>>(new Map());

    // --- Chart ---
    const chartCanvasRef = useRef<HTMLCanvasElement>(null);
    const chartIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tradeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ============================================================
    // HELPERS
    // ============================================================
    const formatPrice = useCallback(
        (price: number) => {
            if (price === undefined || isNaN(price)) return "0";
            return price.toFixed(selectedAsset.precision);
        },
        [selectedAsset.precision]
    );

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    const formatNumber = (num: number) => {
        return num?.toLocaleString() || "0";
    };

    const quickAmounts = [100, 500, 1000, 5000, 10000, 25000];

    // ============================================================
    // DATA GENERATION (historical candles)
    // ============================================================
    const generateHistoricalCandles = useCallback(
        (asset: typeof ASSETS[0], count: number, timeframeSeconds: number): Candle[] => {
            const candles: Candle[] = [];
            let price = asset.basePrice;
            const now = Date.now();
            const step = timeframeSeconds * 1000;

            for (let i = count; i >= 0; i--) {
                const change = (Math.random() - 0.5) * asset.volatility * 0.6 + asset.trend * (timeframeSeconds / 60);
                const open = price;
                const close = open + change;
                const high = Math.max(open, close) + Math.random() * asset.volatility * 0.3;
                const low = Math.min(open, close) - Math.random() * asset.volatility * 0.3;
                candles.push({
                    time: now - i * step,
                    open,
                    high,
                    low,
                    close,
                    volume: Math.random() * 100,
                });
                price = close;
            }
            return candles;
        },
        []
    );

    // ============================================================
    // INITIALIZATION
    // ============================================================
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/login?redirect=/quotex");
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setWallet(parsedUser.wallet || 0);
        setLoading(false);

        // Load shared game settings
        const savedSettings = localStorage.getItem("admin_game_settings");
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setGameSettings((prev) => ({ ...prev, ...parsed }));
            } catch (e) {}
        }

        // Load game status
        const savedStatus = localStorage.getItem("game_status");
        if (savedStatus) setGameStatus(savedStatus);

        // Initialize asset data
        const dataMap = new Map<string, AssetData>();
        ASSETS.forEach((asset) => {
            const historyMap = new Map<number, Candle[]>();
            TIMEFRAMES.forEach((tf) => {
                const candles = generateHistoricalCandles(asset, 200, tf.seconds);
                historyMap.set(tf.seconds, candles);
            });
            const last = historyMap.get(TIMEFRAMES[0].seconds)?.slice(-1)[0];
            dataMap.set(asset.id, {
                id: asset.id,
                current: last?.close || asset.basePrice,
                history: historyMap,
                direction: "SIDEWAYS",
                changePercent: 0,
                high: last?.high || asset.basePrice,
                low: last?.low || asset.basePrice,
            });
        });
        setAssetDataMap(dataMap);
        const initial = dataMap.get(selectedAsset.id);
        if (initial) setCurrentPrice(initial.current);

        // Fetch stats (for trading)
        if (token) {
            axios
                .get("http://localhost:5002/api/user/stats", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    const s = res.data;
                    if (s && typeof s.totalWins === "number" && typeof s.totalLosses === "number" && typeof s.totalTrades === "number") {
                        setTradingStats({
                            totalWins: s.totalWins,
                            totalLosses: s.totalLosses,
                            totalTrades: s.totalTrades,
                        });
                    } else {
                        setTradingStats({ totalWins: 0, totalLosses: 0, totalTrades: 0 });
                    }
                })
                .catch(() => setTradingStats({ totalWins: 0, totalLosses: 0, totalTrades: 0 }));
        }

        // Start chart updates
        chartIntervalRef.current = setInterval(updateAllPrices, 1000);
        tradeCheckIntervalRef.current = setInterval(checkExpiredTrades, 1000);

        return () => {
            if (chartIntervalRef.current) clearInterval(chartIntervalRef.current);
            if (tradeCheckIntervalRef.current) clearInterval(tradeCheckIntervalRef.current);
        };
    }, [router, generateHistoricalCandles, selectedAsset.id]);

    // ============================================================
    // PRICE UPDATE ENGINE (uses trading game settings)
    // ============================================================
    const updateAllPrices = useCallback(() => {
        const newMap = new Map(assetDataMap);
        let selectedUpdated = false;

        // Get trading settings from gameSettings
        const tradingSettings = gameSettings.trading as any;
        const adminVolatility = tradingSettings.volatility || 1.0;
        const adminTrend = tradingSettings.trend || 0;
        const adminManualPriceMode = tradingSettings.manualPriceMode || false;
        const adminPrice = tradingSettings.priceOverride || 0;
        const adminForceResult = tradingSettings.forcedResult || "NONE";

        // Update each asset
        ASSETS.forEach((asset) => {
            const data = newMap.get(asset.id);
            if (!data) return;

            // Admin manual price override (only for selected asset)
            if (adminManualPriceMode && selectedAsset.id === asset.id) {
                const newPrice = adminPrice || data.current;
                data.current = newPrice;
                newMap.set(asset.id, data);
                if (asset.id === selectedAsset.id) {
                    setCurrentPrice(newPrice);
                    selectedUpdated = true;
                }
                return;
            }

            const { current, history } = data;
            const tfSeconds = selectedTimeframe.seconds;
            const candles = history.get(tfSeconds);
            if (!candles || candles.length === 0) return;

            const lastCandle = candles[candles.length - 1];

            // Apply admin volatility multiplier
            const volatility = asset.volatility * adminVolatility;

            // Apply admin trend
            const trend = asset.trend + adminTrend;

            // Random walk with drift and mean reversion
            const drift = trend + (Math.random() - 0.5) * volatility * 0.3;
            const reversion = (asset.basePrice - current) * 0.001;
            let change = drift + reversion + (Math.random() - 0.5) * volatility * 0.5;

            // Apply admin force result (if set and there's an active trade)
            if (adminForceResult !== "NONE" && activeTrades.length > 0) {
                const controllingTrade = activeTrades[0];
                const targetDirection = adminForceResult === "WIN" ? (controllingTrade.direction === "CALL" ? 1 : -1) : controllingTrade.direction === "CALL" ? -1 : 1;
                const forceChange = targetDirection * volatility * 0.2;
                change = forceChange;
            }

            const newPrice = Math.max(0, current + change);

            // Update current
            data.current = newPrice;

            // Update candle (based on timeframe)
            const now = Date.now();
            const candleInterval = tfSeconds * 1000;
            const candleTime = Math.floor(now / candleInterval) * candleInterval;

            if (candles.length === 0 || candleTime > candles[candles.length - 1].time) {
                // New candle
                const newCandle: Candle = {
                    time: candleTime,
                    open: lastCandle.close,
                    high: lastCandle.close,
                    low: lastCandle.close,
                    close: newPrice,
                    volume: Math.random() * 50,
                };
                candles.push(newCandle);
                if (candles.length > 300) candles.shift();
            } else {
                // Update current candle
                const currentCandle = candles[candles.length - 1];
                currentCandle.close = newPrice;
                currentCandle.high = Math.max(currentCandle.high, newPrice);
                currentCandle.low = Math.min(currentCandle.low, newPrice);
                currentCandle.volume = (currentCandle.volume || 0) + Math.random() * 2;
            }

            // Update high/low
            data.high = Math.max(data.high, newPrice);
            data.low = Math.min(data.low, newPrice);

            // Determine direction
            const changePercent = ((newPrice - lastCandle.open) / lastCandle.open) * 100;
            data.changePercent = changePercent;
            data.direction = changePercent > 0.1 ? "UP" : changePercent < -0.1 ? "DOWN" : "SIDEWAYS";

            // Update history map
            data.history.set(tfSeconds, candles);
            newMap.set(asset.id, data);

            // Update selected asset price
            if (asset.id === selectedAsset.id) {
                setCurrentPrice(newPrice);
                selectedUpdated = true;
            }
        });

        if (!selectedUpdated) {
            const selectedData = newMap.get(selectedAsset.id);
            if (selectedData) setCurrentPrice(selectedData.current);
        }

        setAssetDataMap(newMap);

        // Update market sentiment
        let upCount = 0;
        newMap.forEach((data) => {
            if (data.direction === "UP") upCount++;
        });
        const total = newMap.size;
        const upRatio = upCount / total;
        setSentimentScore(upRatio);
        setMarketSentiment(upRatio > 0.6 ? "BULLISH" : upRatio < 0.4 ? "BEARISH" : "NEUTRAL");

        if (Math.random() < 0.05) sound.tick();
    }, [assetDataMap, selectedAsset, selectedTimeframe, activeTrades, gameSettings, sound]);

    // ============================================================
    // DRAW CHART
    // ============================================================
    const drawChart = useCallback(() => {
        const canvas = chartCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.parentElement?.getBoundingClientRect();
        const width = rect ? rect.width : canvas.clientWidth;
        const height = rect ? rect.height : canvas.clientHeight;
        canvas.width = width * (window.devicePixelRatio || 1);
        canvas.height = height * (window.devicePixelRatio || 1);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        const data = assetDataMap.get(selectedAsset.id);
        if (!data) return;

        const tfSeconds = selectedTimeframe.seconds;
        const candles = data.history.get(tfSeconds);
        if (!candles || candles.length === 0) return;

        const visibleCandles = candles.slice(-80);
        const maxPrice = Math.max(...visibleCandles.map((c) => c.high), data.current);
        const minPrice = Math.min(...visibleCandles.map((c) => c.low), data.current);
        const range = maxPrice - minPrice || 1;

        // Background
        const linear = ctx.createLinearGradient(0, 0, 0, height);
        linear.addColorStop(0, "#0a0a0a");
        linear.addColorStop(1, "#1a1a1a");
        ctx.fillStyle = linear;
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = "#2a2a2a";
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 5; i++) {
            const y = (i / 5) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            const price = maxPrice - (i / 5) * range;
            ctx.fillStyle = "#6b7280";
            ctx.font = "9px monospace";
            ctx.fillText(formatPrice(price), 2, y - 2);
        }

        const candleWidth = width / visibleCandles.length;

        // Draw candles
        visibleCandles.forEach((candle, index) => {
            const x = index * candleWidth;
            const centerX = x + candleWidth / 2;

            const openY = ((maxPrice - candle.open) / range) * height;
            const closeY = ((maxPrice - candle.close) / range) * height;
            const highY = ((maxPrice - candle.high) / range) * height;
            const lowY = ((maxPrice - candle.low) / range) * height;

            const isGreen = candle.close >= candle.open;
            const color = isGreen ? "#22c55e" : "#ef4444";

            // Wick
            ctx.beginPath();
            ctx.moveTo(centerX, highY);
            ctx.lineTo(centerX, lowY);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Body
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(closeY - openY));
            ctx.fillStyle = color;
            ctx.fillRect(centerX - candleWidth * 0.35, bodyTop, candleWidth * 0.7, bodyHeight);
        });

        // Entry/Expiry lines
        activeTrades.forEach((trade) => {
            if (trade.assetId !== selectedAsset.id) return;
            const entryY = ((maxPrice - trade.entryPrice) / range) * height;
            ctx.beginPath();
            ctx.moveTo(0, entryY);
            ctx.lineTo(width, entryY);
            ctx.strokeStyle = trade.direction === "CALL" ? "#22c55e" : "#ef4444";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px sans-serif";
            ctx.fillText(`Entry ${trade.direction}`, 10, entryY - 5);
            const remaining = (trade.expiryTime - Date.now()) / 1000;
            if (remaining < 5 && remaining > 0) {
                const expiryPrice = data.current;
                const expiryY = ((maxPrice - expiryPrice) / range) * height;
                ctx.beginPath();
                ctx.moveTo(0, expiryY);
                ctx.lineTo(width, expiryY);
                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "#fbbf24";
                ctx.fillText("Expiry", 10, expiryY - 5);
            }
        });

        // Current price line
        const currentY = ((maxPrice - data.current) / range) * height;
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(width, currentY);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(width - 15, currentY, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "10px monospace";
        ctx.fillText(formatPrice(data.current), width - 60, currentY - 5);

        // Volume bars
        const volumeHeight = height * 0.15;
        const volY = height - volumeHeight;
        const maxVolume = Math.max(...visibleCandles.map((c) => c.volume || 0), 1);
        visibleCandles.forEach((candle, index) => {
            const x = index * candleWidth;
            const vol = ((candle.volume || 0) / maxVolume) * volumeHeight;
            const isGreen = candle.close >= candle.open;
            ctx.fillStyle = isGreen ? "#22c55e40" : "#ef444440";
            ctx.fillRect(x + candleWidth * 0.1, volY + volumeHeight - vol, candleWidth * 0.8, vol);
        });
    }, [assetDataMap, selectedAsset, selectedTimeframe, activeTrades, formatPrice]);

    // ============================================================
    // TRADING LOGIC (uses game settings)
    // ============================================================
    const placeTrade = async (direction: "CALL" | "PUT") => {
        if (isPlacingBet) return;
        if (!token) {
            alert("Please login");
            router.push("/login?redirect=/quotex");
            return;
        }

        const tradingSettings = gameSettings.trading as any;
        const minBet = tradingSettings.minBet || 10;
        const maxBet = tradingSettings.maxBet || 10000;

        if (betAmount < minBet) {
            alert(`Minimum trade amount is ₹${minBet}`);
            return;
        }
        if (betAmount > wallet) {
            alert("Insufficient balance");
            return;
        }
        if (betAmount > maxBet) {
            alert(`Maximum trade amount is ₹${maxBet}`);
            return;
        }

        setIsPlacingBet(true);
        sound.tradeOpen();

        try {
            const response = await axios.post(
                "http://localhost:5002/api/bet/place",
                {
                    game: "quotex",
                    amount: betAmount,
                    selection: `${selectedAsset.id}:${direction}`,
                    betType: direction.toLowerCase(),
                    multiplier: 1 + selectedAsset.return / 100,
                    roundId: `trade_${Date.now()}`,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setWallet(response.data.wallet);
            const updatedUser = { ...user, wallet: response.data.wallet };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            const newTrade: ActiveTrade = {
                id: Date.now().toString(),
                assetId: selectedAsset.id,
                assetName: selectedAsset.name,
                amount: betAmount,
                direction,
                expirySeconds: selectedExpiry.seconds,
                entryPrice: currentPrice,
                expiryTime: Date.now() + selectedExpiry.seconds * 1000,
                betId: response.data.betId,
                returnPercent: selectedAsset.return,
            };

            setActiveTrades((prev) => [...prev, newTrade]);
            setCountdowns((prev) => new Map(prev).set(newTrade.id, selectedExpiry.seconds));
            setTradingStats((prev) => ({ ...prev, totalTrades: prev.totalTrades + 1 }));
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to place trade");
        } finally {
            setIsPlacingBet(false);
        }
    };

    // ============================================================
    // CHECK EXPIRED TRADES (uses admin win probability)
    // ============================================================
    const checkExpiredTrades = useCallback(() => {
        const now = Date.now();
        const expired = activeTrades.filter((t) => t.expiryTime <= now);
        if (expired.length === 0) return;

        const tradingSettings = gameSettings.trading as any;
        const adminWinProbability = tradingSettings.winProbability || 30;
        const adminForceResult = tradingSettings.forcedResult || "NONE";

        expired.forEach(async (trade) => {
            const assetData = assetDataMap.get(trade.assetId);
            if (!assetData) return;

            const exitPrice = assetData.current;
            const priceIncreased = exitPrice > trade.entryPrice;
            let isWin = trade.direction === "CALL" ? priceIncreased : !priceIncreased;

            if (adminForceResult !== "NONE") {
                isWin = adminForceResult === "WIN";
            } else {
                const rand = Math.random() * 100;
                if (rand < adminWinProbability) {
                    isWin = true;
                } else {
                    isWin = false;
                }
            }

            const payoutPercent = trade.returnPercent / 100;
            const profit = isWin ? trade.amount * payoutPercent : -trade.amount;

            try {
                if (token && trade.betId) {
                    await axios.post(
                        "http://localhost:5002/api/bet/cashout",
                        {
                            betId: trade.betId,
                            winAmount: isWin ? trade.amount * (1 + payoutPercent) : 0,
                            result: isWin ? "WIN" : "LOSS",
                            multiplier: 1 + payoutPercent,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    setWallet((prev) => prev + profit);
                    setTotalProfit((prev) => prev + profit);
                    setTradingStats((prev) => ({
                        ...prev,
                        totalWins: prev.totalWins + (isWin ? 1 : 0),
                        totalLosses: prev.totalLosses + (isWin ? 0 : 1),
                    }));
                    if (isWin) {
                        setWinStreak((prev) => prev + 1);
                        sound.tradeWin();
                    } else {
                        setWinStreak(0);
                        sound.tradeLose();
                    }
                    setHistoryRefresh((prev) => prev + 1);
                }
            } catch (error) {
                console.error("Settlement error:", error);
            }

            setCompletedTrades((prev) => [
                {
                    id: trade.id,
                    asset: trade.assetName,
                    amount: trade.amount,
                    direction: trade.direction,
                    result: isWin ? "WIN" : "LOSS",
                    profit,
                    time: new Date().toLocaleTimeString(),
                    entryPrice: trade.entryPrice,
                    exitPrice: exitPrice,
                },
                ...prev.slice(0, 49),
            ]);

            setCountdowns((prev) => {
                const newMap = new Map(prev);
                newMap.delete(trade.id);
                return newMap;
            });
        });

        setActiveTrades((prev) => prev.filter((t) => t.expiryTime > now));
    }, [activeTrades, assetDataMap, token, gameSettings, sound]);

    // ============================================================
    // ADMIN PANEL FUNCTIONS
    // ============================================================
    const showMessage = (text: string, type: "success" | "error") => {
        setMessage({ text, type, timestamp: Date.now() });
        setTimeout(() => setMessage(null), 4000);
    };

    const loadAdminData = async () => {
        setAdminLoading(true);
        try {
            const res = await fetch("http://localhost:5002/api/auth/users");
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
            setStats((prev) => ({
                ...prev,
                totalUsers: data.length || 0,
                activeUsers: data.filter((u: UserType) => !u.isBanned).length || 0,
                bannedUsers: data.filter((u: UserType) => u.isBanned).length || 0,
                totalWallet: data.reduce((sum: number, u: UserType) => sum + (u.wallet || 0), 0),
            }));
        } catch (error) {
            console.error("Failed to load users:", error);
        }
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5002/api/transaction/admin/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions || []);
                const deposits = data.transactions?.filter((t: TransactionType) => t.type === "deposit") || [];
                const withdrawals = data.transactions?.filter((t: TransactionType) => t.type === "withdraw") || [];
                setTransactionStats({
                    totalDeposits: deposits.reduce((sum: any, t: { amount: any }) => sum + t.amount, 0),
                    totalWithdrawals: withdrawals.reduce((sum: any, t: { amount: any }) => sum + t.amount, 0),
                    pendingDeposits: deposits.filter((t: { status: string }) => t.status === "pending").length,
                    pendingWithdrawals: withdrawals.filter((t: { status: string }) => t.status === "pending").length,
                    totalCompleted: data.transactions?.filter((t: TransactionType) => t.status === "completed").length || 0,
                    totalRejected: data.transactions?.filter((t: TransactionType) => t.status === "rejected").length || 0,
                });
            }
        } catch (error) {
            console.error("Failed to load transactions:", error);
        }
        setAdminLoading(false);
    };

    const handleApproveTransaction = async (transactionId: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5002/api/transaction/admin/approve/${transactionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ notes: adminNote }),
            });
            const data = await res.json();
            if (data.success) {
                showMessage("Transaction approved!", "success");
                loadAdminData();
                setShowTransactionModal(false);
                setAdminNote("");
            } else {
                showMessage(data.error || "Failed to approve", "error");
            }
        } catch (error) {
            showMessage("Failed to approve transaction", "error");
        }
    };

    const handleRejectTransaction = async (transactionId: string) => {
        if (!confirm("Are you sure you want to reject this transaction?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5002/api/transaction/admin/reject/${transactionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ notes: adminNote || "Rejected by admin" }),
            });
            const data = await res.json();
            if (data.success) {
                showMessage("Transaction rejected!", "success");
                loadAdminData();
                setShowTransactionModal(false);
                setAdminNote("");
            } else {
                showMessage(data.error || "Failed to reject", "error");
            }
        } catch (error) {
            showMessage("Failed to reject transaction", "error");
        }
    };

    const handleCompleteWithdrawal = async (transactionId: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5002/api/transaction/admin/complete-withdrawal/${transactionId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                showMessage("Withdrawal completed!", "success");
                loadAdminData();
                setShowTransactionModal(false);
            } else {
                showMessage(data.error || "Failed to complete", "error");
            }
        } catch (error) {
            showMessage("Failed to complete withdrawal", "error");
        }
    };

    const updateUserWallet = async (userId: string, amount: number, type: "add" | "remove") => {
        if (!amount || amount <= 0) {
            showMessage("Enter valid amount", "error");
            return;
        }
        const userObj = users.find((u) => u._id === userId);
        if (!userObj) return;
        const newWallet = type === "add" ? userObj.wallet + amount : userObj.wallet - amount;
        if (newWallet < 0) {
            showMessage("Wallet cannot be negative", "error");
            return;
        }
        try {
            await fetch(`http://localhost:5002/api/auth/wallet/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: newWallet }),
            });
            setUsers(users.map((u) => (u._id === userId ? { ...u, wallet: newWallet } : u)));
            setWalletAmount((prev) => ({ ...prev, [userId]: "" }));
            showMessage(`₹${amount.toLocaleString()} ${type === "add" ? "added" : "removed"}`, "success");
        } catch (error) {
            showMessage("Failed to update wallet", "error");
        }
    };

    const toggleBan = async (userId: string, currentStatus: boolean) => {
        try {
            await fetch(`http://localhost:5002/api/auth/ban/${userId}`, { method: "PUT" });
            setUsers(users.map((u) => (u._id === userId ? { ...u, isBanned: !currentStatus } : u)));
            showMessage(`User ${!currentStatus ? "banned" : "unbanned"}`, "success");
        } catch (error) {
            showMessage("Failed to update status", "error");
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("Delete this user?")) return;
        try {
            await fetch(`http://localhost:5002/api/auth/delete/${userId}`, { method: "DELETE" });
            setUsers(users.filter((u) => u._id !== userId));
            showMessage("User deleted", "success");
        } catch (error) {
            showMessage("Failed to delete user", "error");
        }
    };

    const updateGameSetting = (game: string, setting: string, value: any) => {
        setGameSettings((prev) => {
            const newSettings = {
                ...prev,
                [game]: {
                    ...prev[game as keyof typeof prev],
                    [setting]: value,
                },
            };
            localStorage.setItem("admin_game_settings", JSON.stringify(newSettings));
            return newSettings;
        });
        showMessage(`${game} ${setting} updated to ${value}`, "success");
    };

    const updatePlatformSetting = (setting: string, value: any) => {
        setPlatformSettings((prev) => ({ ...prev, [setting]: value }));
        showMessage(`${setting} updated`, "success");
    };

    const updateGameStatus = (status: string) => {
        setGameStatus(status);
        localStorage.setItem("game_status", status);
        showMessage(`Game status changed to ${status}`, "success");
    };

    const forceGameResult = (game: string, result: string) => {
        const forceData = { result, timestamp: Date.now(), game };
        localStorage.setItem(`forced_${game}_result`, JSON.stringify(forceData));
        updateGameSetting(game, "forcedResult", result);
        updateGameSetting(game, "lastForcedResult", {
            result: result,
            timestamp: new Date().toLocaleTimeString(),
        });
        // Also emit via socket if available
        const socket = (window as any).socket;
        if (socket) {
            socket.emit("force_result", { game, result });
        }
        showMessage(`✅ ${game} result forced to ${result}`, "success");
        setForceResultValue("");
    };

    const toggleAdmin = () => {
        if (adminSecret === "admin123") {
            setIsAdmin(true);
            setShowAdminPanel(true);
            setAdminSecret("");
            loadAdminData();
        } else {
            alert("Invalid secret. Use 'admin123'");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("admin");
        router.push("/admin-login");
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case "upi":
                return <CreditCard size={16} className="text-blue-400" />;
            case "bank":
                return <Banknote size={16} className="text-green-400" />;
            case "crypto":
                return <Coins size={16} className="text-yellow-400" />;
            default:
                return <Wallet size={16} className="text-zinc-400" />;
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case "upi":
                return "UPI";
            case "bank":
                return "Bank Transfer";
            case "crypto":
                return "Crypto";
            default:
                return "Wallet";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-green-400 bg-green-500/20 border-green-500/30";
            case "approved":
                return "text-blue-400 bg-blue-500/20 border-blue-500/30";
            case "pending":
                return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
            case "rejected":
                return "text-red-400 bg-red-500/20 border-red-500/30";
            case "failed":
                return "text-red-400 bg-red-500/20 border-red-500/30";
            default:
                return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle size={16} className="text-green-400" />;
            case "approved":
                return <CheckCircle size={16} className="text-blue-400" />;
            case "pending":
                return <Clock size={16} className="text-yellow-400" />;
            case "rejected":
                return <AlertCircle size={16} className="text-red-400" />;
            default:
                return <Clock size={16} className="text-zinc-400" />;
        }
    };

    const gamesList = [
        { id: "colorTrade", name: "Color Trade", icon: "🎨", color: "bg-pink-600" },
        { id: "mines", name: "Mines", icon: "💣", color: "bg-orange-600" },
        { id: "sky", name: "Sky Aviator", icon: "✈️", color: "bg-cyan-600" },
        { id: "spin", name: "Spin Wheel", icon: "🎡", color: "bg-indigo-600" },
        { id: "plinko", name: "Plinko", icon: "⚽", color: "bg-emerald-600" },
        { id: "lottery", name: "Lottery", icon: "🎟️", color: "bg-rose-600" },
        { id: "trading", name: "Trading", icon: "📈", color: "bg-blue-600" },
    ];

    // ============================================================
    // EFFECTS
    // ============================================================
    useEffect(() => {
        drawChart();
    }, [drawChart, assetDataMap, selectedAsset, selectedTimeframe, activeTrades]);

    useEffect(() => {
        const handleResize = () => drawChart();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [drawChart]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdowns((prev) => {
                const newMap = new Map();
                prev.forEach((val, key) => {
                    if (val > 0) newMap.set(key, val - 1);
                });
                return newMap;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // ============================================================
    // RENDER
    // ============================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-500/30 border-t-emerald-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">📊</div>
                </div>
            </div>
        );
    }

    const winRate = tradingStats.totalTrades > 0 ? (tradingStats.totalWins / tradingStats.totalTrades) * 100 : 0;
    const currentGameSettings = gameSettings[selectedGame as keyof typeof gameSettings] as any;

    return (
        <main className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* ============================================================
            HEADER
            ============================================================ */}
            <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80">
                <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-zinc-400 hover:text-white transition p-1.5 rounded-lg hover:bg-zinc-800/50"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <BarChart3 className="text-emerald-400" size={26} strokeWidth={2} />
                            <h1 className="text-xl md:text-2xl font-black bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                XGO TRADING
                            </h1>
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                                LIVE
                            </span>
                        </div>
                        {/* Admin toggle (double-click on shield) */}
                        <button
                            onDoubleClick={() => setShowAdminPanel(!showAdminPanel)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                        >
                            <Shield size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Market Sentiment */}
                        <div className="hidden md:flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/30">
                            <Radar size={14} className="text-blue-400" />
                            <span className="text-xs text-zinc-400">Sentiment</span>
                            <span
                                className={`text-xs font-bold ${marketSentiment === "BULLISH" ? "text-emerald-400" : marketSentiment === "BEARISH" ? "text-rose-400" : "text-yellow-400"
                                    }`}
                            >
                                {marketSentiment}
                            </span>
                        </div>

                        {/* Balance */}
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50"
                        >
                            {showBalance ? <Eye size={18} className="text-zinc-400" /> : <EyeOff size={18} className="text-zinc-400" />}
                        </button>
                        <button
                            onClick={() => {
                                sound.toggle();
                                setSoundEnabled(!soundEnabled);
                            }}
                            className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50"
                        >
                            {soundEnabled ? <Volume2 size={18} className="text-zinc-400" /> : <VolumeX size={18} className="text-zinc-400" />}
                        </button>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="p-2 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition border border-zinc-700/50"
                        >
                            <History size={18} className="text-zinc-400" />
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
            ADMIN PANEL MODAL (Full Admin Interface)
            ============================================================ */}
            {showAdminPanel && (
                <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900/95 border border-zinc-700 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="text-emerald-400" size={20} />
                                Admin Panel
                            </h2>
                            <button onClick={() => setShowAdminPanel(false)} className="p-2 hover:bg-zinc-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        {!isAdmin ? (
                            <div className="p-6 space-y-3">
                                <p className="text-sm text-zinc-400">Enter admin secret to unlock controls</p>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={adminSecret}
                                        onChange={(e) => setAdminSecret(e.target.value)}
                                        placeholder="Secret"
                                        className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 outline-none focus:border-emerald-500"
                                    />
                                    <button
                                        onClick={toggleAdmin}
                                        className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-emerald-400 transition"
                                    >
                                        Unlock
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4">
                                {/* Admin Tabs */}
                                <div className="flex gap-1 mb-4 overflow-x-auto border-b border-zinc-800 pb-2">
                                    {[
                                        { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
                                        { id: "users", label: "Users", icon: <Users size={18} /> },
                                        { id: "transactions", label: "Transactions", icon: <Wallet size={18} /> },
                                        { id: "games", label: "Games", icon: <Gamepad2 size={18} /> },
                                        { id: "settings", label: "Settings", icon: <Settings size={18} /> },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setAdminActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${adminActiveTab === tab.id ? "bg-green-500 text-black" : "text-zinc-400 hover:bg-zinc-800"
                                                }`}
                                        >
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleLogout}
                                        className="ml-auto bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                                    >
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>

                                {/* Admin Dashboard */}
                                {adminActiveTab === "dashboard" && (
                                    <div>
                                        <h3 className="text-2xl font-black mb-4">Dashboard</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700">
                                                <Users className="text-green-400 mb-2" size={24} />
                                                <p className="text-zinc-500 text-sm">Total Users</p>
                                                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                                                <div className="flex gap-4 mt-1 text-xs">
                                                    <span className="text-green-400">Active: {stats.activeUsers}</span>
                                                    <span className="text-red-400">Banned: {stats.bannedUsers}</span>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700">
                                                <Wallet className="text-yellow-400 mb-2" size={24} />
                                                <p className="text-zinc-500 text-sm">Total Wallet</p>
                                                <p className="text-2xl font-bold text-yellow-400">₹{stats.totalWallet.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700">
                                                <TrendingUp className="text-green-400 mb-2" size={24} />
                                                <p className="text-zinc-500 text-sm">Total Deposits</p>
                                                <p className="text-2xl font-bold text-green-400">₹{transactionStats.totalDeposits.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700">
                                                <TrendingDown className="text-red-400 mb-2" size={24} />
                                                <p className="text-zinc-500 text-sm">Total Withdrawals</p>
                                                <p className="text-2xl font-bold text-red-400">₹{transactionStats.totalWithdrawals.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Users */}
                                {adminActiveTab === "users" && (
                                    <div>
                                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                                            <h3 className="text-2xl font-black">User Management</h3>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 pr-4 py-2 bg-black border border-zinc-700 rounded-xl w-64 focus:border-emerald-500 outline-none text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-black rounded-xl overflow-hidden border border-zinc-800">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-zinc-800">
                                                        <tr className="text-left text-zinc-400">
                                                            <th className="px-4 py-3">Name</th>
                                                            <th className="px-4 py-3">UID</th>
                                                            <th className="px-4 py-3">Email</th>
                                                            <th className="px-4 py-3">Wallet</th>
                                                            <th className="px-4 py-3">Status</th>
                                                            <th className="px-4 py-3">Role</th>
                                                            <th className="px-4 py-3">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {users.slice(0, 50).map((user) => (
                                                            <tr key={user._id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                                                <td className="px-4 py-3 font-medium">{user.name}</td>
                                                                <td className="px-4 py-3 font-mono text-sm">{user.uid}</td>
                                                                <td className="px-4 py-3">{user.email}</td>
                                                                <td className="px-4 py-3 text-green-400 font-bold">₹{user.wallet.toLocaleString()}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isBanned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                                                                        }`}>
                                                                        {user.isBanned ? "Banned" : "Active"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                                                                        {user.role || "user"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Amount"
                                                                                value={walletAmount[user._id] || ""}
                                                                                onChange={(e) =>
                                                                                    setWalletAmount((prev) => ({ ...prev, [user._id]: e.target.value }))
                                                                                }
                                                                                className="w-16 bg-black border border-zinc-700 rounded-lg px-2 py-1 text-sm"
                                                                            />
                                                                            <button
                                                                                onClick={() =>
                                                                                    updateUserWallet(user._id, Number(walletAmount[user._id]), "add")
                                                                                }
                                                                                className="p-1.5 bg-green-600 rounded-lg hover:bg-green-700"
                                                                            >
                                                                                <Plus size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    updateUserWallet(user._id, Number(walletAmount[user._id]), "remove")
                                                                                }
                                                                                className="p-1.5 bg-red-600 rounded-lg hover:bg-red-700"
                                                                            >
                                                                                <Minus size={14} />
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => toggleBan(user._id, user.isBanned)}
                                                                            className="p-1.5 bg-yellow-600 rounded-lg hover:bg-yellow-700"
                                                                        >
                                                                            <Ban size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteUser(user._id)}
                                                                            className="p-1.5 bg-red-600 rounded-lg hover:bg-red-700"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Transactions */}
                                {adminActiveTab === "transactions" && (
                                    <div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                            <h3 className="text-2xl font-black">Transactions</h3>
                                            <div className="flex flex-wrap gap-3">
                                                <select
                                                    value={transactionFilter}
                                                    onChange={(e) => setTransactionFilter(e.target.value as any)}
                                                    className="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                                                >
                                                    <option value="all">All Types</option>
                                                    <option value="deposit">Deposits</option>
                                                    <option value="withdraw">Withdrawals</option>
                                                </select>
                                                <select
                                                    value={transactionStatus}
                                                    onChange={(e) => setTransactionStatus(e.target.value as any)}
                                                    className="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                                                >
                                                    <option value="all">All Status</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                                <button
                                                    onClick={loadAdminData}
                                                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"
                                                >
                                                    <RefreshCw size={14} /> Refresh
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-black rounded-xl overflow-hidden border border-zinc-800">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-zinc-800">
                                                        <tr className="text-left text-zinc-400">
                                                            <th className="px-4 py-3">User</th>
                                                            <th className="px-4 py-3">Type</th>
                                                            <th className="px-4 py-3">Method</th>
                                                            <th className="px-4 py-3">Amount</th>
                                                            <th className="px-4 py-3">Status</th>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {transactions.slice(0, 50).map((tx) => (
                                                            <tr key={tx._id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                                                <td className="px-4 py-3">
                                                                    <div>
                                                                        <p className="font-medium">{tx.userName}</p>
                                                                        <p className="text-xs text-zinc-500">{tx.userUid}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.type === "deposit" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                                        }`}>
                                                                        {tx.type === "deposit" ? "Deposit" : "Withdraw"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        {getMethodIcon(tx.method)}
                                                                        <span className="text-sm">{getMethodLabel(tx.method)}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 font-bold">
                                                                    <span className={tx.type === "deposit" ? "text-green-400" : "text-red-400"}>
                                                                        {tx.type === "deposit" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(tx.status)}`}>
                                                                        {getStatusIcon(tx.status)}
                                                                        {tx.status.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-zinc-500">
                                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {tx.status === "pending" && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedTransaction(tx);
                                                                                setAdminNote("");
                                                                                setShowTransactionModal(true);
                                                                            }}
                                                                            className="bg-green-500 hover:bg-green-600 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                                                        >
                                                                            Process
                                                                        </button>
                                                                    )}
                                                                    {tx.status === "approved" && tx.type === "withdraw" && (
                                                                        <button
                                                                            onClick={() => handleCompleteWithdrawal(tx._id)}
                                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                                                        >
                                                                            Complete
                                                                        </button>
                                                                    )}
                                                                    {tx.status === "pending" && (
                                                                        <button
                                                                            onClick={() => handleRejectTransaction(tx._id)}
                                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition ml-1"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Games */}
                                {adminActiveTab === "games" && (
                                    <div>
                                        <h3 className="text-2xl font-black mb-4">Game Control</h3>
                                        <div className="flex gap-3 mb-4 flex-wrap">
                                            <button
                                                onClick={() => updateGameStatus("RUNNING")}
                                                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                                            >
                                                <Play size={14} /> Start All
                                            </button>
                                            <button
                                                onClick={() => updateGameStatus("PAUSED")}
                                                className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                                            >
                                                <Pause size={14} /> Pause All
                                            </button>
                                            <button
                                                onClick={() => updateGameStatus("STOPPED")}
                                                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                                            >
                                                <StopCircle size={14} /> Stop All
                                            </button>
                                        </div>
                                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                            {gamesList.map((game) => (
                                                <button
                                                    key={game.id}
                                                    onClick={() => setSelectedGame(game.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${selectedGame === game.id ? "bg-green-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
                                                        }`}
                                                >
                                                    <span className="text-xl">{game.icon}</span>
                                                    {game.name}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Trading Game Control */}
                                        {selectedGame === "trading" && (
                                            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700 space-y-6">
                                                <h4 className="text-xl font-bold flex items-center gap-2">
                                                    <CandlestickChart className="text-blue-400" /> Trading Control
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Min Bet</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xl font-bold">₹{currentGameSettings?.minBet || 10}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter min bet:", currentGameSettings?.minBet?.toString() || "10");
                                                                    if (val) updateGameSetting("trading", "minBet", Number(val));
                                                                }}
                                                                className="p-1 hover:bg-zinc-700 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Max Bet</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xl font-bold">₹{currentGameSettings?.maxBet || 10000}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter max bet:", currentGameSettings?.maxBet?.toString() || "10000");
                                                                    if (val) updateGameSetting("trading", "maxBet", Number(val));
                                                                }}
                                                                className="p-1 hover:bg-zinc-700 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Win Probability</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xl font-bold">{currentGameSettings?.winProbability || 30}%</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter win probability (0-100):", currentGameSettings?.winProbability?.toString() || "30");
                                                                    if (val) {
                                                                        const prob = Number(val);
                                                                        updateGameSetting("trading", "winProbability", prob);
                                                                        updateGameSetting("trading", "lossProbability", 100 - prob);
                                                                    }
                                                                }}
                                                                className="p-1 hover:bg-zinc-700 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Volatility Multiplier</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xl font-bold">{currentGameSettings?.volatility || 1.0}x</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter volatility (0.1-3.0):", currentGameSettings?.volatility?.toString() || "1.0");
                                                                    if (val) updateGameSetting("trading", "volatility", Number(val));
                                                                }}
                                                                className="p-1 hover:bg-zinc-700 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Trend Adjustment</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xl font-bold">{currentGameSettings?.trend || 0}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter trend (-0.01 to 0.01):", currentGameSettings?.trend?.toString() || "0");
                                                                    if (val) updateGameSetting("trading", "trend", Number(val));
                                                                }}
                                                                className="p-1 hover:bg-zinc-700 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Manual Price Mode</label>
                                                        <button
                                                            onClick={() => {
                                                                const current = currentGameSettings?.manualPriceMode || false;
                                                                updateGameSetting("trading", "manualPriceMode", !current);
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-sm font-bold ${currentGameSettings?.manualPriceMode ? "bg-green-500 text-black" : "bg-red-500 text-white"
                                                                }`}
                                                        >
                                                            {currentGameSettings?.manualPriceMode ? "ON" : "OFF"}
                                                        </button>
                                                    </div>
                                                    {currentGameSettings?.manualPriceMode && (
                                                        <div>
                                                            <label className="text-zinc-500 text-sm">Price Override</label>
                                                            <div className="flex justify-between items-center mt-1">
                                                                <span className="text-xl font-bold">{currentGameSettings?.priceOverride || 0}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const val = prompt("Enter price override:", currentGameSettings?.priceOverride?.toString() || "0");
                                                                        if (val) updateGameSetting("trading", "priceOverride", Number(val));
                                                                    }}
                                                                    className="p-1 hover:bg-zinc-700 rounded"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Last Forced Result</label>
                                                        <div className="mt-1 p-2 bg-black rounded-lg text-center">
                                                            <span className="text-yellow-400">{currentGameSettings?.lastForcedResult?.result || "None"}</span>
                                                            {currentGameSettings?.lastForcedResult?.timestamp && (
                                                                <span className="text-xs text-zinc-500 block">
                                                                    {currentGameSettings.lastForcedResult.timestamp}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
                                                    <h5 className="font-bold mb-4 flex items-center gap-2 text-lg">
                                                        <Target className="text-blue-400" /> Force Chart Direction
                                                    </h5>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            onClick={() => forceGameResult("trading", "WIN")}
                                                            className="bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                                                        >
                                                            <TrendingUp size={18} /> FORCE WIN
                                                        </button>
                                                        <button
                                                            onClick={() => forceGameResult("trading", "LOSS")}
                                                            className="bg-red-600 hover:bg-red-500 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                                                        >
                                                            <TrendingDown size={18} /> FORCE LOSS
                                                        </button>
                                                        <button
                                                            onClick={() => forceGameResult("trading", "NONE")}
                                                            className="bg-zinc-600 hover:bg-zinc-500 py-3 rounded-lg font-bold transition"
                                                        >
                                                            CLEAR FORCE
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2 mt-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Custom (WIN/LOSS)"
                                                            value={forceResultValue}
                                                            onChange={(e) => setForceResultValue(e.target.value)}
                                                            className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                if (forceResultValue) {
                                                                    forceGameResult("trading", forceResultValue.toUpperCase());
                                                                }
                                                            }}
                                                            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2"
                                                        >
                                                            <Send size={14} /> Force
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Other games controls (simplified for space) */}
                                        {selectedGame !== "trading" && (
                                            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700">
                                                <h4 className="text-xl font-bold mb-4">{gamesList.find(g => g.id === selectedGame)?.name} Control</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Min Bet</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xl font-bold">₹{currentGameSettings?.minBet || 10}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter min bet:", currentGameSettings?.minBet?.toString() || "10");
                                                                    if (val) updateGameSetting(selectedGame, "minBet", Number(val));
                                                                }}
                                                                className="p-1 hover:bg-zinc-700 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Max Bet</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xl font-bold">₹{currentGameSettings?.maxBet || 10000}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter max bet:", currentGameSettings?.maxBet?.toString() || "10000");
                                                                    if (val) updateGameSetting(selectedGame, "maxBet", Number(val));
                                                                }}
                                                                className="p-1 hover:bg-zinc-700 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-sm">Status</label>
                                                        <button
                                                            onClick={() => {
                                                                const current = currentGameSettings?.enabled ?? true;
                                                                updateGameSetting(selectedGame, "enabled", !current);
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-sm font-bold ${currentGameSettings?.enabled ? "bg-green-500 text-black" : "bg-red-500 text-white"
                                                                }`}
                                                        >
                                                            {currentGameSettings?.enabled ? "Enabled" : "Disabled"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-4 bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
                                                    <h5 className="font-bold mb-2 flex items-center gap-2">
                                                        <Target className="text-purple-400" /> Force Result
                                                    </h5>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Result value"
                                                            value={forceResultValue}
                                                            onChange={(e) => setForceResultValue(e.target.value)}
                                                            className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:border-purple-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                if (forceResultValue) {
                                                                    forceGameResult(selectedGame, forceResultValue);
                                                                }
                                                            }}
                                                            className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2"
                                                        >
                                                            <Send size={14} /> Force
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Admin Settings */}
                                {adminActiveTab === "settings" && (
                                    <div>
                                        <h3 className="text-2xl font-black mb-4">Platform Settings</h3>
                                        <div className="bg-black rounded-xl p-6 border border-zinc-800">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {Object.entries(platformSettings).map(([key, value]) => (
                                                    <div key={key}>
                                                        <label className="text-zinc-500 text-sm capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-lg font-bold">
                                                                {typeof value === "boolean"
                                                                    ? value
                                                                        ? "ON"
                                                                        : "OFF"
                                                                    : typeof value === "number"
                                                                        ? key.includes("Deposit") || key.includes("Withdraw")
                                                                            ? `₹${value}`
                                                                            : `${value}%`
                                                                        : value}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt(`Enter new value for ${key}:`, String(value));
                                                                    if (val) {
                                                                        if (typeof value === "boolean") updatePlatformSetting(key, val.toLowerCase() === "true");
                                                                        else if (typeof value === "number") updatePlatformSetting(key, Number(val));
                                                                        else updatePlatformSetting(key, val);
                                                                    }
                                                                }}
                                                                className="p-1 hover:bg-zinc-800 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
            TRANSACTION MODAL (inside admin)
            ============================================================ */}
            {showTransactionModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-101 p-4">
                    <div className="bg-zinc-900 rounded-2xl p-6 max-w-lg w-full border border-zinc-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-green-400">Process Transaction</h3>
                            <button onClick={() => setShowTransactionModal(false)} className="text-zinc-400 hover:text-white">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-black rounded-xl p-4">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">User</span>
                                    <span className="font-bold">{selectedTransaction.userName}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-zinc-500">Type</span>
                                    <span className={`font-bold ${selectedTransaction.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                                        {selectedTransaction.type === "deposit" ? "Deposit" : "Withdraw"}
                                    </span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-zinc-500">Amount</span>
                                    <span className="font-bold text-yellow-400">₹{selectedTransaction.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-zinc-500">Method</span>
                                    <span className="font-bold">{getMethodLabel(selectedTransaction.method)}</span>
                                </div>
                                {selectedTransaction.details?.upiId && (
                                    <div className="flex justify-between mt-2">
                                        <span className="text-zinc-500">UPI ID</span>
                                        <span className="font-bold">{selectedTransaction.details.upiId}</span>
                                    </div>
                                )}
                                {selectedTransaction.details?.bankAccount && (
                                    <div className="mt-2">
                                        <p className="text-zinc-500 text-sm">Bank Details</p>
                                        <p className="text-sm">Account: {selectedTransaction.details.bankAccount}</p>
                                        <p className="text-sm">Bank: {selectedTransaction.details.bankName}</p>
                                        <p className="text-sm">IFSC: {selectedTransaction.details.ifscCode}</p>
                                    </div>
                                )}
                                {selectedTransaction.details?.cryptoAddress && (
                                    <div className="flex justify-between mt-2">
                                        <span className="text-zinc-500">Crypto Address</span>
                                        <span className="font-bold text-xs break-all">{selectedTransaction.details.cryptoAddress}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm block mb-2">Admin Notes</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add notes about this transaction..."
                                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none resize-none h-20"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleApproveTransaction(selectedTransaction._id)}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl transition"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleRejectTransaction(selectedTransaction._id)}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
                                >
                                    Reject
                                </button>
                            </div>
                            {selectedTransaction.type === "withdraw" && selectedTransaction.status === "approved" && (
                                <button
                                    onClick={() => handleCompleteWithdrawal(selectedTransaction._id)}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition"
                                >
                                    Complete Withdrawal
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
            MAIN TRADING INTERFACE
            ============================================================ */}
            <div className="max-w-full mx-auto p-4">
                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                    <StatCard
                        icon={<TrendingUp size={16} className={totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"} />}
                        label="Total P/L"
                        value={`${totalProfit >= 0 ? "+" : ""}₹${formatNumber(totalProfit)}`}
                        valueColor={totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
                    />
                    <StatCard icon={<Flame size={16} className="text-orange-400" />} label="Win Streak" value={winStreak} valueColor="text-orange-400" />
                    <StatCard icon={<Percent size={16} className="text-blue-400" />} label="Win Rate" value={`${winRate.toFixed(1)}%`} valueColor="text-blue-400" />
                    <StatCard
                        icon={<Award size={16} className="text-purple-400" />}
                        label="Wins/Losses"
                        value={`${tradingStats.totalWins}/${tradingStats.totalLosses}`}
                        valueColor="text-purple-400"
                    />
                    <StatCard icon={<Zap size={16} className="text-yellow-400" />} label="Active Trades" value={activeTrades.length} valueColor="text-yellow-400" />
                    <StatCard icon={<Activity size={16} className="text-cyan-400" />} label="Total Trades" value={tradingStats.totalTrades} valueColor="text-cyan-400" />
                </div>

                {/* Chart + Trading Panel */}
                <div className="grid lg:grid-cols-12 gap-4">
                    {/* Asset List */}
                    <div className="lg:col-span-2 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-3 backdrop-blur-sm">
                        <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-3">Assets</h3>
                        <div className="space-y-1 max-h-150 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                            {ASSETS.map((asset) => {
                                const data = assetDataMap.get(asset.id);
                                const isSelected = selectedAsset.id === asset.id;
                                const direction = data?.direction || "SIDEWAYS";
                                const change = data?.changePercent || 0;
                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => {
                                            setSelectedAsset(asset);
                                            const newData = assetDataMap.get(asset.id);
                                            if (newData) setCurrentPrice(newData.current);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center gap-3 ${isSelected ? "bg-emerald-500/10 border border-emerald-500/30" : "hover:bg-zinc-800/50"
                                            }`}
                                    >
                                        <span className="text-xl">{asset.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{asset.name}</p>
                                            <p className="text-xs text-zinc-400 font-mono">{formatPrice(data?.current || asset.basePrice)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={`text-xs font-bold ${direction === "UP" ? "text-emerald-400" : direction === "DOWN" ? "text-rose-400" : "text-zinc-400"
                                                    }`}
                                            >
                                                {direction === "UP" ? "📈" : direction === "DOWN" ? "📉" : "➡️"}
                                                {change !== 0 && ` ${change > 0 ? "+" : ""}${change.toFixed(2)}%`}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="lg:col-span-7">
                        <div
                            className={`bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4 backdrop-blur-sm ${isFullscreenChart ? "fixed inset-4 z-50 rounded-2xl" : ""
                                }`}
                        >
                            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        {selectedAsset.icon} {selectedAsset.name}
                                        <span className="text-sm font-mono text-zinc-400">{selectedAsset.symbol}</span>
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black">{formatPrice(currentPrice)}</span>
                                        {assetDataMap.get(selectedAsset.id) && (
                                            <span
                                                className={`text-sm font-bold ${assetDataMap.get(selectedAsset.id)!.direction === "UP" ? "text-emerald-400" :
                                                    assetDataMap.get(selectedAsset.id)!.direction === "DOWN" ? "text-rose-400" :
                                                    "text-zinc-400"
                                                    }`}
                                            >
                                                {assetDataMap.get(selectedAsset.id)!.direction === "UP" ? "▲" :
                                                    assetDataMap.get(selectedAsset.id)!.direction === "DOWN" ? "▼" : "—"}
                                                {assetDataMap.get(selectedAsset.id)!.changePercent > 0 ? "+" : ""}
                                                {assetDataMap.get(selectedAsset.id)!.changePercent.toFixed(2)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
                                        {TIMEFRAMES.map((tf) => (
                                            <button
                                                key={tf.seconds}
                                                onClick={() => setSelectedTimeframe(tf)}
                                                className={`px-2 py-0.5 rounded text-xs font-bold transition ${selectedTimeframe.seconds === tf.seconds ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white"
                                                    }`}
                                            >
                                                {tf.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setIsFullscreenChart(!isFullscreenChart)}
                                        className="p-2 rounded-lg hover:bg-zinc-800 transition"
                                    >
                                        {isFullscreenChart ? <Minimize2 size={18} className="text-zinc-400" /> : <Maximize2 size={18} className="text-zinc-400" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const data = assetDataMap.get(selectedAsset.id);
                                            if (data) {
                                                const asset = ASSETS.find((a) => a.id === selectedAsset.id);
                                                if (asset) {
                                                    TIMEFRAMES.forEach((tf) => {
                                                        const newCandles = generateHistoricalCandles(asset, 200, tf.seconds);
                                                        data.history.set(tf.seconds, newCandles);
                                                    });
                                                    data.current = data.history.get(selectedTimeframe.seconds)?.slice(-1)[0]?.close || asset.basePrice;
                                                    setAssetDataMap(new Map(assetDataMap));
                                                    setCurrentPrice(data.current);
                                                }
                                            }
                                        }}
                                        className="p-2 rounded-lg hover:bg-zinc-800 transition"
                                    >
                                        <RefreshCw size={18} className="text-zinc-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="relative w-full h-80 md:h-96 bg-black rounded-xl overflow-hidden">
                                <canvas ref={chartCanvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
                                {isFullscreenChart && (
                                    <button
                                        onClick={() => setIsFullscreenChart(false)}
                                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition"
                                    >
                                        <X size={20} className="text-white" />
                                    </button>
                                )}
                            </div>
                            <div className="flex justify-center gap-4 mt-3 text-xs text-zinc-500">
                                <span>🟢 Bullish</span>
                                <span>🔴 Bearish</span>
                                <span className="text-yellow-400">— Current Price</span>
                                <span className="text-green-400">— Entry (CALL)</span>
                                <span className="text-red-400">— Entry (PUT)</span>
                            </div>
                        </div>
                    </div>

                    {/* Trading Panel */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4 backdrop-blur-sm">
                            <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-3">Trade Amount</h3>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    min={gameSettings.trading.minBet || 10}
                                    max={Math.min(gameSettings.trading.maxBet || 10000, wallet)}
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-zinc-700/50 rounded-xl px-8 py-3 text-xl font-bold text-center focus:border-emerald-500 outline-none transition"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setBetAmount(amount)}
                                        className="bg-zinc-800/50 hover:bg-zinc-700/50 py-1.5 rounded-lg text-sm font-bold transition border border-zinc-700/30"
                                    >
                                        ₹{amount.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between mt-3 text-xs text-zinc-500">
                                <span>Min: ₹{gameSettings.trading.minBet || 10}</span>
                                <span>Max: ₹{Math.min(gameSettings.trading.maxBet || 10000, wallet).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4 backdrop-blur-sm">
                            <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-3 flex items-center gap-2">
                                <Clock size={14} /> Expiry
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {EXPIRY_TIMES.map((exp) => (
                                    <button
                                        key={exp.seconds}
                                        onClick={() => setSelectedExpiry(exp)}
                                        className={`py-2 rounded-lg text-sm font-bold transition ${selectedExpiry.seconds === exp.seconds ? `${exp.color} text-white` : "bg-zinc-800/50 hover:bg-zinc-700/50"
                                            }`}
                                    >
                                        {exp.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-700/30">
                            <p className="text-xs text-zinc-400">Return on Win</p>
                            <p className="text-3xl font-bold text-emerald-400">{selectedAsset.return}%</p>
                            <p className="text-xs text-zinc-500">Win ₹{(betAmount * selectedAsset.return / 100).toLocaleString()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => placeTrade("CALL")}
                                disabled={isPlacingBet || betAmount > wallet}
                                className="bg-linear-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed py-5 rounded-xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                                <TrendingUp size={24} className="mx-auto mb-1" />
                                CALL
                                <span className="block text-xs font-normal">Price goes UP</span>
                            </button>
                            <button
                                onClick={() => placeTrade("PUT")}
                                disabled={isPlacingBet || betAmount > wallet}
                                className="bg-linear-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed py-5 rounded-xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20"
                            >
                                <TrendingDown size={24} className="mx-auto mb-1" />
                                PUT
                                <span className="block text-xs font-normal">Price goes DOWN</span>
                            </button>
                        </div>

                        {betAmount >= (gameSettings.trading.minBet || 10) && (
                            <div className="bg-linear-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                                <p className="text-xs text-zinc-400">Potential Payout</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    ₹{(betAmount + (betAmount * selectedAsset.return / 100)).toLocaleString()}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    +{selectedAsset.return}% profit (₹{(betAmount * selectedAsset.return / 100).toLocaleString()})
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Trades */}
                {activeTrades.length > 0 && (
                    <div className="mt-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4 backdrop-blur-sm">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-zinc-200">
                            <Zap className="text-yellow-400" size={16} />
                            Active Trades ({activeTrades.length})
                        </h3>
                        <div className="space-y-2">
                            {activeTrades.map((trade) => {
                                const timeLeft = countdowns.get(trade.id) || 0;
                                const progress = (timeLeft / trade.expirySeconds) * 100;
                                const assetData = assetDataMap.get(trade.assetId);
                                const currentPrice = assetData?.current || 0;
                                const isInProfit = trade.direction === "CALL" ? currentPrice > trade.entryPrice : currentPrice < trade.entryPrice;
                                return (
                                    <div key={trade.id} className="bg-black/50 rounded-xl p-4 border border-zinc-800/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <span className="font-bold">{trade.assetName}</span>
                                                <span className={`ml-2 text-sm font-bold ${trade.direction === "CALL" ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {trade.direction} ₹{trade.amount.toLocaleString()}
                                                </span>
                                                <span className={`ml-3 text-xs font-bold ${isInProfit ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {isInProfit ? "▲" : "▼"}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-yellow-400 font-mono text-sm">{formatTime(timeLeft)}</span>
                                                <span className="text-xs text-emerald-400 ml-2">+{trade.returnPercent}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${trade.direction === "CALL" ? "bg-emerald-500" : "bg-rose-500"}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                            <span>Entry: {formatPrice(trade.entryPrice)}</span>
                                            <span>Current: {formatPrice(currentPrice)}</span>
                                            <span>P/L: {isInProfit ? "+" : ""}{((currentPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2)}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Recent Trades */}
                {completedTrades.length > 0 && (
                    <div className="mt-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4 backdrop-blur-sm">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-zinc-200">
                            <History size={16} className="text-blue-400" />
                            Recent Trades
                        </h3>
                        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                            {completedTrades.slice(0, 20).map((trade, i) => (
                                <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-zinc-800/30">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{trade.asset}</span>
                                        <span className={`text-xs font-bold ${trade.direction === "CALL" ? "text-emerald-400" : "text-rose-400"}`}>
                                            {trade.direction}
                                        </span>
                                    </div>
                                    <div className="text-zinc-300">₹{trade.amount.toLocaleString()}</div>
                                    <div className={trade.result === "WIN" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                        {trade.result === "WIN" ? `+₹${trade.profit.toLocaleString()}` : `-₹${Math.abs(trade.profit).toLocaleString()}`}
                                    </div>
                                    <div className="text-xs text-zinc-500">{trade.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bet History Modal */}
                {showHistory && (
                    <div className="mt-6 animate-fade-in-up">
                        <BetHistory game="quotex" refreshTrigger={historyRefresh} />
                    </div>
                )}
            </div>

            {/* ============================================================
            STYLES
            ============================================================ */}
            <style jsx>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
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
}

function StatCard({ icon, label, value, valueColor = "text-white" }: StatCardProps) {
    return (
        <div className="bg-zinc-900/50 rounded-2xl p-3 border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                {icon}
                <span className="text-[10px] uppercase tracking-wider">{label}</span>
            </div>
            <div className={`font-bold text-lg ${valueColor}`}>{value}</div>
        </div>
    );
}