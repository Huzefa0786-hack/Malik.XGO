"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");  // Changed from username to name
  const [email, setEmail] = useState(""); // Added email field
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      return alert("Fill all fields");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,        // Send name (not username)
          email,       // Send email
          password,    // Send password
        }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("loggedIn", "true");

      alert("Register Success");
      router.push("/");

    } catch (err: any) {
      console.log(err);
      alert(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Register Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-10">
        <h1 className="text-5xl font-black text-green-400 text-center mb-2">
          MATKA.KING
        </h1>
        <p className="text-zinc-500 text-center mb-10">
          Create Account
        </p>

        <form onSubmit={handleRegister}>
          {/* NAME */}
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-6 outline-none focus:border-green-500 transition-colors"
            required
          />

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-6 outline-none focus:border-green-500 transition-colors"
            required
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-8 outline-none focus:border-green-500 transition-colors"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed rounded-2xl py-4 font-black text-xl transition-colors"
          >
            {loading ? "Loading..." : "REGISTER"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4">
          Already have an account?
        </p>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl py-4 font-bold text-white transition-colors"
        >
          LOGIN
        </button>
      </div>
    </main>
  );
}