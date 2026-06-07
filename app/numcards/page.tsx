"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../lib/api"; // ✅ Changed to use api utility
import { io } from "socket.io-client";
import BetHistory from "../components/BetHistory";

import {
  ArrowLeft,
  Timer,
  Trophy,
  Wallet,
  History,
  TrendingUp,
  Award,
} from "lucide-react";

const socket = io("http://localhost:5000");

interface BetHistoryItem {
  _id: string;
  selection: number;
  amount: number;
  result: number;
  isWin: boolean;
  winAmount: number;
  createdAt: string;
  roundId: string;
}

export default function NumCardsPage() {
  const router = useRouter();

  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [timer, setTimer] = useState(30);
  const [wallet, setWallet] = useState(0);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [control, setControl] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [roundId, setRoundId] = useState<string>("round-1");
  const [multiplier] = useState(9);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);

  // AUTHENTICATION CHECK
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/login?redirect=/numcards");
        return;
      }

      try {
        // ✅ Using api utility
        const response = await api.get("/auth/profile");

        if (response.data.success) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setWallet(parsedUser.wallet || 0);
          setIsAuthenticated(true);
          fetchBetHistory();
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login?redirect=/numcards");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch bet history - ✅ Using api utility
  const fetchBetHistory = async () => {
    try {
      const response = await api.get("/bet/history?game=numcards");
      
      if (response.data.success) {
        setBetHistory(response.data.bets);
        const stats = response.data.stats;
        setTotalWins(stats?.totalWins || 0);
        setTotalLosses(stats?.totalLosses || 0);
      }
    } catch (error) {
      console.error("Failed to fetch bet history:", error);
    }
  };

  // FETCH CONTROL SETTINGS
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchControl = async () => {
      try {
        const res = await api.get("/control");
        setControl(res.data);
        if (res.data.currentRound) {
          setRoundId(res.data.currentRound);
        }
      } catch (error) {
        console.log("Control fetch error:", error);
      }
    };

    fetchControl();
    const interval = setInterval(fetchControl, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // SOCKET.IO EVENTS
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    socket.emit("join_game", "numcards");

    socket.on("timer_update", (value) => {
      setTimer(value);
    });

    socket.on("result_update", async (result) => {
      setLastResult(result);
      
      if (currentBetId && selectedNumber && result.toString() === selectedNumber) {
        const winAmount = parseInt(betAmount) * multiplier;
        setLastWin(winAmount);
        
        // ✅ Using api utility
        try {
          await api.post("/bet/cashout", {
            betId: currentBetId,
            winAmount: winAmount,
            result: result.toString(),
            multiplier: multiplier
          });
          
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsed = JSON.parse(userData);
            setWallet(parsed.wallet);
          }
          setHistoryRefresh(prev => prev + 1);
          setCurrentBetId(null);
        } catch (error) {
          console.error("Failed to update win:", error);
        }
      } else if (currentBetId) {
        // ✅ Using api utility
        try {
          await api.post("/bet/cashout", {
            betId: currentBetId,
            winAmount: 0,
            result: result.toString(),
            multiplier: 0
          });
          setHistoryRefresh(prev => prev + 1);
          setCurrentBetId(null);
        } catch (error) {
          console.error("Failed to update loss:", error);
        }
      }
      
      setTimeout(() => setLastWin(null), 5000);
    });

    socket.on("live_bet", (bet) => {
      setLiveBets((prev) => [bet, ...prev].slice(0, 20));
    });

    socket.on("round_start", (newRoundId) => {
      setRoundId(newRoundId);
      setLastResult(null);
      setSelectedNumber(null);
      setBetAmount("");
      setCurrentBetId(null);
    });

    return () => {
      socket.off("timer_update");
      socket.off("result_update");
      socket.off("live_bet");
      socket.off("round_start");
      socket.emit("leave_game", "numcards");
    };
  }, [isAuthenticated, user, selectedNumber, betAmount, multiplier, currentBetId]);

  // PLACE BET - ✅ Using api utility
  const placeBet = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("Please login to place bets");
        router.push("/login?redirect=/numcards");
        return;
      }

      if (!selectedNumber) {
        return alert("❌ Please select a number");
      }

      if (!betAmount || parseInt(betAmount) < 10) {
        return alert("❌ Minimum bet amount is ₹10");
      }

      if (parseInt(betAmount) > wallet) {
        return alert("❌ Insufficient balance");
      }

      if (control?.gameStatus === "PAUSED") {
        return alert("❌ Betting is currently paused");
      }

      // ✅ Using api utility - no need to manually add headers
      const response = await api.post("/bet/place", {
        game: "numcards",
        amount: parseInt(betAmount),
        selection: selectedNumber,
        betType: "number",
        multiplier: multiplier,
        roundId: roundId
      });
      
      setWallet(response.data.wallet);
      setCurrentBetId(response.data.betId);
      
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setHistoryRefresh(prev => prev + 1);
      
      socket.emit("place_bet", {
        userName: user.name,
        selection: selectedNumber,
        amount: parseInt(betAmount)
      });
      
      setBetAmount("");
      
    } catch (err: any) {
      console.error("Bet error:", err);
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      } else {
        alert(err.response?.data?.error || "❌ Bet failed. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading game...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            <History size={18} />
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>

        {/* Welcome Banner */}
        <div className="bg-linear-to-r from-green-900/30 to-black border border-green-500/30 rounded-3xl p-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-green-400">Welcome back, {user?.name}! 👋</h2>
              <p className="text-zinc-400">Round: <span className="text-green-400 font-mono">{roundId}</span></p>
            </div>
            {lastWin && (
              <div className="bg-green-500/20 border border-green-500 rounded-xl px-6 py-3 animate-bounce">
                <p className="text-green-400 font-bold text-xl">+₹{lastWin.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Trophy size={20} />
              <span className="text-sm">Total Wins</span>
            </div>
            <p className="text-2xl font-bold">{totalWins}</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <TrendingUp size={20} />
              <span className="text-sm">Total Losses</span>
            </div>
            <p className="text-2xl font-bold">{totalLosses}</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Award size={20} />
              <span className="text-sm">Win Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {totalWins + totalLosses > 0 
                ? Math.round((totalWins / (totalWins + totalLosses)) * 100) 
                : 0}%
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Wallet size={20} />
              <span className="text-sm">Balance</span>
            </div>
            <p className="text-2xl font-bold text-green-400">₹{wallet.toLocaleString()}</p>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Game Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer & Result */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <Timer className="text-green-400" size={28} />
                  <div>
                    <p className="text-zinc-500 text-sm">Time Left</p>
                    <p className={`text-4xl font-black ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                      {timer}s
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <Trophy className="text-yellow-400" size={28} />
                  <div>
                    <p className="text-zinc-500 text-sm">Last Result</p>
                    <p className="text-4xl font-black text-yellow-400">
                      {lastResult || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Select Number (1-10)</h3>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedNumber(num.toString())}
                    className={`h-16 rounded-xl text-xl font-bold transition-all transform hover:scale-105 ${
                      selectedNumber === num.toString()
                        ? "bg-green-500 text-black scale-105"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Controls */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Place Your Bet</h3>
              
              <input
                type="number"
                min="10"
                max={wallet}
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount (Min ₹10)"
                className="w-full bg-black border-2 border-zinc-700 rounded-xl px-4 py-3 mb-4 focus:border-green-500 outline-none"
              />
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount.toString())}
                    className="bg-zinc-800 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              
              {selectedNumber && betAmount && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                  <p className="text-center">
                    <span className="text-zinc-400">Potential Win: </span>
                    <span className="text-2xl font-bold text-green-400">
                      ₹{(parseInt(betAmount) * multiplier).toLocaleString()}
                    </span>
                  </p>
                </div>
              )}
              
              <button
                onClick={placeBet}
                disabled={!selectedNumber || !betAmount || control?.gameStatus === "PAUSED"}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-xl transition-colors"
              >
                {!selectedNumber ? "SELECT A NUMBER" : 
                 !betAmount ? "ENTER BET AMOUNT" :
                 control?.gameStatus === "PAUSED" ? "BETTING PAUSED" :
                 "PLACE BET"}
              </button>
            </div>
          </div>

          {/* Live Bets */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Live Bets
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {liveBets.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No live bets yet</p>
              ) : (
                liveBets.map((bet, index) => (
                  <div key={index} className="bg-black rounded-xl p-3 border border-zinc-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-green-400">{bet.userName}</p>
                        <p className="text-sm text-zinc-400">Bet on: <span className="text-yellow-400">{bet.selection}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">₹{bet.amount}</p>
                        <p className="text-xs text-zinc-500">x{multiplier}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bet History Component */}
        {showHistory && (
          <div className="mt-8">
            <BetHistory game="numcards" refreshTrigger={historyRefresh} />
          </div>
        )}
      </div>
    </main>
  );
}