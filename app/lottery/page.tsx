"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, Wallet, Trophy, Ticket, Clock, Users, History, TrendingUp } from "lucide-react";

export default function LotteryPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [lotteryNumbers, setLotteryNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastWinners, setLastWinners] = useState<{ name: string; amount: number; numbers: number[] }[]>([]);
  const [nextDrawTime, setNextDrawTime] = useState(300);
  const [loading, setLoading] = useState(true);
  const [jackpotAmount, setJackpotAmount] = useState(100000);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/lottery");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setWallet(parsedUser.wallet || 0);
    setLoading(false);
    fetchStats(token);
    
    const numbers: number[] = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!numbers.includes(num)) numbers.push(num);
    }
    setLotteryNumbers(numbers.sort((a, b) => a - b));
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5000/api/bet/history?game=lottery", {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setNextDrawTime(prev => prev > 0 ? prev - 1 : 300);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < 6) {
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const buyTickets = async () => {
    const token = localStorage.getItem("token");
    const cost = ticketCount * 10;
    
    if (cost > wallet) {
      alert("Insufficient balance!");
      return;
    }
    
    if (selectedNumbers.length !== 6) {
      alert("Please select 6 numbers!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/bet/place",
        { 
          game: "lottery", 
          amount: cost, 
          selection: selectedNumbers.join(","),
          betType: "lottery",
          multiplier: jackpotAmount / cost
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setWallet(response.data.wallet);
      setHistoryRefresh(prev => prev + 1);
      
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      alert(`🎫 Purchased ${ticketCount} ticket(s) with numbers: ${selectedNumbers.join(", ")}`);
      setSelectedNumbers([]);
      
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to purchase tickets");
    }
  };

  const drawLottery = async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    
    let drawInterval = setInterval(() => {
      const randomNumbers: number[] = [];
      while (randomNumbers.length < 6) {
        const num = Math.floor(Math.random() * 49) + 1;
        if (!randomNumbers.includes(num)) randomNumbers.push(num);
      }
      setLotteryNumbers(randomNumbers.sort((a, b) => a - b));
    }, 100);
    
    setTimeout(async () => {
      clearInterval(drawInterval);
      const finalNumbers: number[] = [];
      while (finalNumbers.length < 6) {
        const num = Math.floor(Math.random() * 49) + 1;
        if (!finalNumbers.includes(num)) finalNumbers.push(num);
      }
      finalNumbers.sort((a, b) => a - b);
      setLotteryNumbers(finalNumbers);
      
      // Check if user won
      const matchedNumbers = selectedNumbers.filter(n => finalNumbers.includes(n));
      if (matchedNumbers.length >= 3) {
        const winAmount = (jackpotAmount / 100) * (matchedNumbers.length * 10);
        const token = localStorage.getItem("token");
        if (token) {
          await axios.post(
            "http://localhost:5000/api/bet/cashout",
            { winAmount: winAmount, result: `${matchedNumbers.length} matches`, multiplier: matchedNumbers.length },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setHistoryRefresh(prev => prev + 1);
          fetchStats(token);
          alert(`🎉 You won ₹${winAmount.toLocaleString()} with ${matchedNumbers.length} matches! 🎉`);
        }
      }
      
      setLastWinners(prev => [{
        name: user?.name || "Winner",
        amount: Math.floor(Math.random() * 50000) + 10000,
        numbers: finalNumbers
      }, ...prev.slice(0, 4)]);
      
      setIsDrawing(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Back
          </Link>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl"
          >
            <History size={18} /> History
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-linear-to-r from-purple-900 to-purple-700 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" size={32} />
              <div>
                <p className="text-zinc-200">Jackpot</p>
                <h2 className="text-4xl font-black text-yellow-400">₹{jackpotAmount.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Wallet className="text-green-400" size={32} />
              <div>
                <p className="text-zinc-500">Your Balance</p>
                <h2 className="text-4xl font-black text-green-400">₹{wallet.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-400" size={32} />
              <div>
                <p className="text-zinc-500">Next Draw</p>
                <h2 className="text-4xl font-black text-blue-400">{formatTime(nextDrawTime)}</h2>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-400" size={32} />
              <div>
                <p className="text-zinc-500">Win/Loss</p>
                <h2 className="text-2xl font-black">
                  <span className="text-green-400">{stats.totalWins}</span>
                  <span className="text-zinc-600"> / </span>
                  <span className="text-red-400">{stats.totalLosses}</span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Lottery Numbers Display */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <h2 className="text-3xl font-black mb-6 text-center">Today's Lottery Numbers</h2>
          <div className="flex justify-center gap-4 mb-6">
            {lotteryNumbers.map((num, i) => (
              <div key={i} className="w-20 h-20 rounded-2xl bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl font-black">
                {num}
              </div>
            ))}
          </div>
          <button onClick={drawLottery} disabled={isDrawing} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-4 rounded-2xl font-black text-xl">
            {isDrawing ? "DRAWING..." : "DRAW NEW NUMBERS 🎲"}
          </button>
        </div>

        {/* Number Selection */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <h2 className="text-3xl font-black mb-4">Select Your Numbers (1-49)</h2>
          <p className="text-zinc-500 mb-6">Choose 6 numbers | Each ticket: ₹10</p>
          
          <div className="grid grid-cols-7 gap-3 mb-8">
            {Array.from({ length: 49 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                className={`h-12 rounded-xl font-bold transition-all ${
                  selectedNumbers.includes(num) ? "bg-green-500 text-black scale-105" : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          
          <div className="bg-black rounded-2xl p-4 mb-6">
            <p className="text-zinc-500 mb-2">Selected Numbers:</p>
            <div className="flex gap-2 flex-wrap">
              {selectedNumbers.length > 0 ? selectedNumbers.map((num, i) => (
                <span key={i} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-bold">{num}</span>
              )) : <span className="text-zinc-500">None selected</span>}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 mb-2">Number of Tickets</label>
              <input type="number" min={1} max={10} value={ticketCount} onChange={(e) => setTicketCount(Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded-xl p-4" />
            </div>
            <button onClick={buyTickets} className="bg-green-500 hover:bg-green-600 text-black rounded-xl py-4 font-black text-xl flex items-center justify-center gap-2">
              <Ticket size={24} /> BUY ₹{ticketCount * 10}
            </button>
          </div>
        </div>

        {/* Recent Winners */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-2">
            <Trophy className="text-yellow-400" /> Recent Winners
          </h2>
          <div className="space-y-3">
            {lastWinners.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No winners yet. Be the first! 🎉</p>
            ) : (
              lastWinners.map((winner, index) => (
                <div key={index} className="bg-black rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{winner.name}</p>
                    <p className="text-sm text-zinc-500">{winner.numbers.join(", ")}</p>
                  </div>
                  <p className="text-green-400 font-bold text-xl">+₹{winner.amount.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bet History */}
        {showHistory && (
          <div className="mt-8">
            <BetHistory game="lottery" refreshTrigger={historyRefresh} />
          </div>
        )}
      </div>
    </main>
  );
}
