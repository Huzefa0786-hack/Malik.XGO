"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import BetHistory from "../components/BetHistory";
import { 
  ArrowLeft, Wallet, Trophy, History, Users, Zap, 
  Award, Crown, TrendingUp, Clock, Volume2, VolumeX, 
  Eye, EyeOff, Rocket, Flame, Target, BarChart3,
  Settings, Play, Pause, StopCircle, AlertCircle,
  ChevronUp, ChevronDown, Maximize2, Minimize2,
  Activity, Gauge, Plane, Cloud, Star, Sparkles,
  Shield, Zap as Lightning, TrendingUp as TrendUp,
  Download, RefreshCw, Menu, X
} from "lucide-react";

// ============================================
// TYPES & INTERFACES
// ============================================
interface UserType {
  _id: string;
  name: string;
  email: string;
  uid: string;
  wallet: number;
  role: string;
}

interface BetHistoryType {
  id: string;
  multiplier: number;
  amount: number;
  result: "WIN" | "LOSS";
  time: string;
  profit: number;
}

interface RecentWinType {
  user: string;
  amount: number;
  multiplier: number;
  time: string;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AviatorGame() {
  const router = useRouter();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  // User & Wallet
  const [user, setUser] = useState<UserType | null>(null);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Game State
  const [gameStatus, setGameStatus] = useState<"waiting" | "flying" | "crashed">("waiting");
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [nextCrashPoint, setNextCrashPoint] = useState(1.5);
  const [roundTimer, setRoundTimer] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number | null>(null);
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>([]);
  const [crashHistory, setCrashHistory] = useState<number[]>([]);
  
  // Bet Controls
  const [betAmount, setBetAmount] = useState("");
  const [autoCashout, setAutoCashout] = useState<number | null>(null);
  const [quickAmounts] = useState([100, 500, 1000, 2000, 5000, 10000]);
 const [autoCashoutOptions] = useState([1.5, 2, 3, 5, 8, 10, 15, 20, 30, 50]);
  // Stats & History
  const [winStreak, setWinStreak] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [betHistory, setBetHistory] = useState<BetHistoryType[]>([]);
  const [recentWins, setRecentWins] = useState<RecentWinType[]>([]);
  const [totalBets, setTotalBets] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  
  // UI State
  const [showHistory, setShowHistory] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveUsers, setLiveUsers] = useState(2847);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
  
  // Admin Controls
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminControls, setAdminControls] = useState({
    forceCrash: false,
    crashMultiplier: 5,
    roundDuration: 5,
    minBet: 10,
    maxBet: 10000,
    houseEdge: 5
  });
  
  // Animation Refs
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const planeX = useRef(0);
  const planeY = useRef(0);
  const chartDataRef = useRef<{ x: number; y: number }[]>([]);

  // ============================================
  // INITIALIZATION
  // ============================================
  // Add this useEffect to each game page
