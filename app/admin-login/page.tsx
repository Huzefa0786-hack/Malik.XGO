"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Shield,
} from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleLogin = () => {
    // ADMIN LOGIN
    if (
      username === "Matka01" &&
      password === "Matka123"
    ) {
      localStorage.setItem(
        "admin",
        "true"
      );

      router.push("/admin");
    } else {
      alert(
        "Invalid Admin Login"
      );
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

        {/* ICON */}
        <div className="flex justify-center mb-6">

          <div className="bg-green-500/10 p-5 rounded-3xl">

            <Shield
              className="text-green-400"
              size={50}
            />

          </div>

        </div>

        {/* TITLE */}
        <h1 className="text-4xl font-black text-center mb-2">
          ADMIN LOGIN
        </h1>

        <p className="text-zinc-500 text-center mb-8">
          Malik.XGO Control Panel
        </p>

        {/* USERNAME */}
        <input
          type="text"
          placeholder="Admin Username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none mb-5 text-lg"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none mb-6 text-lg"
        />

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          className="w-full bg-green-600 hover:bg-green-500 transition rounded-2xl py-4 text-xl font-black"
        >
          LOGIN
        </button>

      </div>

    </main>
  );
}
