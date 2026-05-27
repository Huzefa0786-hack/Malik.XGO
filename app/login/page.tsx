"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

const [username, setUsername] =
  useState("");
const handleLogin = async (
  e: any
) => {

  e.preventDefault();

  // GET USERS
  const users =
    JSON.parse(
      localStorage.getItem(
        "users"
      ) || "[]"
    );

  // FIND USER
  const foundUser =
    users.find(
      (u: any) =>

        u.username ===
          username &&

        u.password ===
          password

    );

  // NOT FOUND
  if (!foundUser) {

    return alert(
      "Invalid Login"
    );

  }

  // SAVE LOGIN
  localStorage.setItem(
    "user",
    JSON.stringify(
      foundUser
    )
  );

  localStorage.setItem(
    "loggedIn",
    "true"
  );

  alert(
    "Login Success"
  );

  // REDIRECT
  window.location.href =
    "/";

};
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      alert("Login successful");

      router.push("/numcards");
    } catch (err: any) {
      alert(
        err?.response?.data?.error ||
          "Login failed"
      );
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-white mb-8 text-center">
          Login
        </h1>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-white outline-none"
          />

          <button
            onClick={login}
            className="w-full bg-green-600 hover:bg-green-500 transition rounded-2xl py-4 font-black text-xl"
          >
            LOGIN
          </button>

        </div>

      </div>

    </main>
  );
}