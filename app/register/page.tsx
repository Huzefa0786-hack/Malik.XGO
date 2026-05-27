"use client";

import {
  useState,
} from "react";

import axios from "axios";

export default function RegisterPage() {

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // REGISTER
  const handleRegister = async (
    e: any
  ) => {

    e.preventDefault();

    // EMPTY CHECK
    if (
      !username ||
      !password
    ) {

      return alert(
        "Fill all fields"
      );

    }

    try {

      setLoading(true);

      // API REQUEST
      const res =
        await axios.post(

          "http://localhost:5000/api/auth/register",

          {

            username,

            password,

            wallet: 0,

            userId:
              "MK" +
              Math.floor(
                100000 +
                Math.random() *
                  900000
              ),

          }

        );

      // SAVE LOGIN
      localStorage.setItem(
        "user",
        JSON.stringify(
          res.data.user
        )
      );

      localStorage.setItem(
        "loggedIn",
        "true"
      );

      alert(
        "Register Success"
      );

      // REDIRECT
      window.location.href =
        "/";

    } catch (err: any) {

      console.log(err);

      alert(
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

        {/* TITLE */}
        <h1 className="text-5xl font-black text-green-400 text-center mb-2">
          MATKA.KING
        </h1>

        <p className="text-zinc-500 text-center mb-10">
          Create Account
        </p>

        {/* USERNAME */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-6 outline-none"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-8 outline-none"
        />

        {/* BUTTON */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 rounded-2xl py-4 font-black text-xl"
        >

          {loading
            ? "Loading..."
            : "REGISTER"}

        </button>

      </div>

    </main>

  );
}