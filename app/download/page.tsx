"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Smartphone, Download, Zap, Shield, Gift, Users, Star, CheckCircle, QrCode, Copy, Check } from "lucide-react";
import Image from "next/image";

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "other">("android");

  useEffect(() => {
    // Detect device
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("android")) {
      setDeviceType("android");
    } else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
      setDeviceType("ios");
    } else {
      setDeviceType("other");
    }
  }, []);

  const downloadAPK = () => {
    // Create a download link for APK
    const link = document.createElement("a");
    link.href = "/api/download/apk"; // You'll need to serve the APK file
    link.download = "malik-xgo.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyDownloadLink = () => {
    navigator.clipboard.writeText("https://malikxgo.com/download");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    { icon: <Zap className="text-yellow-400" />, title: "Faster Gameplay", desc: "Optimized for mobile devices" },
    { icon: <Shield className="text-green-400" />, title: "Secure Platform", desc: "Safe & encrypted transactions" },
    { icon: <Gift className="text-purple-400" />, title: "Exclusive Bonuses", desc: "Special mobile-only rewards" },
    { icon: <Users className="text-blue-400" />, title: "Live Multiplayer", desc: "Play with thousands online" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full mb-4">
            <Smartphone className="text-green-400" size={18} />
            <span className="text-green-400 text-sm font-bold">MOBILE APP</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-linear-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            Malik.XGO App
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Faster gameplay, instant notifications and better rewards. Take your gaming experience anywhere!
          </p>
        </div>

        {/* Device Detection Banner */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-8 text-center">
          <p className="text-zinc-400">
            {deviceType === "android" && "📱 Android device detected! Download the APK below."}
            {deviceType === "ios" && "🍎 iOS version coming soon! Join waiting list."}
            {deviceType === "other" && "💻 Download APK for Android or scan QR code."}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left Side - Download Card */}
          <div className="bg-linear-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-green-500 to-green-700 mx-auto mb-4 flex items-center justify-center">
                <span className="text-5xl">🎮</span>
              </div>
              <h2 className="text-3xl font-black">Download App</h2>
              <p className="text-zinc-400 mt-2">Get the official Malik.XGO app</p>
            </div>

            {/* Android Download */}
            <div className="bg-black rounded-2xl p-6 mb-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Android APK</h3>
                  <p className="text-zinc-500 text-sm">Version 1.0.0 • 45 MB</p>
                </div>
              </div>
              
              <button
                onClick={downloadAPK}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-lg transition-all transform hover:scale-105 mb-3"
              >
                <Download size={22} /> DOWNLOAD APK
              </button>
              
              <p className="text-zinc-500 text-xs text-center">
                Compatible with Android 8.0 and above
              </p>
            </div>

            {/* How to Install */}
            <div className="bg-black rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield size={18} className="text-green-400" />
                How to Install APK
              </h3>
              <ol className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="bg-green-500/20 text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Download the APK file from above button</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-green-500/20 text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Go to Settings → Security → Enable "Unknown Sources"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-green-500/20 text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Open the downloaded APK file and tap "Install"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-green-500/20 text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <span>Open the app and login to start playing!</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Right Side - Features & QR */}
          <div className="space-y-6">
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center hover:border-green-500 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 mx-auto mb-3 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-zinc-500 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <QrCode size={48} className="mx-auto text-green-400 mb-3" />
              <h3 className="text-lg font-bold mb-2">Scan QR Code</h3>
              <p className="text-zinc-400 text-sm mb-4">Scan with your phone camera to download</p>
              <div className="bg-white p-3 rounded-2xl inline-block mx-auto">
                <div className="w-32 h-32 bg-black flex items-center justify-center">
                  {/* Replace with actual QR code image */}
                  <div className="w-full h-full bg-linear-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">📱</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Link */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-3">Share Download Link</h3>
              <div className="flex gap-2">
                <div className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-400 overflow-x-auto">
                  https://malikxgo.com/download
                </div>
                <button
                  onClick={copyDownloadLink}
                  className="bg-zinc-800 hover:bg-zinc-700 px-5 rounded-xl transition-colors"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
              </div>
              {copied && <p className="text-green-400 text-xs mt-2 text-center">Link copied to clipboard!</p>}
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-linear-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-black mb-2">iOS Version Coming Soon</h2>
          <p className="text-zinc-400 mb-4">Join the waiting list and be the first to know when the iOS app launches!</p>
          <div className="flex max-w-md mx-auto gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
            <button className="bg-green-500 text-black px-6 rounded-xl font-bold hover:bg-green-600 transition">Notify Me</button>
          </div>
        </div>
      </div>
    </main>
  );
}