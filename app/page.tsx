"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Trophy,
  Crown,
  Gift,
  Download,
  Users,
  Star,
  TrendingUp,
  Shield,
  Bell,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

export default function HomePage() {
  const router = useRouter();
  
  interface User {
    name: string;
    uid: string;
    wallet: number;
    email?: string;
    id?: string;
  }

  const [user, setUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(2847);
  const [todayWins, setTodayWins] = useState(128493);
  const [loading, setLoading] = useState(true);

  // Fetch user data and verify token
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (!token || !savedUser) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    setLoading(false);
    
    // Optional: Fetch latest wallet balance from backend
    fetchWalletBalance(token);
  }, [router]);

  const fetchWalletBalance = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5000/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(prev => prev ? { ...prev, wallet: response.data.balance } : null);
        // Update localStorage
        const updatedUser = { ...user, wallet: response.data.balance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  };

  const [liveWinners, setLiveWinners] = useState([
    "Rahul won ₹5,400",
    "Aryan won ₹12,000",
    "Kabir won ₹3,800",
    "Rohit won ₹8,700",
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const names = ["Rahul", "Aryan", "Kabir", "Rohit", "Ayaan", "Vikas"];
      const name = names[Math.floor(Math.random() * names.length)];
      const amount = Math.floor(Math.random() * 10000) + 1000;

      setLiveWinners((prev) => [`${name} won ₹${amount}`, ...prev.slice(0, 7)]);
      setOnlineUsers((prev) => prev + Math.floor(Math.random() * 3));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Crown size={48} className="text-green-400 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown size={34} className="text-green-400" />
            <div>
              <h1 className="text-2xl font-black text-green-400">Malik.XGO</h1>
              <p className="text-zinc-500 text-xs">Premium Gaming Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-12 h-12 rounded-full bg-green-500 text-black font-black"
              >
                {user?.name?.charAt(0)?.toUpperCase() || "👤"}
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl z-50">
                  <h3 className="text-xl font-bold text-green-400">
                    {user?.name}
                  </h3>
                  <p className="text-zinc-400 text-sm">UID: {user?.uid || "N/A"}</p>
                  <p className="text-zinc-400 text-sm">Email: {user?.email || "N/A"}</p>

                  <button
                    onClick={() => router.push("/profile")}
                    className="w-full mt-2 bg-green-500 text-black py-3 rounded-xl font-bold"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => router.push("/reset-password")}
                    className="w-full mt-2 bg-zinc-800 py-3 rounded-xl"
                  >
                    Reset Password
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full mt-2 bg-red-600 py-3 rounded-xl"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/deposit"
              className="bg-green-500 text-black font-bold px-5 py-3 rounded-xl hover:bg-green-600 transition-colors"
            >
              Deposit
            </Link>

            <Link
              href="/withdraw"
              className="bg-blue-500 text-white font-bold px-5 py-3 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Withdraw
            </Link>

            <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-xl flex items-center gap-2">
              <Wallet size={18} className="text-green-400" />
              <span className="font-bold text-green-400">
                ₹{user?.wallet?.toLocaleString() ?? "0"}
              </span>
            </div>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            <Menu />
          </button>
        </div>
      </header>

      {/* REST OF YOUR PAGE CONTENT - Keeping your existing design */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* HERO BANNER */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full mb-4">
                <Crown size={18} className="text-green-400" />
                <span className="text-green-400 font-bold">
                  INDIA'S FASTEST GROWING PLATFORM
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
                PLAY.
                <span className="text-green-400"> WIN.</span> MALIK.XGO👑
              </h1>

              <p className="text-zinc-400 text-lg mb-6">
                Premium gaming experience with instant deposits, instant
                withdrawals and exciting rewards.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/numcards"
                  className="bg-green-500 text-black font-black px-8 py-4 rounded-2xl hover:bg-green-600 transition-colors"
                >
                  PLAY NOW
                </Link>

                <Link
                  href="/promotion"
                  className="bg-zinc-800 border border-zinc-700 px-8 py-4 rounded-2xl font-black hover:bg-zinc-700 transition-colors"
                >
                  PROMOTIONS
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE STATISTICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <Users className="text-green-400 mb-4" />
            <p className="text-zinc-500">Online Users</p>
            <h2 className="text-3xl font-black text-green-400">{onlineUsers}</h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <Gift className="text-purple-400 mb-4" />
            <p className="text-zinc-500">Bonuses</p>
            <h2 className="text-3xl font-black text-purple-400">120+</h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <Shield className="text-blue-400 mb-4" />
            <p className="text-zinc-500">Secure Platform</p>
            <h2 className="text-3xl font-black text-blue-400">100%</h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <Trophy className="text-yellow-400 mb-4" />
            <p className="text-zinc-500">Today's Wins</p>
            <h2 className="text-3xl font-black text-yellow-400">₹{todayWins.toLocaleString()}</h2>
          </div>
        </div>

        {/* DOWNLOAD APP BANNER */}
        <div className="bg-green-500 text-black rounded-3xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black mb-2">Download Malik.XGO App</h2>
              <p className="font-semibold">
                Faster gameplay, instant notifications and better rewards.
              </p>
            </div>

            <button className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-zinc-900 transition-colors">
              <Download size={20} />
              DOWNLOAD NOW
            </button>
          </div>
        </div>

        {/* ANNOUNCEMENT BAR */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 flex items-center gap-3 overflow-x-auto">
          <Bell className="text-green-400 shrink-0" />
          <p className="font-bold text-green-400 whitespace-nowrap">
            Welcome Bonus Available • Instant Withdrawals Enabled • Daily
            Cashback Active • 24/7 Customer Support
          </p>
        </div>

        {/* GAMES SECTION - Keep your existing game grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-black">Popular Games</h2>
              <p className="text-zinc-500 mt-1">
                Choose your favorite game and start winning.
              </p>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
              <span className="text-green-400 font-bold">LIVE GAMES</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* COLOR TRADE */}
<Link href="/color-trade">
  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer group">
    <div className="h-40 bg-linear-to-r from-green-500 to-purple-500 flex items-center justify-center">
      <span className="text-6xl">🔢</span>
    </div>
    <div className="p-6">
      <h3 className="text-3xl font-black mb-2">Color Trade</h3>
      <p className="text-zinc-400 mb-4">Predict colors, numbers & sizes. Win up to 9x!</p>
      <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl">PLAY NOW</button>
    </div>
  </div>
</Link>

            {/* NUMCARDS */}
            <Link href="/numcards">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer group">
                <div className="h-40 bg-green-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-6xl font-black text-black">🏆</span>
                </div>
                <div className="p-6">
                  <h3 className="text-3xl font-black mb-2">NumCards</h3>
                  <p className="text-zinc-400 mb-4">
                    Predict numbers and win huge multipliers.
                  </p>
                  <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl hover:bg-green-600 transition-colors">
                    PLAY NOW
                  </button>
                </div>
              </div>
            </Link>

            {/* MINES */}
            <Link href="/mines">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer group">
                <div className="h-40 bg-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-6xl">💣</span>
                </div>
                <div className="p-6">
                  <h3 className="text-3xl font-black mb-2">Mines</h3>
                  <p className="text-zinc-400 mb-4">
                    Avoid bombs and increase your multiplier.
                  </p>
                  <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl hover:bg-green-600 transition-colors">
                    PLAY NOW
                  </button>
                </div>
              </div>
            </Link>

            {/* AVIATOR */}
            <Link href="/sky">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer group">
                <div className="h-40 bg-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-6xl">🚀</span>
                </div>
                <div className="p-6">
                  <h3 className="text-3xl font-black mb-2">Sky</h3>
                  <p className="text-zinc-400 mb-4">
                    Cash out before the plane flies away.
                  </p>
                  <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl hover:bg-green-600 transition-colors">
                    PLAY NOW
                  </button>
                </div>
              </div>
            </Link>

            {/* SPIN */}
            <Link href="/spin">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer group">
                <div className="h-40 bg-yellow-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-6xl">🎡</span>
                </div>
                <div className="p-6">
                  <h3 className="text-3xl font-black mb-2">Spin Wheel</h3>
                  <p className="text-zinc-400 mb-4">
                    Spin and win massive rewards instantly.
                  </p>
                  <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl hover:bg-green-600 transition-colors">
                    PLAY NOW
                  </button>
                </div>
              </div>
            </Link>

            {/* LOTTERY */}
            <Link href="/lottery">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer group">
                <div className="h-40 bg-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-6xl">🎟️</span>
                </div>
                <div className="p-6">
                  <h3 className="text-3xl font-black mb-2">Lottery</h3>
                  <p className="text-zinc-400 mb-4">
                    Daily jackpots and lucky draw rewards.
                  </p>
                  <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl hover:bg-green-600 transition-colors">
                    PLAY NOW
                  </button>
                </div>
              </div>
            </Link>

            {/* PLINKO */}
            <Link href="/plinko">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer group">
                <div className="h-40 bg-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-6xl">⚽</span>
                </div>
                <div className="p-6">
                  <h3 className="text-3xl font-black mb-2">Plinko</h3>
                  <p className="text-zinc-400 mb-4">
                    Drop the ball and win big multipliers.
                  </p>
                  <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl hover:bg-green-600 transition-colors">
                    PLAY NOW
                  </button>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* LIVE WINNERS & REFERRAL SECTION */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black">Live Winners</h2>
              <div className="bg-red-500 px-4 py-2 rounded-xl animate-pulse font-black">
                LIVE
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {liveWinners.map((winner, index) => (
                <div
                  key={index}
                  className="bg-black border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-400" />
                    <span className="font-bold">{winner}</span>
                  </div>
                  <span className="text-green-400 font-bold">SUCCESS</span>
                </div>
              ))}
            </div>
          </div>

          {/* REFERRAL BONUS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <Gift size={50} className="text-green-400 mb-4" />
            <h2 className="text-3xl font-black mb-3">Refer & Earn</h2>
            <p className="text-zinc-400 mb-6">
              Invite friends and earn 20% commission on every deposit.
            </p>
            <button className="w-full bg-green-500 text-black font-black py-4 rounded-2xl hover:bg-green-600 transition-colors">
              GET REFERRAL LINK
            </button>
            <p className="text-xs text-zinc-500 mt-4 text-center">
              Your Referral Code: {user?.uid || "LOADING"}
            </p>
          </div>
        </div>

        {/* PROMOTION BANNERS */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-linear-to-r from-green-600 to-green-800 text-black rounded-3xl p-8">
            <Star size={45} className="mb-4 text-yellow-400" />
            <h2 className="text-3xl font-black mb-3">Welcome Bonus</h2>
            <p className="font-semibold mb-6">
              Get up to ₹5,000 bonus on your first deposit.
            </p>
            <button className="bg-black text-white px-6 py-3 rounded-xl font-black hover:bg-zinc-900 transition-colors">
              CLAIM BONUS
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <TrendingUp size={45} className="text-green-400 mb-4" />
            <h2 className="text-3xl font-black mb-3">VIP Rewards</h2>
            <p className="text-zinc-400 mb-6">
              Unlock exclusive cashback and premium bonuses up to 50%.
            </p>
            <button className="bg-green-500 text-black px-6 py-3 rounded-xl font-black hover:bg-green-600 transition-colors">
              VIEW VIP
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-zinc-800 pt-8 pb-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h2 className="text-2xl font-black text-green-400 mb-3">
                Malik.XGO
              </h2>
              <p className="text-zinc-500">
                Premium gaming platform with fast deposits, instant withdrawals
                and exciting rewards.
              </p>
            </div>

            <div>
              <h3 className="font-black mb-4">Games</h3>
              <div className="space-y-2 text-zinc-400">
                <p>NumCards</p>
                <p>Mines</p>
                <p>Sky</p>
                <p>Spin Wheel</p>
                <p>Lottery</p>
                <p>Plinko</p>
              </div>
            </div>

            <div>
              <h3 className="font-black mb-4">Support</h3>
              <div className="space-y-2 text-zinc-400">
                <p>Help Center</p>
                <p>Contact Us</p>
                <p>FAQ</p>
                <p>Live Chat</p>
                <p>24/7 Support</p>
              </div>
            </div>

            <div>
              <h3 className="font-black mb-4">Legal</h3>
              <div className="space-y-2 text-zinc-400">
                <p>Terms & Conditions</p>
                <p>Privacy Policy</p>
                <p>Responsible Gaming</p>
                <p>Anti-Fraud Policy</p>
                <p>AML Policy</p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-zinc-500">
            © 2026 Malik.XGO — All Rights Reserved
          </div>
        </footer>
      </div>
    </main>
  );
}
