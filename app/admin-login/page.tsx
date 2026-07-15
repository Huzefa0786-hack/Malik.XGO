"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Key, Lock, User, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentKey, setCurrentKey] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newKey, setNewKey] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");

  const handleLogin = async () => {
    setError("");
    
    if (!username || !password || !securityKey) {
      setError("Please enter all credentials");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, securityKey })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem("admin", "true");
        localStorage.setItem("adminLoggedIn", Date.now().toString());
        router.push("/admin");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setChangeMessage("");
    
    if (!currentUsername || !currentPassword || !currentKey) {
      setChangeMessage("Please enter current credentials");
      return;
    }
    
    if (!newUsername && !newPassword && !newKey) {
      setChangeMessage("Please enter at least one new credential");
      return;
    }
    
    setChangeLoading(true);
    
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUsername,
          currentPassword,
          currentKey,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
          newKey: newKey || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChangeMessage("Credentials updated successfully! Please login with new credentials.");
        setTimeout(() => {
          setShowChangePassword(false);
          setCurrentUsername("");
          setCurrentPassword("");
          setCurrentKey("");
          setNewUsername("");
          setNewPassword("");
          setNewKey("");
          setChangeMessage("");
        }, 3000);
      } else {
        setChangeMessage(data.error || "Failed to update credentials");
      }
    } catch (error) {
      setChangeMessage("Failed to update credentials");
    } finally {
      setChangeLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-500/10 p-5 rounded-3xl">
            <Shield className="text-green-400" size={50} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-center mb-2">ADMIN LOGIN</h1>
        <p className="text-zinc-500 text-center mb-8">Malik.XGO Control Panel</p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-400 text-center text-sm flex items-center gap-2 justify-center">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Username */}
        <div className="relative mb-5">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-12 py-4 outline-none text-lg focus:border-green-500 transition"
            autoFocus
          />
        </div>

        {/* Password */}
        <div className="relative mb-5">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-12 py-4 outline-none text-lg focus:border-green-500 transition pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-green-400 transition"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Security Key */}
        <div className="relative mb-6">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type={showKey ? "text" : "password"}
            placeholder="Security Key"
            value={securityKey}
            onChange={(e) => setSecurityKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-12 py-4 outline-none text-lg focus:border-green-500 transition pr-12"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-green-400 transition"
          >
            {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full rounded-2xl py-4 text-xl font-black transition ${
            loading
              ? "bg-zinc-700 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500"
          }`}
        >
          {loading ? "LOGGING IN..." : "LOGIN"}
        </button>

        {/* Change Password Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="text-zinc-500 hover:text-green-400 text-sm transition"
          >
            {showChangePassword ? "← Back to Login" : "Change Admin Credentials"}
          </button>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-zinc-500 hover:text-green-400 text-sm transition"
          >
            ← Back to Home
          </button>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-800 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-green-400">Change Admin Credentials</h2>
              
              {changeMessage && (
                <div className={`mb-4 p-3 rounded-xl text-center text-sm ${
                  changeMessage.includes("success") 
                    ? "bg-green-500/20 text-green-400 border border-green-500" 
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}>
                  {changeMessage}
                </div>
              )}
              
              <div className="mb-4">
                <label className="text-zinc-400 text-sm mb-2 block">Current Username</label>
                <input
                  type="text"
                  value={currentUsername}
                  onChange={(e) => setCurrentUsername(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                  placeholder="Enter current username"
                />
              </div>
              
              <div className="mb-4">
                <label className="text-zinc-400 text-sm mb-2 block">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="mb-6">
                <label className="text-zinc-400 text-sm mb-2 block">Current Security Key</label>
                <input
                  type="password"
                  value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                  placeholder="Enter current security key"
                />
              </div>
              
              <div className="border-t border-zinc-800 pt-4 mb-4">
                <h3 className="text-lg font-bold mb-3 text-yellow-400">New Credentials (Optional)</h3>
                
                <div className="mb-4">
                  <label className="text-zinc-400 text-sm mb-2 block">New Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                    placeholder="Leave blank to keep current"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="text-zinc-400 text-sm mb-2 block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                    placeholder="Leave blank to keep current"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="text-zinc-400 text-sm mb-2 block">New Security Key</label>
                  <input
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={changeLoading}
                  className="flex-1 bg-green-500 text-black py-3 rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50"
                >
                  {changeLoading ? "Updating..." : "Update Credentials"}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setChangeMessage("");
                  }}
                  className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}