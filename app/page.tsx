"use client";

import Link from "next/link";
import Image from "next/image";

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

export default function HomePage() {
  const [wallet, setWallet] = useState(5000);

  const [menuOpen, setMenuOpen] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState(2847);

  const [todayWins, setTodayWins] = useState(128493);

  const [liveWinners, setLiveWinners] = useState([
    "Rahul won ₹5,400",
    "Aryan won ₹12,000",
    "Kabir won ₹3,800",
    "Rohit won ₹8,700",
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const names = [
        "Rahul",
        "Aryan",
        "Kabir",
        "Rohit",
        "Ayaan",
        "Vikas",
      ];

      const name =
        names[
          Math.floor(
            Math.random() * names.length
          )
        ];

      const amount =
        Math.floor(
          Math.random() * 10000
        ) + 1000;

      setLiveWinners((prev) => [
        `${name} won ₹${amount}`,
        ...prev.slice(0, 7),
      ]);

      setOnlineUsers(
        (prev) =>
          prev +
          Math.floor(
            Math.random() * 3
          )
      );
    }, 4000);

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown
              size={34}
              className="text-green-400"
            />

            <div>
              <h1 className="text-2xl font-black text-green-400">
                MATKA.KING
              </h1>

              <p className="text-zinc-500 text-xs">
                Premium Gaming Platform
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/deposit"
              className="bg-green-500 text-black font-bold px-5 py-3 rounded-xl"
            >
              Deposit
            </Link>

            <Link
              href="/withdraw"
              className="bg-blue-500 text-white font-bold px-5 py-3 rounded-xl"
            >
              Withdraw
            </Link>

            <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-xl flex items-center gap-2">
              <Wallet
                size={18}
                className="text-green-400"
              />

              <span className="font-bold text-green-400">
                ₹{wallet}
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            className="md:hidden"
          >
            <Menu />
          </button>
        </div>
      </header>

     {/* PAGE CONTENT STARTS HERE */}

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
              <span className="text-green-400">
                     
                {" "}
                WIN.
              </span>
              MATKA.👑
            </h1>

            <p className="text-zinc-400 text-lg mb-6">
              Premium gaming experience with instant deposits,
              instant withdrawals and exciting rewards.
            </p>

            <div className="flex flex-wrap gap-4">

              <Link
                href="/numcards"
                className="bg-green-500 text-black font-black px-8 py-4 rounded-2xl"
              >
                PLAY NOW
              </Link>

              <Link
                href="/promotion"
                className="bg-zinc-800 border border-zinc-700 px-8 py-4 rounded-2xl font-black"
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

          <p className="text-zinc-500">
            Online Users
          </p>

          <h2 className="text-3xl font-black text-green-400">
            {onlineUsers}
          </h2>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <Trophy className="text-yellow-400 mb-4" />

          <p className="text-zinc-500">
            Today's Wins
          </p>

          <h2 className="text-3xl font-black text-yellow-400">
            ₹{todayWins.toLocaleString()}
          </h2>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <Gift className="text-purple-400 mb-4" />

          <p className="text-zinc-500">
            Bonuses
          </p>

          <h2 className="text-3xl font-black text-purple-400">
            120+
          </h2>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <Shield className="text-blue-400 mb-4" />

          <p className="text-zinc-500">
            Secure Platform
          </p>

          <h2 className="text-3xl font-black text-blue-400">
            100%
          </h2>

        </div>

      </div>

      {/* DOWNLOAD APP BANNER */}

      <div className="bg-green-500 text-black rounded-3xl p-8 mb-6">

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          <div>

            <h2 className="text-3xl font-black mb-2">
              Download MATKA.KING App
            </h2>

            <p className="font-semibold">
              Faster gameplay, instant notifications and better rewards.
            </p>

          </div>

          <button className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2">

            <Download size={20} />

            DOWNLOAD NOW

          </button>

        </div>

      </div>

      {/* ANNOUNCEMENT BAR */}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 flex items-center gap-3">

        <Bell className="text-green-400" />

        <p className="font-bold text-green-400">
          Welcome Bonus Available • Instant Withdrawals Enabled • Daily Cashback Active
        </p>

      </div>

            {/* GAMES SECTION */}

      <div className="mb-8">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-4xl font-black">
              Popular Games
            </h2>

            <p className="text-zinc-500 mt-1">
              Choose your favorite game and start winning.
            </p>

          </div>

          <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">

            <span className="text-green-400 font-bold">
              LIVE GAMES
            </span>

          </div>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* NUMCARDS */}

          <Link href="/numcards">

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer">

              <div className="h-40 bg-green-500 flex items-center justify-center">

                <span className="text-6xl font-black text-black">
                  🏆
                </span>

              </div>

              <div className="p-6">

                <h3 className="text-3xl font-black mb-2">
                  NumCards
                </h3>

                <p className="text-zinc-400 mb-4">
                  Predict numbers and win huge multipliers.
                </p>

                <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl">
                  PLAY NOW
                </button>

              </div>

            </div>

          </Link>

          {/* MINES */}

          <Link href="/mines">

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer">

              <div className="h-40 bg-red-500 flex items-center justify-center">

                <span className="text-6xl">
                  💣
                </span>

              </div>

              <div className="p-6">

                <h3 className="text-3xl font-black mb-2">
                  Mines
                </h3>

                <p className="text-zinc-400 mb-4">
                  Avoid bombs and increase your multiplier.
                </p>

                <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl">
                  PLAY NOW
                </button>

              </div>

            </div>

          </Link>

 
          {/* AVIATOR */}

          <Link href="/sky">

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer">

              <div className="h-40 bg-blue-500 flex items-center justify-center">

                <span className="text-6xl">
                  ✈️
                </span>

              </div>

              <div className="p-6">

                <h3 className="text-3xl font-black mb-2">
                  Sky
                </h3>

                <p className="text-zinc-400 mb-4">
                  Cash out before the plane flies away.
                </p>

                <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl">
                  PLAY NOW
                </button>

              </div>

            </div>

          </Link>

          {/* SPIN */}

          <Link href="/spin">

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer">

              <div className="h-40 bg-yellow-500 flex items-center justify-center">

                <span className="text-6xl">
                  🎡
                </span>

              </div>

              <div className="p-6">

                <h3 className="text-3xl font-black mb-2">
                  Spin Wheel
                </h3>

                <p className="text-zinc-400 mb-4">
                  Spin and win massive rewards instantly.
                </p>

                <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl">
                  PLAY NOW
                </button>

              </div>

            </div>

          </Link>

          {/* LOTTERY */}

          <Link href="/lottery">

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer">

              <div className="h-40 bg-purple-500 flex items-center justify-center">

                <span className="text-6xl">
                  🎟️
                </span>

              </div>

              <div className="p-6">

                <h3 className="text-3xl font-black mb-2">
                  Lottery
                </h3>

                <p className="text-zinc-400 mb-4">
                  Daily jackpots and lucky draw rewards.
                </p>

                <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl">
                  PLAY NOW
                </button>

              </div>

            </div>

          </Link>

         {/* PLINKO */}

          <Link href="/Plinko">

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-green-500 transition-all cursor-pointer">

              <div className="h-40 bg-blue-500 flex items-center justify-center">

                <span className="text-6xl">
                  ⚽
                </span>

              </div>

              <div className="p-6">

                <h3 className="text-3xl font-black mb-2">
                  Plinko
                </h3>

                <p className="text-zinc-400 mb-4">
                  Cash out before the plane flies away.
                </p>

                <button className="w-full bg-green-500 text-black font-black py-3 rounded-xl">
                  PLAY NOW
                </button>

              </div>

            </div>

          </Link>

        </div>
        
      </div>

            {/* LIVE WINNERS */}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">

        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-3xl font-black">
              Live Winners
            </h2>

            <div className="bg-red-500 px-4 py-2 rounded-xl animate-pulse font-black">
              LIVE
            </div>

          </div>

          <div className="space-y-4">

            {liveWinners.map((winner, index) => (

              <div
                key={index}
                className="bg-black border border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
              >

                <div className="flex items-center gap-3">

                  <Trophy className="text-yellow-400" />

                  <span className="font-bold">
                    {winner}
                  </span>

                </div>

                <span className="text-green-400 font-bold">
                  SUCCESS
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* REFERRAL BONUS */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <Gift
            size={50}
            className="text-green-400 mb-4"
          />

          <h2 className="text-3xl font-black mb-3">
            Refer & Earn
          </h2>

          <p className="text-zinc-400 mb-6">
            Invite friends and earn rewards on every deposit.
          </p>

          <button className="w-full bg-green-500 text-black font-black py-4 rounded-2xl">
            GET REFERRAL LINK
          </button>

        </div>

      </div>

      {/* PROMOTION BANNERS */}

      <div className="grid md:grid-cols-2 gap-6 mb-8">

        <div className="bg-green-500 text-black rounded-3xl p-8">

          <Star
            size={45}
            className="mb-4"
          />

          <h2 className="text-3xl font-black mb-3">
            Welcome Bonus
          </h2>

          <p className="font-semibold mb-6">
            Get up to ₹5,000 bonus on your first deposit.
          </p>

          <button className="bg-black text-white px-6 py-3 rounded-xl font-black">
            CLAIM BONUS
          </button>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <TrendingUp
            size={45}
            className="text-green-400 mb-4"
          />

          <h2 className="text-3xl font-black mb-3">
            VIP Rewards
          </h2>

          <p className="text-zinc-400 mb-6">
            Unlock exclusive cashback and premium bonuses.
          </p>

          <button className="bg-green-500 text-black px-6 py-3 rounded-xl font-black">
            VIEW VIP
          </button>

        </div>

      </div>

      {/* FOOTER */}

      <footer className="border-t border-zinc-800 pt-8 pb-10">

        <div className="grid md:grid-cols-4 gap-8">

          <div>

            <h2 className="text-2xl font-black text-green-400 mb-3">
              MATKA.KING
            </h2>

            <p className="text-zinc-500">
              Premium gaming platform with fast deposits,
              instant withdrawals and exciting rewards.
            </p>

          </div>

          <div>

            <h3 className="font-black mb-4">
              Games
            </h3>

            <div className="space-y-2 text-zinc-400">

              <p>NumCards</p>
              <p>Mines</p>
              <p>Sky</p>
              <p>Spin Wheel</p>

            </div>

          </div>

          <div>

            <h3 className="font-black mb-4">
              Support
            </h3>

            <div className="space-y-2 text-zinc-400">

              <p>Help Center</p>
              <p>Contact Us</p>
              <p>FAQ</p>
              <p>Live Chat</p>

            </div>

          </div>

          <div>

            <h3 className="font-black mb-4">
              Legal
            </h3>

            <div className="space-y-2 text-zinc-400">

              <p>Terms</p>
              <p>Privacy</p>
              <p>Responsible Gaming</p>
              <p>Policy</p>

            </div>

          </div>

        </div>

        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-zinc-500">

          © 2026 MATKA.KING — All Rights Reserved

        </div>

      </footer>

      </div>
    </main>
  );
}