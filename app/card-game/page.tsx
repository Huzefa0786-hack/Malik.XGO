"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import BetHistory from "../components/BetHistory";
import { 
  ArrowLeft, 
  Wallet, 
  Trophy, 
  Heart, 
  Diamond, 
  Club, 
  Spade,
  TrendingUp,
  History,
  Award,
  Timer,
  RefreshCw
} from "lucide-react";

// Card suits with their properties
const SUITS = [
  { name: "SPADES", symbol: "♠", color: "text-gray-400", bg: "bg-gray-800", border: "border-gray-500", value: "spades" },
  { name: "HEARTS", symbol: "♥", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500", value: "hearts" },
  { name: "DIAMONDS", symbol: "♦", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500", value: "diamonds" },
  { name: "CLUBS", symbol: "♣", color: "text-gray-400", bg: "bg-gray-800", border: "border-gray-500", value: "clubs" }
];

// Card numbers 1-10
const CARD_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// Payout multipliers
const PAYOUTS = {
  exact: 3,     // Exact card (suit + number) - 3x
  suit: 3,      // Only suit - 3x
  number: 4     // Only number - 4x
};

type Bet = {
  id: string;
  suit: string | null;
  number: string | null;
  amount: number;
  type: "exact" | "suit" | "number";
};

export default function CardGamePage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSuit, setSelectedSuit] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [betType, setBetType] = useState<"exact" | "suit" | "number">("exact");
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ suit: string; number: string; symbol: string } | null>(null);
  const [lastWin, setLastWin] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<{ suit: string; number: string; symbol: string }[]>([]);
  const [timer, setTimer] = useState(30);
  const [bettingOpen, setBettingOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/card-game");
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
      const response = await axios.get("http://localhost:5002/api/bet/history?game=card-game", {
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

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (bettingOpen && (selectedSuit || selectedNumber)) {
            autoPlaceBet();
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSuit, selectedNumber, betAmount, bettingOpen]);

  const getCardSymbol = (suit: string) => {
    const suitMap: Record<string, string> = {
      spades: "♠",
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣"
    };
    return suitMap[suit] || "?";
  };

  const getCardColor = (suit: string) => {
    return suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-gray-400";
  };

  const calculateWinAmount = (resultSuit: string, resultNumber: string, bet: Bet): number => {
    if (bet.type === "exact" && bet.suit === resultSuit && bet.number === resultNumber) {
      return bet.amount * PAYOUTS.exact;
    } else if (bet.type === "suit" && bet.suit === resultSuit) {
      return bet.amount * PAYOUTS.suit;
    } else if (bet.type === "number" && bet.number === resultNumber) {
      return bet.amount * PAYOUTS.number;
    }
    return 0;
  };

  const placeBet = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login?redirect=/card-game");
      return;
    }

    if (!selectedSuit && !selectedNumber) {
      alert("Please select a suit or number to bet on!");
      return;
    }

    if (betAmount < 10) {
      alert("Minimum bet is ₹10");
      return;
    }

    if (betAmount > wallet) {
      alert("Insufficient balance!");
      return;
    }

    if (!bettingOpen) {
      alert("Betting is closed for this round!");
      return;
    }

    setIsPlaying(true);

    try {
      let selection = "";
      if (betType === "exact" && selectedSuit && selectedNumber) {
        selection = `${selectedSuit}:${selectedNumber}`;
      } else if (betType === "suit" && selectedSuit) {
        selection = `suit:${selectedSuit}`;
      } else if (betType === "number" && selectedNumber) {
        selection = `number:${selectedNumber}`;
      }

      const response = await axios.post(
        "http://localhost:5002/api/bet/place",
        {
          game: "card-game",
          amount: betAmount,
          selection: selection,
          betType: betType,
          multiplier: betType === "exact" ? PAYOUTS.exact : betType === "suit" ? PAYOUTS.suit : PAYOUTS.number
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWallet(response.data.wallet);
      setCurrentBetId(response.data.betId);
      
      const updatedUser = { ...user, wallet: response.data.wallet };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Draw card after bet
      drawCard();

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to place bet");
      setIsPlaying(false);
    }
  };

  const autoPlaceBet = async () => {
    if (!bettingOpen || !selectedSuit && !selectedNumber) return;
    await placeBet();
  };

  const drawCard = async () => {
    const suits = ["spades", "hearts", "diamonds", "clubs"];
    const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    
    setResult({ suit: randomSuit, number: randomNumber, symbol: getCardSymbol(randomSuit) });
    
    // Calculate win
    const bet: Bet = {
      id: currentBetId || "",
      suit: selectedSuit,
      number: selectedNumber,
      amount: betAmount,
      type: betType
    };
    
    const winAmount = calculateWinAmount(randomSuit, randomNumber, bet);
    
    if (winAmount > 0 && currentBetId) {
      const token = localStorage.getItem("token");
      try {
        const cashoutResponse = await axios.post(
          "http://localhost:5002/api/bet/cashout",
          { 
            betId: currentBetId, 
            winAmount: winAmount, 
            result: `${randomSuit.toUpperCase()} ${randomNumber}`,
            multiplier: winAmount / betAmount
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setWallet(cashoutResponse.data.wallet);
        setLastWin(winAmount);
        setTotalProfit(prev => prev + (winAmount - betAmount));
        setBiggestWin(prev => winAmount > prev ? winAmount : prev);
        setGamesPlayed(prev => prev + 1);
        setStats(prev => ({ ...prev, totalWins: prev.totalWins + 1 }));
        setHistoryRefresh(prev => prev + 1);
        
        const updatedUser = { ...user, wallet: cashoutResponse.data.wallet };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        alert(`🎉 WIN! ${randomSuit.toUpperCase()} ${randomNumber} - Won ₹${winAmount.toLocaleString()}! 🎉`);
      } catch (error) {
        console.error("Cashout error:", error);
      }
    } else if (currentBetId) {
      setGamesPlayed(prev => prev + 1);
      setStats(prev => ({ ...prev, totalLosses: prev.totalLosses + 1 }));
      alert(`😢 Lost! Card was ${randomSuit.toUpperCase()} ${randomNumber}`);
    }
    
    // Add to recent results
    setRecentResults(prev => [{
      suit: randomSuit,
      number: randomNumber,
      symbol: getCardSymbol(randomSuit)
    }, ...prev.slice(0, 9)]);
    
    setIsPlaying(false);
    setCurrentBetId(null);
    setBettingOpen(false);
    
    // Reset for next round
    setTimeout(() => {
      setResult(null);
      setBettingOpen(true);
      setSelectedSuit(null);
      setSelectedNumber(null);
    }, 3000);
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

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
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Back to Dashboard
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

        <h1 className="text-5xl font-black text-green-400 mb-6 text-center">CARD GAME</h1>
        <p className="text-zinc-400 text-center mb-8">Bet on Suits & Numbers | Win up to 35x!</p>

        {/* Timer Banner */}
        <div className="bg-linear-to-r from-green-900/30 to-black border border-green-500/30 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="text-zinc-400 text-sm">Next Draw</p>
              <div className="flex items-center gap-2">
                <Timer className="text-green-400" />
                <span className={`text-3xl font-black ${timer <= 5 ? "text-red-500 animate-pulse" : "text-green-400"}`}>
                  {timer}s
                </span>
              </div>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Betting Status</p>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${bettingOpen ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {bettingOpen ? "OPEN" : "CLOSED"}
              </span>
            </div>
            <div className="bg-black rounded-xl px-4 py-2">
              <p className="text-zinc-400 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-400">₹{wallet.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <Trophy className="text-yellow-400 mx-auto mb-2" size={24} />
            <p className="text-zinc-500 text-sm">Last Win</p>
            <p className="text-xl font-bold text-yellow-400">₹{lastWin.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <TrendingUp className="text-green-400 mx-auto mb-2" size={24} />
            <p className="text-zinc-500 text-sm">Profit</p>
            <p className="text-xl font-bold text-green-400">₹{totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <Award className="text-blue-400 mx-auto mb-2" size={24} />
            <p className="text-zinc-500 text-sm">Biggest Win</p>
            <p className="text-xl font-bold text-blue-400">₹{biggestWin.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <RefreshCw className="text-purple-400 mx-auto mb-2" size={24} />
            <p className="text-zinc-500 text-sm">Win/Loss</p>
            <p className="text-xl font-bold">
              <span className="text-green-400">{stats.totalWins}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-red-400">{stats.totalLosses}</span>
            </p>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-linear-to-r from-zinc-900 to-black border border-green-500 rounded-3xl p-8 mb-8 text-center">
            <p className="text-zinc-400 mb-4">Drawn Card</p>
            <div className="text-9xl font-black mb-2">
              <span className={getCardColor(result.suit)}>
                {result.symbol}
              </span>
              <span className="text-white ml-4">{result.number}</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {result.suit.toUpperCase()} {result.number}
            </p>
          </div>
        )}

        {/* Bet Type Selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Bet Type</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setBetType("exact")}
              className={`py-3 rounded-xl font-bold transition-all ${
                betType === "exact" ? "bg-green-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              🎯 Exact Card
              <span className="block text-xs opacity-75">{PAYOUTS.exact}x</span>
            </button>
            <button
              onClick={() => setBetType("suit")}
              className={`py-3 rounded-xl font-bold transition-all ${
                betType === "suit" ? "bg-green-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              ♠ Suit Only
              <span className="block text-xs opacity-75">{PAYOUTS.suit}x</span>
            </button>
            <button
              onClick={() => setBetType("number")}
              className={`py-3 rounded-xl font-bold transition-all ${
                betType === "number" ? "bg-green-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              🔢 Number Only
              <span className="block text-xs opacity-75">{PAYOUTS.number}x</span>
            </button>
          </div>
        </div>

        {/* Suit Selection */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Select Suit</h2>
          <div className="grid grid-cols-4 gap-4">
            {SUITS.map((suit) => (
              <button
                key={suit.name}
                onClick={() => setSelectedSuit(suit.value)}
                className={`h-24 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                  selectedSuit === suit.value
                    ? `${suit.bg} ${suit.border} scale-105`
                    : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <span className={`text-5xl font-black ${suit.color}`}>{suit.symbol}</span>
                <p className={`text-sm font-bold mt-1 ${suit.color}`}>{suit.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Number Selection */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Select Number</h2>
          <div className="grid grid-cols-5 gap-3">
            {CARD_NUMBERS.map((num) => (
              <button
                key={num}
                onClick={() => setSelectedNumber(num)}
                className={`h-16 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 ${
                  selectedNumber === num
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
          <h2 className="text-xl font-bold mb-4">Place Your Bet</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-zinc-400 mb-2">Bet Amount (Min ₹10)</label>
              <input
                type="number"
                min="10"
                max={wallet}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 mb-3 focus:border-green-500 outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="bg-zinc-800 py-2 rounded-lg hover:bg-zinc-700 transition text-sm"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <button
                onClick={placeBet}
                disabled={isPlaying || !bettingOpen || (!selectedSuit && !selectedNumber)}
                className={`w-full h-full rounded-xl font-black text-xl transition-all transform hover:scale-105 ${
                  isPlaying || !bettingOpen || (!selectedSuit && !selectedNumber)
                    ? "bg-zinc-700 cursor-not-allowed"
                    : "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black"
                }`}
              >
                {isPlaying ? "DRAWING CARD..." : !bettingOpen ? "BETTING CLOSED" : "PLACE BET & DRAW"}
              </button>
            </div>
          </div>

          {/* Bet Info */}
          {(selectedSuit || selectedNumber) && betAmount && !isPlaying && bettingOpen && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-center text-sm">
                {betType === "exact" && selectedSuit && selectedNumber && (
                  <>Bet on: {selectedSuit.toUpperCase()} + {selectedNumber} | 
                  <span className="text-green-400 font-bold ml-2">Potential Win: ₹{(betAmount * PAYOUTS.exact).toLocaleString()}</span></>
                )}
                {betType === "suit" && selectedSuit && (
                  <>Bet on: {selectedSuit.toUpperCase()} suit only | 
                  <span className="text-green-400 font-bold ml-2">Potential Win: ₹{(betAmount * PAYOUTS.suit).toLocaleString()}</span></>
                )}
                {betType === "number" && selectedNumber && (
                  <>Bet on: Number {selectedNumber} | 
                  <span className="text-green-400 font-bold ml-2">Potential Win: ₹{(betAmount * PAYOUTS.number).toLocaleString()}</span></>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Recent Results</h2>
            <div className="flex gap-2 flex-wrap">
              {recentResults.map((result, index) => (
                <div key={index} className="bg-black rounded-xl px-4 py-2 text-center">
                  <span className={`text-2xl font-bold ${getCardColor(result.suit)}`}>{result.symbol}</span>
                  <span className="text-white ml-1 text-lg">{result.number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bet History */}
        {showHistory && (
          <div className="mt-8">
            <BetHistory game="card-game" refreshTrigger={historyRefresh} />
          </div>
        )}
      </div>
    </main>
  );
}