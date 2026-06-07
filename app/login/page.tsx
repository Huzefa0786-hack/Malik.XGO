"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return alert("Fill all fields");
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password
      });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("loggedIn", "true");
      
      alert("Login Successful");
      router.push("/");
    } catch (err: any) {
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
router.push(redirectTo);
      alert(err?.response?.data?.error || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-green-400 text-center mb-8">Malik.XGO LOGIN</h1>
        
        <form onSubmit={login}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none mb-4" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-black border border-zinc-700 text-white focus:border-green-500 outline-none mb-6" required />
          
          <button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 text-black font-black py-4 rounded-xl">
            {loading ? "PLEASE WAIT..." : "LOGIN"}
          </button>
          
          <p className="text-center text-gray-400 mt-4">Don't have an account?</p>
          <button type="button" onClick={() => router.push("/register")} className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl py-4 font-bold">REGISTER</button>
        </form>
      </div>
    </main>
  );
}
