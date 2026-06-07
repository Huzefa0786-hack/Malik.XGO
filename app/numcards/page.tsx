"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { io } from "socket.io-client";

import {
  ArrowLeft,
  Timer,
  Trophy,
  Wallet,
  LogIn,
  AlertCircle
} from "lucide-react";

const socket = io("http://localhost:5000");

export default function NumCardsPage() {
  const router = useRouter();

  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [timer, setTimer] = useState(30);
  const [wallet, setWallet] = useState(0);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [betHistory, setBetHistory] = useState<any[]>([]);
  const [control, setControl] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [roundId, setRoundId] = useState<string>("round-1");
  const [multiplier, setMultiplier] = useState(9);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AUTHENTICATION CHECK - This runs first
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      console.log("Checking auth...", { hasToken: !!token, hasUserData: !!userData });

      if (!token || !userData) {
        // Not logged in, redirect to login
        console.log("No token or user data, redirecting to login");
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push("/login?redirect=/numcards");
        return;
      }

      try {
        // Verify token is valid by making a test request
        const response = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setWallet(parsedUser.wallet || 0);
          setIsAuthenticated(true);
          console.log("User authenticated:", parsedUser.name);
        } else {
          throw new Error("Invalid token");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        // Token is invalid, clear storage and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loggedIn");
        setIsAuthenticated(false);
        router.push("/login?redirect=/numcards");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // FETCH CONTROL SETTINGS & CURRENT ROUND (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchControl = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/control");
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

  // SOCKET.IO EVENTS (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Join game room
    socket.emit("join_game", "numcards");

    socket.on("timer_update", (value) => {
      setTimer(value);
    });

    socket.on("result_update", (result) => {
      setLastResult(result);
      
      // Check if user's bet won
      if (selectedNumber && result.toString() === selectedNumber && betAmount) {
        const winAmount = parseInt(betAmount) * multiplier;
        setTimeout(() => {
          alert(`🎉 CONGRATULATIONS! You won ₹${winAmount.toLocaleString()}! 🎉`);
        }, 500);
      }
    });

    socket.on("live_bet", (bet) => {
      setLiveBets((prev) => [bet, ...prev].slice(0, 20));
    });

    socket.on("bet_result", (data) => {
      setBetHistory((prev) => [data, ...prev].slice(0, 15));
      
      // Update wallet if this is user's bet
      if (data.userId === user?._id) {
        setWallet(data.newBalance);
        const updatedUser = { ...user, wallet: data.newBalance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    });

    socket.on("round_start", (newRoundId) => {
      setRoundId(newRoundId);
      setLastResult(null);
      setSelectedNumber(null);
      setBetAmount("");
    });

    socket.on("wallet_update", (data) => {
      if (data.userId === user?._id) {
        setWallet(data.newBalance);
        const updatedUser = { ...user, wallet: data.newBalance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    });

    return () => {
      socket.off("timer_update");
      socket.off("result_update");
      socket.off("live_bet");
      socket.off("bet_result");
      socket.off("round_start");
      socket.off("wallet_update");
      socket.emit("leave_game", "numcards");
    };
  }, [isAuthenticated, user, selectedNumber, betAmount, multiplier]);

  // PLACE BET (only if authenticated)
  const placeBet = async () => {
    // Double check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to place bets");
      router.push("/login?redirect=/numcards");
      return;
    }

    try {
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

      if (!user?._id) {
        return alert("❌ User not found. Please login again.");
      }

      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        "http://localhost:5000/api/bet/place",
        {
          userId: user._id,
          game: "numcards",
          selection: selectedNumber,
          amount: parseInt(betAmount),
          roundId: roundId,
          multiplier: multiplier
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update wallet
      setWallet(response.data.wallet);
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Emit to socket for live updates
      socket.emit("place_bet", {
        userName: user.name,
        userId: user._id,
        selection: selectedNumber,
        amount: parseInt(betAmount),
        game: "numcards",
        roundId: roundId
      });

      // Show confirmation
      alert(`✅ Bet placed: ₹${parseInt(betAmount)} on number ${selectedNumber}`);

      // Clear bet amount but keep selection
      setBetAmount("");

    } catch (err: any) {
      console.error("Bet error:", err);
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login?redirect=/numcards");
      } else {
        alert(err?.response?.data?.error || "❌ Bet failed. Please try again.");
      }
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Checking authentication...</p>
        </div>
      </main>
    );
  }

  // If not authenticated, show login required message (should redirect, but just in case)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <LogIn size={64} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-black mb-4">Login Required</h1>
          <p className="text-zinc-400 mb-8">
            Please login to access the NumCards game and start winning!
          </p>
          <Link
            href="/login?redirect=/numcards"
            className="inline-block bg-green-500 text-black px-8 py-4 rounded-2xl font-black hover:bg-green-600 transition-colors"
          >
            LOGIN NOW
          </Link>
        </div>
      </main>
    );
  }

  // GAME STOPPED
  if (control?.gameStatus === "STOPPED") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-7xl font-black text-red-500 mb-6">GAME STOPPED</h1>
          <p className="text-zinc-500 text-2xl">Server under maintenance</p>
          <Link href="/" className="inline-block mt-8 bg-green-500 text-black px-8 py-4 rounded-2xl font-bold">
            BACK TO HOME
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">

        {/* BACK BUTTON */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        {/* USER GREETING */}
        <div className="bg-linear-to-r from-green-900/30 to-black border border-green-500/30 rounded-3xl p-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-green-400">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="text-zinc-400">Ready to test your luck?</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-sm">Round ID</p>
              <p className="font-mono font-bold text-green-400">{roundId}</p>
            </div>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {/* TIMER */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <Timer className="text-green-400" size={32} />
              <div>
                <p className="text-gray-500">Time Left</p>
                <h2 className={`text-5xl font-black ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                  {timer}s
                </h2>
              </div>
            </div>
          </div>

          {/* WALLET */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <Wallet className="text-green-400" size={32} />
              <div>
                <p className="text-gray-500">Wallet Balance</p>
                <h2 className="text-5xl font-black text-green-400">
                  ₹{wallet.toLocaleString()}
                </h2>
              </div>
            </div>
          </div>

          {/* LAST RESULT */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <Trophy className="text-green-400" size={32} />
              <div>
                <p className="text-gray-500">Last Result</p>
                <h2 className={`text-5xl font-black ${lastResult ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {lastResult ?? "—"}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* NUMBERS GRID */}
        <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8 mb-8">
          <h2 className="text-3xl font-black mb-8">
            Select Your Lucky Number
            {selectedNumber && <span className="text-green-400 ml-4">✓ Selected: {selectedNumber}</span>}
          </h2>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
            {Array.from({ length: 10 }).map((_, i) => {
              const num = (i + 1).toString();
              return (
                <button
                  key={i}
                  onClick={() => setSelectedNumber(num)}
                  disabled={control?.gameStatus === "PAUSED"}
                  className={`h-20 rounded-2xl border-2 text-2xl font-black transition-all transform hover:scale-105 ${
                    selectedNumber === num
                      ? "bg-green-500 border-green-500 text-black scale-105"
                      : "bg-gray-900 border-gray-800 hover:border-green-500 hover:bg-gray-800"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* BETTING SECTION */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT - BET CONTROLS */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-6">Place Your Bet</h2>

            <input
              type="number"
              min="10"
              max={wallet}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Enter Bet Amount"
              className="w-full bg-black border-2 border-zinc-800 focus:border-green-500 outline-none rounded-2xl px-6 py-5 text-2xl font-black text-white placeholder:text-zinc-500 mb-6"
              disabled={control?.gameStatus === "PAUSED"}
            />

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[100, 500, 1000, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(String(amount))}
                  className="bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 h-14 rounded-2xl font-black transition"
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            <button
              onClick={placeBet}
              disabled={control?.gameStatus === "PAUSED" || !selectedNumber || !betAmount}
              className={`w-full rounded-2xl py-5 text-2xl font-black transition-all transform hover:scale-105 ${
                control?.gameStatus === "PAUSED" || !selectedNumber || !betAmount
                  ? "bg-zinc-700 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              {control?.gameStatus === "PAUSED" 
                ? "⏸️ BETTING PAUSED" 
                : !selectedNumber 
                ? "⚠️ SELECT A NUMBER" 
                : `🎲 PLACE BET ₹${betAmount || 0}`}
            </button>

            {/* Bet Info */}
            {selectedNumber && betAmount && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
                <p className="text-center">
                  <span className="text-zinc-400">Potential Win: </span>
                  <span className="text-2xl font-bold text-green-400">
                    ₹{(parseInt(betAmount) * multiplier).toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* RIGHT - LIVE BETS */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-6">
              🔴 Live Bets <span className="text-sm text-zinc-500">(Last 20)</span>
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {liveBets.length === 0 && (
                <p className="text-gray-500 text-center py-8">No bets placed yet. Be the first! 🎲</p>
              )}

              {liveBets.map((bet, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-500 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-400 font-bold">{bet.userName}</p>
                      <p className="text-sm text-gray-400">
                        Bet on <span className="text-yellow-400 font-bold">{bet.selection}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">₹{bet.amount}</p>
                      <p className="text-xs text-gray-500">x{multiplier}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}