"use client";

import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { useState } from "react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
userId:
  "MK" +
  Math.floor(
    100000 +
    Math.random() * 900000
  ),
      toast.success(res.data.message);

      setFormData({
        username: "",
        email: "",
        password: "",
      });
    
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-green-400">
            MATKA.KING
          </h1>

          <p className="text-zinc-500 mt-2">
            Create your gaming account
          </p>
        </div>

        {/* Username */}
        <div className="mb-5">
          <label className="text-sm text-zinc-400 mb-2 block">
            Username
          </label>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4">
            <User size={20} className="text-zinc-500" />

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full bg-transparent outline-none px-3 py-4"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="text-sm text-zinc-400 mb-2 block">
            Email Address
          </label>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4">
            <Mail size={20} className="text-zinc-500" />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full bg-transparent outline-none px-3 py-4"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm text-zinc-400 mb-2 block">
            Password
          </label>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4">
            <Lock size={20} className="text-zinc-500" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full bg-transparent outline-none px-3 py-4"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="text-zinc-500"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 transition rounded-2xl py-4 font-bold text-lg"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        {/* Login */}
        <p className="text-center text-zinc-400 mt-8">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-green-400"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}