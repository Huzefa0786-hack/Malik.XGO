'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="gradient p-2 rounded-xl">
          <Crown className="text-black" size={24} />
        </div>

        <h1 className="text-2xl font-bold tracking-wide">
          Matka<span className="text-green-400">.king</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="px-5 py-2 rounded-xl border border-zinc-700 hover:border-green-500 transition"
        >
          Login
        </Link>

        <Link
          href="/signup"
          className="px-5 py-2 rounded-xl gradient text-black font-bold hover:scale-105 transition"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  )
}