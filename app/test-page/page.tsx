"use client";

import { useState } from "react";
import api from "../lib/api";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get("/health");
      setResult(res.data);
      console.log("Health check success:", res.data);
    } catch (error: any) {
      console.error("Health check failed:", error);
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: "test@test.com",
        password: "123456"
      });
      setResult(res.data);
      console.log("Login success:", res.data);
    } catch (error: any) {
      console.error("Login failed:", error);
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={testHealth}
          className="bg-green-500 px-4 py-2 rounded font-bold"
        >
          Test Health Check
        </button>
        <button
          onClick={testLogin}
          className="bg-blue-500 px-4 py-2 rounded font-bold"
        >
          Test Login
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {result && (
        <div className="bg-zinc-900 p-4 rounded-lg">
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-zinc-800 rounded-lg">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Make sure backend is running: <code className="bg-black px-2 py-1 rounded">cd server && node minimal-server.js</code></li>
          <li>Backend should show: ✅ Server is running on http://localhost:5002</li>
          <li>Click "Test Health Check" - should return status: ok</li>
          <li>Click "Test Login" - should return user data with token</li>
        </ol>
      </div>
    </div>
  );
}