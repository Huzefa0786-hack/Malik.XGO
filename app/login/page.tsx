"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      
      const res = await api.post("/auth/login", { email, password });
      
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("loggedIn", "true");
        
        alert("Login Successful!");
        router.push(redirectTo);
      } else {
        setError("No token received");
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-green-400 text-center mb-8">Malik.XGO LOGIN</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-400 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none mb-4"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none mb-6"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl transition-colors"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>

          <p className="text-center text-gray-400 mt-4">
            Don't have an account?
          </p>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl py-4 font-bold text-white transition-colors"
          >
            REGISTER
          </button>
        </form>
      </div>
    </main>
  );
}