"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      return alert("Please enter OTP");
    }

    const username = localStorage.getItem("resetUsername");
    
    if (!username) {
      alert("Session expired. Please try again.");
      router.push("/reset-password");
      return;
    }

    try {
      setLoading(true);
      
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        { username, otp }
      );
      
      alert("OTP verified successfully!");
      
      // Store OTP token for password reset
      localStorage.setItem("resetToken", res.data.resetToken);
      
      // Redirect to set new password page
      router.push("/reset-password/set-new-password");
      
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const username = localStorage.getItem("resetUsername");
    
    if (!username) {
      alert("Session expired. Please try again.");
      router.push("/reset-password");
      return;
    }

    try {
      setLoading(true);
      
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { username }
      );
      
      alert(res.data.message || "OTP resent successfully!");
      
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to resend OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-green-400 text-center mb-2">
          VERIFY OTP
        </h1>
        <p className="text-zinc-500 text-center mb-8">
          Enter the 6-digit OTP sent to your email
        </p>

        <form onSubmit={handleVerifyOTP}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none transition-colors mb-6 text-center text-2xl tracking-widest"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl transition-colors"
          >
            {loading ? "VERIFYING..." : "VERIFY OTP"}
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl py-4 font-bold text-white transition-colors"
          >
            RESEND OTP
          </button>

          <button
            type="button"
            onClick={() => router.push("/reset-password")}
            className="w-full mt-4 text-zinc-500 hover:text-zinc-400 text-sm transition-colors"
          >
            ← Back to username entry
          </button>
        </form>
      </div>
    </main>
  );
}
