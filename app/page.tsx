"use client";

import Link from "next/link";
import { SpeedInsights } from "@vercel/speed-insights/next"

import {
  Wallet,
  LogIn,
  UserPlus,
  Trophy,
  Sparkles,
  CircleDollarSign,
  LogOut,
} from "lucide-react";

import { useEffect, useState } from "react";

type UserType = {
  username: string;
  email: string;
  wallet: number;
};

export default function HomePage() {
 const [user, setUser] = useState<UserType | null>(
  null
);

const [wallet, setWallet] = useState(0);
  useEffect(() => {
  const storedUser = localStorage.getItem(
    "user"
  );

  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);

    setUser(parsedUser);

    setWallet(parsedUser.wallet || 0);
  }
}, []);

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.reload();
  };

  const games = [
  {
    title: "Num Cards",
    desc: "Lowest card wins the round",
    link: "/numcards",
    status: "LIVE",
  },

  {
    title: "Spinning Wheel",
    desc: "Spin and win rewards",
    link: "/spin",
    status: "HOT",
  },

  {
    title: " Skyup",
    desc: "Sky multiplayer game ",
    link: "/sky",
    status: "Most Winning",
  },
];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
    <Link
  href="/profile"
  className="bg-zinc-900 hover:bg-zinc-800 px-6 py-3 rounded-2xl font-black"
>
  Profile
</Link>
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div>
            <h1 className="text-4xl font-black text-green-400">
              MATKA.KING
            </h1>

            <p className="text-zinc-500 text-sm">
              Real Multiplayer Gaming
            </p>
          </div>

          {/* Right Side */}
          {!user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition"
              >
                <LogIn size={18} />
                Login
              </Link>

              <Link
                href="/signup"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition"
              >
                <UserPlus size={18} />
                Signup
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Wallet */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3">
                <Wallet
                  className="text-green-400"
                  size={22}
                />

                <div>
                  <p className="text-xs text-zinc-500">
                    Wallet
                  </p>

                  <h3 className="font-bold text-green-400">
                    ₹{wallet}
                  </h3>
                </div>
              </div>

              {/* Username */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3">
                <p className="text-xs text-zinc-500">
                  Welcome
                </p>

                <h3 className="font-bold">
                  {user.username}
                </h3>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 transition px-5 py-3 rounded-2xl flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-green-500 text-green-400 mb-6">
            <Sparkles size={18} />
            Live Betting Experience
          </div>

          <h2 className="text-6xl font-black leading-tight">
            PLAY.
            <br />
            WIN.
            <br />
            <span className="text-green-400">
              EARN.
            </span>
          </h2>

          <p className="mt-6 text-zinc-400 text-lg max-w-xl">
            Join multiplayer betting games with
            real-time gameplay, wallet system,
            live matches, and exciting rewards.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              href="/deposit"
              className="px-7 py-4 rounded-2xl bg-green-600 hover:bg-green-500 transition font-bold text-lg"
            >
              Deposit
            </Link>

            <Link
              href="/withdraw"
              className="px-7 py-4 rounded-2xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition font-bold text-lg"
            >
              Withdraw
            </Link>
          </div>
        </div>
        
        {/* Wallet Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400">
                Wallet Balance
              </p>

              <h3 className="text-5xl font-black text-green-400 mt-2">
                ₹{wallet}
              </h3>
            </div>

            <div className="bg-zinc-900 p-5 rounded-2xl">
              <Wallet
                className="text-green-400"
                size={38}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <Link
              href="/deposit"
              className="bg-green-600 hover:bg-green-500 rounded-2xl p-5 transition"
            >
              <CircleDollarSign size={32} />

              <p className="mt-3 font-bold text-lg">
                Deposit
              </p>
            </Link>

            <Link
              href="/withdraw"
              className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-2xl p-5 transition"
            >
              <Wallet size={32} />

              <p className="mt-3 font-bold text-lg">
                Withdraw
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-3 mb-10">
          <Trophy
            className="text-green-400"
            size={30}
          />

          <h2 className="text-4xl font-black">
            Games
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <div
              key={index}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-green-500 transition"
            >
              <div className="inline-block px-4 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold mb-6">
                {game.status}
              </div>

              <h3 className="text-3xl font-black mb-3">
                {game.title}
              </h3>

              <p className="text-zinc-400 mb-8">
                {game.desc}
              </p>

              {game.link !== "#" ? (
                <Link
                  href={game.link}
                  className="inline-block px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 transition font-bold"
                >
                  Play Now
                </Link>
              ) : (
                <button className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-400">
                  Coming Soon
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}