"use client";

import { useState } from "react";
import Link from "next/link";
import BetHistory from "../components/BetHistory";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default function HistoryPage() {
  const [selectedGame, setSelectedGame] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-green-400 flex items-center gap-2">
            <BarChart3 /> Bet History
          </h1>
        </div>

        <BetHistory game={selectedGame} refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