useEffect(() => {
  const checkForcedResult = () => {
    const gameName = "colorTrade"; // Change for each game
    const forced = localStorage.getItem(`forced_${gameName}_result`);
    const timestamp = localStorage.getItem("forced_result_timestamp");
    
    if (forced && timestamp && (Date.now() - parseInt(timestamp) < 5000)) {
      // Apply forced result
      setResult(forced);
      // Handle the result based on game type
      localStorage.removeItem(`forced_${gameName}_result`);
    }
  };
  
  checkForcedResult();
  const interval = setInterval(checkForcedResult, 1000);
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/aviator");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setWallet(parsedUser.wallet || 0);
      
      // Check if user is admin
      if (parsedUser.role === "admin") {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Failed to parse user:", error);
      router.push("/login");
      return;
    }

    setLoading(false);
    fetchWallet();
    fetchStats();
    startGameRound();
    
    const userInterval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);
    
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
      clearInterval(userInterval);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [router]);

  // ============================================
  // API FUNCTIONS
  // ============================================
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

  const fetchStats = async () => {
    try {
      const res = await api.get("/bet/history?game=aviator");
      if (res.data.success) {
        const stats = res.data.stats;
        setTotalProfit((stats?.totalWonAmount || 0) - (stats?.totalBetAmount || 0));
        setTotalBets(stats?.totalBets || 0);
        setTotalWins(stats?.totalWins || 0);
        setTotalLosses(stats?.totalLosses || 0);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // ============================================
  // GAME LOGIC
  // ============================================
  const startGameRound = useCallback(() => {
  setGameStatus("waiting");
  setIsPlaying(false);
  setIsCrashed(false);
  setHasCashedOut(false);
  setCurrentMultiplier(1);
  setCurrentBetId(null);
  setChartData([]);
  chartDataRef.current = [];
  
  // Generate random crash point from 1x to 50x
  const random = Math.random();
  let crashPoint: number;
  
  // Weighted distribution for more varied gameplay
  if (random < 0.10) {
    // 10% chance: 1x - 2.4x (Very Low - almost instant crash)
    crashPoint = 1 + Math.random() * 1.4;
  } else if (random < 0.25) {
    // 20% chance: 2x - 5x (Low risk)
    crashPoint = 2 + Math.random() * 3;
  } else if (random < 0.45) {
    // 35% chance: 5x - 10x (Medium-low)
    crashPoint = 5 + Math.random() * 5;
  } else if (random < 0.65) {
    // 20% chance: 10x - 20x (Medium)
    crashPoint = 10 + Math.random() * 10;
  } else if (random < 0.82) {
    // 17% chance: 20x - 35x (High)
    crashPoint = 20 + Math.random() * 15;
  } else if (random < 0.94) {
    // 12% chance: 35x - 50x (Very High)
    crashPoint = 35 + Math.random() * 15;
  } else {
    // 6% chance: 50x - 100x (Extreme - rare big win)
    crashPoint = 50 + Math.random() * 50;
  }
  
  // Ensure minimum crash point is at least 1.1x (so it doesn't crash instantly)
  crashPoint = Math.max(crashPoint, 1.1);
  
  // Admin override
  if (isAdmin && adminControls.forceCrash) {
    crashPoint = adminControls.crashMultiplier;
    setAdminControls(prev => ({ ...prev, forceCrash: false }));
  }
  
  setNextCrashPoint(crashPoint);
  
  let countdown = adminControls.roundDuration;
  setRoundTimer(countdown);
  
  const countdownInterval = setInterval(() => {
    countdown--;
    setRoundTimer(countdown);
    
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      startFlying();
    }
  }, 1000);
}, [isAdmin, adminControls]);

const startFlying = useCallback(() => {
  setGameStatus("flying");
  setIsPlaying(true);
  setCurrentMultiplier(1);
  
  if (animationRef.current) clearInterval(animationRef.current);
  
  animationRef.current = setInterval(() => {
    setCurrentMultiplier(prev => {
      // Dynamic increment - starts slow, gets faster
      let increment;
      if (prev < 1.4) increment = 0.015;
      else if (prev < 3) increment = 0.02;
      else if (prev < 5) increment = 0.025;
      else if (prev < 10) increment = 0.03;
      else if (prev < 20) increment = 0.04;
      else if (prev < 35) increment = 0.05;
      else increment = 0.06;
      
      const newMultiplier = Number((prev + increment).toFixed(2));
      
      // Update chart data
      chartDataRef.current.push({ 
        x: chartDataRef.current.length, 
        y: newMultiplier 
      });
      setChartData([...chartDataRef.current]);
      
      // Auto cashout check
      if (autoCashout && newMultiplier >= autoCashout && !hasCashedOut && gameStatus === "flying") {
        cashout();
        return prev;
      }
      
      // Crash check
      if (newMultiplier >= nextCrashPoint) {
        crash();
        return prev;
      }
      
      return newMultiplier;
    });
  }, 40); // Faster interval for smoother animation
}, [autoCashout, hasCashedOut, gameStatus, nextCrashPoint]);

  const placeBet = async () => {
    const amount = Number(betAmount);
    
    if (!amount || amount < adminControls.minBet) {
      alert(`Minimum bet amount is ₹${adminControls.minBet}`);
      return;
    }

    if (amount > wallet) {
      alert("Insufficient balance");
      return;
    }

    if (amount > adminControls.maxBet) {
      alert(`Maximum bet amount is ₹${adminControls.maxBet}`);
      return;
    }

    if (gameStatus !== "waiting") {
      alert("Please wait for next round!");
      return;
    }

    try {
      const response = await api.post("/bet/place", {
        game: "aviator",
        amount: amount,
        selection: "fly",
        betType: "aviator",
        multiplier: 1
      });

      setWallet(response.data.wallet);
      setCurrentBetId(response.data.betId);
      setHistoryRefresh(prev => prev + 1);

      if (!user) return;

      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSelectedBetAmount(amount);

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to place bet");
    }
  };

  const crash = async () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    setGameStatus("crashed");
    setIsCrashed(true);
    setIsPlaying(false);
    
    // Add to crash history
    setCrashHistory(prev => [currentMultiplier, ...prev].slice(0, 20));
    setMultiplierHistory(prev => [currentMultiplier, ...prev].slice(0, 10));
    
    if (!hasCashedOut && currentBetId) {
      await api.post("/bet/cashout", {
        betId: currentBetId,
        winAmount: 0,
        result: `crashed at ${currentMultiplier.toFixed(2)}x`,
        multiplier: currentMultiplier
      });
      setHistoryRefresh(prev => prev + 1);
      fetchWallet();
      fetchStats();
      setWinStreak(0);
      setLastWin(0);
      setTotalLosses(prev => prev + 1);
      
      setBetHistory(prev => [{
        id: Date.now().toString(),
        multiplier: currentMultiplier,
        amount: selectedBetAmount || Number(betAmount),
        result: "LOSS",
        time: new Date().toLocaleTimeString(),
        profit: -(selectedBetAmount || Number(betAmount))
      }, ...prev.slice(0, 19)]);
    }
    
    setCurrentBetId(null);
    
    setTimeout(() => {
      startGameRound();
    }, 3000);
  };

  const cashout = async () => {
    if (gameStatus !== "flying" || hasCashedOut || !currentBetId) return;

    const winAmount = (selectedBetAmount || Number(betAmount)) * currentMultiplier;

    try {
      const response = await api.post("/bet/cashout", {
        betId: currentBetId,
        winAmount: winAmount,
        result: `cashed out at ${currentMultiplier.toFixed(2)}x`,
        multiplier: currentMultiplier
      });

      setWallet(response.data.wallet);
      fetchWallet();
      setLastWin(winAmount);
      setHasCashedOut(true);
      setHistoryRefresh(prev => prev + 1);
      setWinStreak(prev => prev + 1);
      setTotalProfit(prev => prev + (winAmount - (selectedBetAmount || Number(betAmount))));
      setTotalWins(prev => prev + 1);
      
      setRecentWins(prev => [{
        user: user?.name || "You",
        amount: winAmount,
        multiplier: currentMultiplier,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);
      
      setMultiplierHistory(prev => [currentMultiplier, ...prev].slice(0, 10));
      
      setBetHistory(prev => [{
        id: Date.now().toString(),
        multiplier: currentMultiplier,
        amount: winAmount,
        result: "WIN",
        time: new Date().toLocaleTimeString(),
        profit: winAmount - (selectedBetAmount || Number(betAmount))
      }, ...prev.slice(0, 19)]);

      if (!user) return;

      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      if (soundEnabled) {
        // Play win sound
      }

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Cashout failed");
    }
  };

  // ============================================
  // CANVAS ANIMATION
  // ============================================
  useEffect(() => {
    if (!canvasRef.current || loading) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;
    
    // Create gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0a0a2e");
    gradient.addColorStop(0.3, "#1a0a3e");
    gradient.addColorStop(0.6, "#2a0a4e");
    gradient.addColorStop(0.85, "#3a0a5e");
    gradient.addColorStop(1, "#4a0a6e");
    
    let stars: { x: number; y: number; size: number; speed: number }[] = [];
    let clouds: { x: number; y: number; size: number; speed: number }[] = [];
    
    // Create stars
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.5
      });
    }
    
    // Create clouds
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.5 + 50,
        size: Math.random() * 40 + 30,
        speed: Math.random() * 0.4 + 0.1
      });
    }
    
    let frame = 0;
    
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);
      
      // Draw sky
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw stars
      stars.forEach(star => {
        const twinkle = Math.sin(frame * 0.02 + star.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed * 0.3;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });
      
      // Draw clouds
      clouds.forEach(cloud => {
        ctx.globalAlpha = 0.1;
        ctx.font = `${cloud.size}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("☁️", cloud.x, cloud.y);
        ctx.globalAlpha = 1;
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.size < -50) {
          cloud.x = width + 50;
          cloud.y = Math.random() * height * 0.5 + 50;
        }
      });
      
      // Calculate plane position
      const progress = Math.min(currentMultiplier / nextCrashPoint, 1);
      const planeXPos = width * progress;
      const planeYPos = height - 60 - (progress * (height - 120));
      planeX.current = planeXPos;
      planeY.current = planeYPos;
      
      // Draw flight path
      ctx.beginPath();
      ctx.moveTo(0, height - 40);
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const x = width * t;
        const y = height - 40 - (t * (height - 120));
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(34, 197, 94, 0.15)";
      ctx.lineWidth = 6;
      ctx.stroke();
      
      // Draw dashed path
      ctx.beginPath();
      ctx.moveTo(0, height - 40);
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const x = width * t;
        const y = height - 40 - (t * (height - 120));
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw milestones
// Replace with milestones showing 1x to 50x
const milestones = [1, 1.5, 2, 3, 5, 8, 10, 15, 20, 30, 40, 50];
      milestones.forEach(multi => {
        const t = multi / nextCrashPoint;
        if (t <= 1) {
          const x = width * t;
          const y = height - 40 - (t * (height - 120));
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(34, 197, 94, 0.4)";
          ctx.fill();
          
          ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
          ctx.font = "bold 10px monospace";
          ctx.fillText(`${multi}x`, x - 10, y - 12);
        }
      });
      
      // Draw plane
      if (gameStatus === "flying" && !hasCashedOut) {
        // Engine trail
        for (let i = 0; i < 12; i++) {
          const trailX = planeXPos - (i * 6);
          const trailY = planeYPos + (i * 3);
          const alpha = 0.4 - (i / 12) * 0.4;
          const size = 5 - (i / 12) * 3;
          ctx.fillStyle = `rgba(255, 150, 50, ${alpha})`;
          ctx.beginPath();
          ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Plane
        ctx.save();
        ctx.translate(planeXPos, planeYPos);
        const rotation = progress * Math.PI / 4;
        ctx.rotate(rotation);
        ctx.font = "48px sans-serif";
        ctx.fillStyle = "#facc15";
        ctx.shadowBlur = 30;
        ctx.shadowColor = "rgba(250, 204, 21, 0.5)";
        ctx.fillText("✈️", -24, -24);
        ctx.restore();
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentMultiplier, nextCrashPoint, gameStatus, hasCashedOut, loading]);

  // ============================================
  // HELPERS
  // ============================================
  const formatNumber = (num: number) => {
    return num?.toLocaleString() || "0";
  };

  const getMultiplierColor = (multi: number) => {
    if (multi >= 10) return "bg-purple-500/20 text-purple-400 border border-purple-500/50";
    if (multi >= 5) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
    if (multi >= 2) return "bg-green-500/20 text-green-400 border border-green-500/50";
    return "bg-blue-500/20 text-blue-400 border border-blue-500/50";
  };

  const getStatusColor = () => {
    if (gameStatus === "waiting") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    if (gameStatus === "flying") return "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  };

  const getStatusIcon = () => {
    if (gameStatus === "waiting") return <Clock size={14} />;
    if (gameStatus === "flying") return <Rocket size={14} className="animate-pulse" />;
    return <AlertCircle size={14} />;
  };

  const getStatusText = () => {
    if (gameStatus === "waiting") return "BETTING";
    if (gameStatus === "flying") return "FLYING";
    return "CRASHED";
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading Aviator...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ====== HEADER ====== */}
      <div className="sticky top-0 z-50 bg-linear-to-r from-zinc-950 to-black border-b border-zinc-800">
        <div className="max-w-full mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-400 hover:text-white transition">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-linear-to-r from-green-500 to-green-700 p-2 rounded-xl">
                <Rocket className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-black text-green-400">AVIATOR</h1>
            </div>
            <span className="hidden md:inline text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
              LIVE
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
              <Users size={16} className="text-green-400" />
              <span className="font-bold text-green-400">{liveUsers.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
              title="History"
            >
              <History size={18} />
            </button>
            
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
              title={soundEnabled ? "Sound On" : "Sound Off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button 
              onClick={toggleFullscreen} 
              className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            
            <button 
              onClick={() => setShowBalance(!showBalance)} 
              className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
              title={showBalance ? "Hide Balance" : "Show Balance"}
            >
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            
            <div className="bg-linear-to-r from-green-600 to-green-500 rounded-xl px-3 py-2 md:px-4">
              <span className="font-bold text-black text-sm md:text-base">
                ₹{showBalance ? formatNumber(wallet) : "****"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="max-w-full mx-auto px-4 py-4 md:py-6">
        <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* ====== LEFT PANEL ====== */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Wallet & Stats */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400 text-sm">💰 Balance</span>
                <span className="text-green-400 font-bold text-lg">₹{formatNumber(wallet)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">🔥 Win Streak</span>
                <span className="text-yellow-400 font-bold">{winStreak}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">📈 Profit</span>
                <span className={totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
                  ₹{formatNumber(totalProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">🏆 Win Rate</span>
                <span className="text-blue-400 font-bold">
                  {totalBets > 0 ? Math.round((totalWins / totalBets) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Bet Amount */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
              <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                <Target size={14} /> BET AMOUNT
              </h3>
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-bold">₹</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={gameStatus !== "waiting"}
                  className="w-full bg-black border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:border-green-500 outline-none disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount.toString())}
                    disabled={gameStatus !== "waiting"}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 py-2 rounded-lg font-bold text-sm transition"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              <button
                onClick={placeBet}
                disabled={gameStatus !== "waiting" || !betAmount}
                className={`w-full py-3 rounded-xl font-bold text-lg transition ${
                  gameStatus === "waiting" && betAmount
                    ? "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black shadow-lg shadow-green-500/20"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {gameStatus === "waiting" ? "🚀 PLACE BET" : "⏳ WAITING..."}
              </button>
              
              {selectedBetAmount && gameStatus === "flying" && !hasCashedOut && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-center animate-pulse">
                  <p className="text-sm text-zinc-400">Bet Active</p>
                  <p className="text-xl font-bold text-green-400">₹{formatNumber(selectedBetAmount)}</p>
                </div>
              )}
            </div>

            {/* Auto Cashout */}
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800">
              <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                <Settings size={14} /> AUTO CASHOUT
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {autoCashoutOptions.map((multi) => (
                  <button
                    key={multi}
                    onClick={() => setAutoCashout(autoCashout === multi ? null : multi)}
                    className={`py-2 rounded-lg font-bold text-sm transition ${
                      autoCashout === multi 
                        ? "bg-green-500 text-black" 
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    {multi}x
                  </button>
                ))}
              </div>
              {autoCashout && (
                <div className="mt-3 bg-green-500/20 border border-green-500 rounded-xl p-2 text-center">
                  <p className="text-sm text-green-400">Auto cashout at <span className="font-bold">{autoCashout}x</span></p>
                </div>
              )}
            </div>

            {/* Recent Bets */}
            {betHistory.length > 0 && (
              <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-zinc-800 max-h-60 overflow-y-auto">
                <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                  <Clock size={14} /> RECENT BETS
                </h3>
                <div className="space-y-2">
                  {betHistory.slice(0, 5).map((bet, i) => (
                    <div key={i} className={`bg-black rounded-xl p-2 flex justify-between items-center ${
                      bet.result === "WIN" ? "border border-green-500/30" : "border border-red-500/30"
                    }`}>
                      <div>
                        <p className="text-sm font-bold text-yellow-400">{bet.multiplier.toFixed(2)}x</p>
                        <p className="text-xs text-zinc-500">{bet.time}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${bet.result === "WIN" ? "text-green-400" : "text-red-400"}`}>
                          {bet.result === "WIN" ? `+₹${formatNumber(bet.amount)}` : `-₹${formatNumber(bet.amount)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ====== CENTER - GAME AREA ====== */}
          <div className="lg:col-span-3">
            
            {/* Game Canvas */}
            <div className="relative rounded-2xl overflow-hidden border border-green-500/30 bg-black">
              <canvas ref={canvasRef} className="w-full h-125" />
              
              {/* Game Status Overlay */}
              <div className="absolute top-4 left-4 z-10">
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
              </div>

              {/* Multiplier Display */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className={`text-center ${gameStatus === "flying" && !hasCashedOut ? "animate-pulse" : ""}`}>
                  <div className="text-8xl md:text-9xl font-black text-yellow-400 drop-shadow-2xl">
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  {gameStatus === "flying" && !hasCashedOut && selectedBetAmount && (
                    <div className="mt-2 text-green-400 text-sm font-medium">
                      💰 Potential Win: ₹{formatNumber(selectedBetAmount * currentMultiplier)}
                    </div>
                  )}
                </div>
              </div>

              {/* Next Crash Point */}
              {gameStatus === "waiting" && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-black/80 backdrop-blur rounded-xl px-4 py-2 border border-red-500/50">
                    <p className="text-xs text-zinc-400">🎯 Next Crash</p>
                    <p className="text-xl font-bold text-red-400">{nextCrashPoint.toFixed(2)}x</p>
                  </div>
                </div>
              )}

              {/* Round Timer */}
              {gameStatus === "waiting" && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-black/80 backdrop-blur rounded-2xl px-8 py-4 text-center border border-yellow-500/50">
                    <p className="text-zinc-400 text-sm">🕐 Round Starts In</p>
                    <h2 className="text-4xl font-bold text-yellow-400">{roundTimer}s</h2>
                  </div>
                </div>
              )}

              {/* Cashout Button */}
              {gameStatus === "flying" && !hasCashedOut && selectedBetAmount && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                  <button
                    onClick={cashout}
                    className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-black px-12 py-4 rounded-2xl text-2xl transition-all transform hover:scale-105 shadow-lg shadow-green-500/30 animate-pulse"
                  >
                    💰 CASHOUT
                  </button>
                </div>
              )}

              {/* Crash Effect */}
              {gameStatus === "crashed" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur z-20 animate-pulse">
                  <div className="text-center">
                    <div className="text-9xl mb-4 animate-bounce">💥</div>
                    <h1 className="text-7xl font-black text-red-500 mb-3">CRASH!</h1>
                    <p className="text-2xl text-white mb-2">Crashed at <span className="text-yellow-400 font-bold">{currentMultiplier.toFixed(2)}x</span></p>
                    <p className="text-zinc-400 text-sm">Next round starting soon...</p>
                  </div>
                </div>
              )}

              {/* Cashed Out Message */}
              {hasCashedOut && gameStatus === "flying" && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-green-500/20 border border-green-500 rounded-2xl px-8 py-3 animate-bounce">
                    <p className="text-green-400 font-bold text-xl">🎉 CASHED OUT AT {currentMultiplier.toFixed(2)}x! 🎉</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Wins Ticker */}
            <div className="mt-4 bg-zinc-900/50 rounded-xl p-3 overflow-hidden border border-zinc-800">
              <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
                {recentWins.length > 0 ? (
                  recentWins.map((win, i) => (
                    <span key={i} className="text-sm">
                      🎉 <span className="text-green-400 font-bold">{win.user}</span> cashed out at <span className="text-yellow-400 font-bold">{win.multiplier.toFixed(2)}x</span> and won <span className="text-green-400 font-bold">₹{formatNumber(win.amount)}</span>!
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">Waiting for winners...</span>
                )}
              </div>
            </div>

            {/* Multiplier History */}
            <div className="mt-4 flex flex-wrap gap-2">
              {multiplierHistory.map((multi, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-lg font-bold text-sm ${getMultiplierColor(multi)}`}
                >
                  {multi.toFixed(2)}x
                </div>
              ))}
              {multiplierHistory.length === 0 && (
                <span className="text-sm text-zinc-500">No history yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="mt-6 bg-linear-to-br from-zinc-900 to-black rounded-2xl p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                <Shield size={18} /> Admin Controls
              </h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                {showSettings ? "Hide" : "Show"} Settings
              </button>
            </div>
            
            {showSettings && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-zinc-400 text-sm block mb-1">Force Crash</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={adminControls.crashMultiplier}
                      onChange={(e) => setAdminControls(prev => ({ 
                        ...prev, 
                        crashMultiplier: Number(e.target.value) 
                      }))}
                      className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 outline-none"
                    />
                    <button
                      onClick={() => setAdminControls(prev => ({ ...prev, forceCrash: true }))}
                      className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg text-sm font-bold transition"
                    >
                      Force
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-zinc-400 text-sm block mb-1">Round Duration</label>
                  <input
                    type="number"
                    value={adminControls.roundDuration}
                    onChange={(e) => setAdminControls(prev => ({ 
                      ...prev, 
                      roundDuration: Number(e.target.value) 
                    }))}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-zinc-400 text-sm block mb-1">Min Bet</label>
                  <input
                    type="number"
                    value={adminControls.minBet}
                    onChange={(e) => setAdminControls(prev => ({ 
                      ...prev, 
                      minBet: Number(e.target.value) 
                    }))}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-zinc-400 text-sm block mb-1">Max Bet</label>
                  <input
                    type="number"
                    value={adminControls.maxBet}
                    onChange={(e) => setAdminControls(prev => ({ 
                      ...prev, 
                      maxBet: Number(e.target.value) 
                    }))}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Modal */}
        {showHistory && (
          <div className="mt-6">
            <BetHistory game="aviator" refreshTrigger={historyRefresh} />
          </div>
        )}
      </div>

      {/* ====== STYLES ====== */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </main>
  );
}

function setResult(forced: string) {
  throw new Error("Function not implemented.");
}
