"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");    // Changed from username to email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return alert("Fill all fields");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,     // Send email (not username)
          password,
        }
      );
      
      console.log(res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("loggedIn", "true");

      alert("Login Successful");
      router.push("/");

    } catch (err: any) {
      alert(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-green-400 text-center mb-8">
          MATKA.KING LOGIN
        </h1>

        <form onSubmit={login}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none transition-colors"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none transition-colors"
              required
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-sm text-green-500 hover:text-green-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl transition-colors"
            >
              {loading ? "PLEASE WAIT..." : "LOGIN"}
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
          </div>
        </form>
      </div>
    </main>
  );
}