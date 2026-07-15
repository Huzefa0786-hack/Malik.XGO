"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, Wallet, Trophy, Timer, History, TrendingUp, Award } from "lucide-react";

export default function SpinningWheelPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [result, setResult] = useState("");
  const [lastWin, setLastWin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const multipliers: Record<string, number> = { hearts: 2, spades: 3, clubs: 4, diamonds: 5 };
  const cards = ["hearts", "spades", "clubs", "diamonds"];
  const cardSymbols: Record<string, string> = { hearts: "♥", spades: "♠", clubs: "♣", diamonds: "♦" };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/spin");
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

  const spinWheel = async () => {
    if (isSpinning) return;
    
    if (!selectedCard) {
      alert("Please select a card first!");
      return;
    }

    if (!betAmount || Number(betAmount) < 10) {
      alert("Minimum bet is ₹10");
      return;
    }

    if (Number(betAmount) > wallet) {
      alert("Insufficient balance");
      return;
    }

    setIsSpinning(true);
    
    try {
      // Place bet
      const betResponse = await api.post("/bet/place", {
        game: "spin",
        amount: Number(betAmount),
        selection: selectedCard,
        betType: "card",
        multiplier: multipliers[selectedCard],
        roundId: `spin-${Date.now()}`
      });
      
      setWallet(betResponse.data.wallet);
      setCurrentBetId(betResponse.data.betId);
      
      const updatedUser = { ...user, wallet: betResponse.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Animate wheel spinning
      const spins = 10 + Math.random() * 5;
      const targetRotation = wheelRotation + (spins * 360);
      setWheelRotation(targetRotation);
      
      // Determine result after animation
      setTimeout(async () => {
        const randomResult = cards[Math.floor(Math.random() * cards.length)];
        setResult(randomResult);
        
        const isWin = selectedCard === randomResult;
        const winAmount = isWin ? Number(betAmount) * multipliers[randomResult] : 0;
        
        const cashoutResponse = await api.post("/bet/cashout", {
          betId: currentBetId,
          winAmount: winAmount,
          result: randomResult,
          multiplier: multipliers[randomResult]
        });
        
        setWallet(cashoutResponse.data.wallet);
        fetchWallet();
        setHistoryRefresh(prev => prev + 1);
        
        const updatedUserData = { ...user, wallet: cashoutResponse.data.wallet };
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        setUser(updatedUserData);
        
        if (isWin) {
          setLastWin(winAmount);
          alert(`🎉 Congratulations! You won ₹${winAmount.toLocaleString()}! 🎉`);
        } else {
          setLastWin(0);
          alert(`😢 You lost! Result was ${randomResult.toUpperCase()}`);
        }
        
        setBetAmount("");
        setSelectedCard("");
        setIsSpinning(false);
        setCurrentBetId(null);
        
      }, 2000);
      
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to place bet");
      setIsSpinning(false);
    }
  };

  const cardOptions = [
    { name: "hearts", symbol: "♥", color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500", multiplier: "2x" },
    { name: "spades", symbol: "♠", color: "text-gray-400", bg: "bg-gray-800", border: "border-gray-500", multiplier: "3x" },
    { name: "clubs", symbol: "♣", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500", multiplier: "4x" },
    { name: "diamonds", symbol: "♦", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500", multiplier: "5x" },
  ];

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl"
          >
            <History size={18} /> History
          </button>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 mb-10">
          <div className="bg-linear-to-r from-zinc-900 to-black border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Timer className="text-green-400" size={24} />
              <div>
                <p className="text-zinc-500 text-sm">Spin Timer</p>
                <h2 className="text-3xl font-black text-green-400">30s</h2>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-zinc-900 to-black border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Wallet className="text-green-400" size={24} />
              <div>
                <p className="text-zinc-500 text-sm">Wallet</p>
                <h2 className="text-3xl font-black text-green-400">₹{wallet.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-green-900/20 to-black border border-green-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Trophy className="text-green-400" size={24} />
              <div>
                <p className="text-zinc-500 text-sm">Last Result</p>
                <h2 className="text-3xl font-black capitalize text-green-400">{result || "—"}</h2>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-yellow-900/20 to-black border border-yellow-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Award className="text-yellow-400" size={24} />
              <div>
                <p className="text-zinc-500 text-sm">Last Win</p>
                <h2 className="text-3xl font-black text-yellow-400">₹{lastWin.toLocaleString()}</h2>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-purple-900/20 to-black border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-purple-400" size={24} />
              <div>
                <p className="text-zinc-500 text-sm">Win/Loss</p>
                <h2 className="text-xl font-black">
                  <span className="text-green-400">0</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-red-400">0</span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Wheel Animation */}
        <div className="bg-linear-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 mb-10">
          <h2 className="text-4xl font-black mb-6 text-center">Spinning Wheel</h2>
          
          <div className="flex justify-center mb-10">
            <div 
              className="relative w-96 h-96 rounded-full border-8 border-zinc-700 overflow-hidden transition-all duration-2000 ease-out"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-red-500 flex items-center justify-center">
                <span className="text-7xl font-black text-white">♥</span>
              </div>
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1/2 h-1/2 bg-gray-800 flex items-center justify-center">
                <span className="text-7xl font-black text-white">♠</span>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-green-500 flex items-center justify-center">
                <span className="text-7xl font-black text-white">♣</span>
              </div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-1/2 bg-blue-500 flex items-center justify-center">
                <span className="text-7xl font-black text-white">♦</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-black border-4 border-white z-50" />
              </div>
            </div>
          </div>

          {/* Card Selection */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {cardOptions.map((card) => (
              <button
                key={card.name}
                onClick={() => setSelectedCard(card.name)}
                className={`h-32 rounded-2xl border-2 transition-all transform hover:scale-105 flex flex-col items-center justify-center ${
                  selectedCard === card.name 
                    ? `${card.bg} ${card.border} scale-105 shadow-lg`
                    : "bg-zinc-800 border-zinc-700 hover:border-green-500"
                }`}
              >
                <span className={`text-6xl font-black ${card.color}`}>{card.symbol}</span>
                <span className={`text-xl font-black mt-2 capitalize ${card.color}`}>{card.name}</span>
                <span className="text-sm text-zinc-500 mt-1">{card.multiplier}</span>
              </button>
            ))}
          </div>

          {/* Betting Section */}
          <div className="bg-black/50 rounded-3xl p-6">
            <h2 className="text-2xl font-black mb-4">Place Your Bet</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="number"
                placeholder="Enter Bet Amount (Min ₹10)"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isSpinning}
                className="bg-black border border-zinc-700 rounded-2xl px-6 py-4 outline-none text-xl font-bold disabled:opacity-50"
              />
              <button
                onClick={spinWheel}
                disabled={isSpinning || !selectedCard || !betAmount}
                className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-2xl font-black py-4 transition-all transform hover:scale-105"
              >
                {isSpinning ? "SPINNING..." : "SPIN WHEEL 🎡"}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount.toString())}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl font-bold transition"
                >
                  ₹{amount}
                </button>
              ))}
            </div>
            
            {selectedCard && betAmount && !isSpinning && (
              <div className="mt-4 p-4 bg-linear-to-r from-green-500/10 to-yellow-500/10 rounded-xl">
                <p className="text-center">
                  <span className="text-zinc-400">Potential Win: </span>
                  <span className="text-3xl font-bold text-green-400">
                    ₹{(Number(betAmount) * multipliers[selectedCard]).toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {showHistory && <BetHistory game="spin" refreshTrigger={historyRefresh} />}
      </div>
    </main>
  );
}