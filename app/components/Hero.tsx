'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-green-500/20 blur-[120px] rounded-full top-10 left-10"></div>

      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full bottom-10 right-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl"
      >
        <div className="inline-block mb-6 px-4 py-2 rounded-full border border-green-500/40 bg-green-500/10 text-green-400 text-sm">
          PREMIUM MATKA PLATFORM
        </div>

        <h1 className="text-6xl md:text-8xl font-black leading-tight">
          PLAY.
          <span className="text-green-400"> WIN.</span>
          <br />
          RULE THE GAME.
        </h1>

        <p className="text-zinc-400 mt-8 text-lg max-w-2xl mx-auto leading-relaxed">
          Experience the next generation gaming platform with live gameplay,
          instant wallet system, premium UI and real-time multiplayer action.
        </p>

        <div className="flex items-center justify-center gap-5 mt-10 flex-wrap">
          <Link
            href="/signup"
            className="gradient text-black font-bold px-8 py-4 rounded-2xl text-lg glow hover:scale-105 transition"
          >
            Start Playing
          </Link>

          <Link
            href="/login"
            className="border border-zinc-700 px-8 py-4 rounded-2xl text-lg hover:border-green-500 transition"
          >
            Login
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
