"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition">
          <ArrowLeft size={20} /> Back
        </Link>
        
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <h1 className="text-4xl font-black text-green-400 mb-6">Privacy Policy</h1>
          <p className="text-zinc-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">1. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, email, and contact information</li>
                <li>Transaction history</li>
                <li>Game activity</li>
                <li>Device information</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide our services</li>
                <li>To process transactions</li>
                <li>To send notifications</li>
                <li>To improve user experience</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">3. Data Security</h2>
              <p>We implement industry-standard security measures to protect your data.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-green-400 mb-3">4. Contact Us</h2>
              <p>Email: support@malikxgo.com</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}