"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { 
  ArrowLeft, 
  Wallet, 
  Mail, 
  User, 
  IdCard, 
  Calendar, 
  Shield,
  Edit2,
  Save,
  X,
  Camera,
  Copy,
  Check,
  LogOut,
  Key,
  RefreshCw,
  Trophy,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0, totalProfit: 0 });
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    console.log("Token exists:", !!token);
    console.log("User data from localStorage:", userData);

    if (!token || !userData) {
      router.push("/login?redirect=/profile");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log("Parsed user data:", parsedUser);
      setUser(parsedUser);
      setEditName(parsedUser.name || parsedUser.username || "");
      setEditEmail(parsedUser.email || "");
      
      const savedImage = localStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      }
      
      fetchStats(token);
      fetchLatestUserData(token);
    } catch (error) {
      console.error("Failed to parse user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchLatestUserData = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5001/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Latest user data from API:", response.data);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("Updated localStorage with:", response.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch latest user data:", error);
    }
  };

  const fetchStats = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:5001/api/bet/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const statsData = response.data.stats;
        setStats({
          totalWins: statsData?.totalWins || 0,
          totalLosses: statsData?.totalLosses || 0,
          totalProfit: (statsData?.totalWonAmount || 0) - (statsData?.totalBetAmount || 0)
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleCopyUid = () => {
    const uid = user?.uid;
    console.log("Copying UID:", uid);
    if (uid) {
      navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user?.email || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setUpdateLoading(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const response = await axios.put(
        "http://localhost:5001/api/auth/profile",
        { name: editName, email: editEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setIsEditing(false);
        setUpdateSuccess("Profile updated successfully!");
        setTimeout(() => setUpdateSuccess(""), 3000);
        
        fetchLatestUserData(token);
      }
    } catch (error: any) {
      console.error("Update error:", error);
      setUpdateError(error.response?.data?.error || "Failed to update profile");
      setTimeout(() => setUpdateError(""), 3000);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !oldPassword) {
      setUpdateError("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setUpdateError("Password must be at least 6 characters");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setPasswordLoading(true);
    setUpdateError("");
    
    try {
      const response = await axios.put(
        "http://localhost:5001/api/auth/change-password",
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setUpdateSuccess("Password changed successfully!");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setUpdateSuccess(""), 3000);
      }
    } catch (error: any) {
      setUpdateError(error.response?.data?.error || "Failed to change password");
      setTimeout(() => setUpdateError(""), 3000);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        localStorage.setItem("profileImage", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    const name = user?.name || user?.username || "U";
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </main>
    );
  }

  // Debug log to see what user data is available
  console.log("User object in render:", user);
  console.log("User UID:", user?.uid);
  console.log("User ID:", user?.id);
  console.log("User _id:", user?._id);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <button
            onClick={() => router.push("/")}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Success/Error Messages */}
        {updateSuccess && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-center">
            {updateSuccess}
          </div>
        )}
        {updateError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-400 text-center flex items-center justify-center gap-2">
            <AlertCircle size={16} /> {updateError}
          </div>
        )}

        <div className="bg-linear-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-linear-to-r from-green-600 to-green-800 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-zinc-800 border-4 border-zinc-900 overflow-hidden flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-green-500 to-green-700 flex items-center justify-center">
                      <span className="text-5xl font-black text-white">{getInitials()}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-zinc-900 p-2 rounded-full border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={16} className="text-green-400" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 p-8">
            {/* Edit/Save Buttons */}
            <div className="flex justify-end mb-6">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user?.name || "");
                      setEditEmail(user?.email || "");
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2 transition"
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateLoading}
                    className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition disabled:opacity-50"
                  >
                    {updateLoading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {updateLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2 transition"
                >
                  <Edit2 size={18} /> Edit Profile
                </button>
              )}
            </div>

            {/* User Name */}
            <div className="mb-8 text-center md:text-left">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-3xl md:text-4xl font-black bg-black border border-zinc-700 rounded-xl px-4 py-2 w-full md:w-auto focus:border-green-500 outline-none"
                  placeholder="Your Name"
                />
              ) : (
                <h1 className="text-3xl md:text-4xl font-black text-green-400">
                  {user?.name || user?.username || "User"}
                </h1>
              )}
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <span className="text-zinc-500 text-sm">Member since</span>
                <span className="text-zinc-400 text-sm">{formatDate(user?.createdAt)}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-black rounded-2xl p-5 border border-zinc-800 text-center">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                  <Trophy size={20} />
                  <span className="text-zinc-500">Total Wins</span>
                </div>
                <p className="text-3xl font-bold text-green-400">{stats.totalWins}</p>
              </div>
              <div className="bg-black rounded-2xl p-5 border border-zinc-800 text-center">
                <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                  <TrendingUp size={20} />
                  <span className="text-zinc-500">Total Losses</span>
                </div>
                <p className="text-3xl font-bold text-red-400">{stats.totalLosses}</p>
              </div>
              <div className="bg-black rounded-2xl p-5 border border-zinc-800 text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                  <Wallet size={20} />
                  <span className="text-zinc-500">Net Profit</span>
                </div>
                <p className={`text-3xl font-bold ${stats.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹{stats.totalProfit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-4">
              {/* UID Card - THIS IS THE IMPORTANT PART */}
              <div className="bg-linear-to-r from-green-900/20 to-black rounded-2xl p-5 border border-green-500/30">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <IdCard className="text-green-400" size={20} />
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">User ID / UID</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-mono font-bold text-green-400">
                          {user?.uid || "Not Available"}
                        </p>
                        {user?.uid && (
                          <button
                            onClick={handleCopyUid}
                            className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg transition"
                            title="Copy UID"
                          >
                            {copiedUid ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">This is your unique identifier</p>
                    </div>
                  </div>
                  <div className="bg-green-500/10 px-3 py-1 rounded-lg">
                    <p className="text-xs text-green-400">Cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-black rounded-2xl p-5 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Mail className="text-blue-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-zinc-500 text-sm">Email Address</p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="text-lg bg-black border border-zinc-700 rounded-xl px-3 py-2 w-full mt-1 focus:border-green-500 outline-none"
                        placeholder="your@email.com"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold">{user?.email || "Not set"}</p>
                        {user?.email && (
                          <button
                            onClick={handleCopyEmail}
                            className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg transition"
                            title="Copy Email"
                          >
                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet Balance Card */}
              <div className="bg-linear-to-r from-green-900/20 to-black rounded-2xl p-5 border border-green-500/30">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Wallet className="text-green-400" size={20} />
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Wallet Balance</p>
                      <p className="text-3xl font-bold text-green-400">₹{user?.wallet?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/deposit" className="bg-green-500 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition">
                      Deposit
                    </Link>
                    <Link href="/withdraw" className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition">
                      Withdraw
                    </Link>
                  </div>
                </div>
              </div>

              {/* Password Card */}
              <div className="bg-black rounded-2xl p-5 border border-zinc-800">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Key className="text-yellow-400" size={20} />
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Password</p>
                      <p className="text-xl font-mono">••••••••</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm"
                  >
                    <RefreshCw size={16} /> Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-green-400" />
                  <span className="text-zinc-500 text-sm">Account Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-black text-green-400 mb-6">Change Password</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 focus:border-green-500 outline-none"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-zinc-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 focus:border-green-500 outline-none"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              
              <div>
                <label className="block text-zinc-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 focus:border-green-500 outline-none"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setShowPasswordModal(false)} className="bg-zinc-800 rounded-xl py-3 font-bold">
                Cancel
              </button>
              <button onClick={handleChangePassword} disabled={passwordLoading} className="bg-green-500 text-black rounded-xl py-3 font-bold disabled:opacity-50">
                {passwordLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}