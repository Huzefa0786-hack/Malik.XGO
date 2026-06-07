"use client";

import {
  useEffect,
  useState,
} from "react";

export default function ProfilePage() {

  const [user, setUser] =
    useState<any>(null);

  useEffect(() => {

    const savedUser =
      JSON.parse(
        localStorage.getItem(
          "user"
        ) || "{}"
      );

    setUser(savedUser);

  }, []);

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-3xl mx-auto">

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-10">

          <h1 className="text-5xl font-black text-green-400 mb-10">
            MY PROFILE
          </h1>

          {/* USER ID */}
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6">

            <p className="text-zinc-500 mb-2">
              User ID
            </p>

            <h2 className="text-3xl font-black">
             {user.userId}
            </h2>

          </div>

          {/* USERNAME */}
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6">

            <p className="text-zinc-500 mb-2">
              Username
            </p>

            <h2 className="text-3xl font-black">
              {user.username}
            </h2>

          </div>

          {/* PASSWORD */}
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6">

            <p className="text-zinc-500 mb-2">
              Password
            </p>

            <h2 className="text-3xl font-black">
              ********
            </h2>

          </div>

          {/* WALLET */}
          <div className="bg-zinc-900 rounded-2xl p-6">

            <p className="text-zinc-500 mb-2">
              Wallet Balance
            </p>

            <h2 className="text-4xl font-black text-green-400">
              ₹{user.wallet || 0}
            </h2>

          </div>

        </div>

      </div>

    </main>
  );
}
