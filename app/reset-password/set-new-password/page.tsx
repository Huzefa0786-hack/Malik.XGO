"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SetNewPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      return alert("Please fill all fields");
    }

    if (newPassword !== confirmPassword) {
      return alert("Passwords do not match");
    }

    if (newPassword.length < 6) {
      return alert("Password must be at least 6 characters");
    }

    const username = localStorage.getItem("resetUsername");
    const resetToken = localStorage.getItem("resetToken");
    
    if (!username || !resetToken) {
      alert("Session expired. Please try again.");
      router.push("/reset-password");
      return;
    }

    try {
      setLoading(true);
      
      const res = await axios.post(
        "http://localhost:5002/api/auth/reset-password",
        { 
          username, 
          newPassword,
          resetToken 
        }
      );
      
      alert(res.data.message || "Password reset successfully!");
      
      // Clear reset data
      localStorage.removeItem("resetUsername");
      localStorage.removeItem("resetToken");
      
      // Redirect to login
      router.push("/login");
      
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-green-400 text-center mb-2">
          NEW PASSWORD
        </h1>
        <p className="text-zinc-500 text-center mb-8">
          Create a strong password
        </p>

        <form onSubmit={handleSetNewPassword}>
          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none transition-colors pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none transition-colors mb-6"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl transition-colors"
          >
            {loading ? "RESETTING..." : "RESET PASSWORD"}
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
