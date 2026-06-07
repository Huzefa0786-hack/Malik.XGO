"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ResetPasswordRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");  // Changed from username to email
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return alert("Please enter your email");
    }

    try {
      setLoading(true);
      
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }  // Send email instead of username
      );
      
      alert(res.data.message || "OTP sent to your email!");
      localStorage.setItem("resetEmail", email);  // Store email
      router.push("/reset-password/verify-otp");
      
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-green-400 text-center mb-2">
          RESET PASSWORD
        </h1>
        <p className="text-zinc-500 text-center mb-8">
          Enter your email to receive OTP
        </p>

        <form onSubmit={handleSendOTP}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none transition-colors mb-6"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl transition-colors"
          >
            {loading ? "SENDING OTP..." : "SEND OTP"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl py-4 font-bold text-white transition-colors"
          >
            BACK TO LOGIN
          </button>
        </form>
      </div>
    </main>
  );
}
