"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition">
          <ArrowLeft size={20} /> Back
        </Link>
        
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <h1 className="text-4xl font-black text-green-400 mb-6">Terms & Conditions</h1>
          <p className="text-zinc-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">1. Acceptance of Terms</h2>
              <p>By using Malik.XGO, you agree to these terms and conditions. If you do not agree, please do not use our platform.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">2. User Eligibility</h2>
              <p>You must be at least 18 years old to use this platform. By using Malik.XGO, you confirm that you are of legal age.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">3. Account Responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">4. Deposits & Withdrawals</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Minimum deposit: ₹100</li>
                <li>Minimum withdrawal: ₹500</li>
                <li>Maximum withdrawal: ₹50,000 per transaction</li>
                <li>Processing time: 24-48 hours</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">5. Responsible Gaming</h2>
              <p>We promote responsible gaming. You can set deposit limits, self-exclude, or take a break at any time.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">6. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fraud or cheating</li>
                <li>Money laundering</li>
                <li>Using multiple accounts</li>
                <li>Abusing bonuses or promotions</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}