"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";
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
  Upload,
  Trash2,
  Image,
  Loader2
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
  const [uploading, setUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [stats, setStats] = useState({ totalWins: 0, totalLosses: 0, totalProfit: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login?redirect=/profile");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setEditName(parsedUser.name || parsedUser.username || "");
      setEditEmail(parsedUser.email || "");
      
      // Load profile image from localStorage
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
      const response = await api.get("/auth/profile");
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Failed to fetch latest user data:", error);
    }
  };

  const fetchStats = async (token: string) => {
    try {
      const response = await api.get("/bet/history");
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        localStorage.setItem("profileImage", imageData);
        setUploading(false);
        
        // Show success message
        const message = document.createElement('div');
        message.className = 'fixed top-20 right-4 z-50 px-4 py-2 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-sm animate-pulse';
        message.textContent = '✅ Profile picture updated successfully!';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (confirm("Remove your profile picture?")) {
      setProfileImage(null);
      localStorage.removeItem("profileImage");
      
      // Show success message
      const message = document.createElement('div');
      message.className = 'fixed top-20 right-4 z-50 px-4 py-2 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-sm animate-pulse';
      message.textContent = '✅ Profile picture removed!';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
    }
  };

  const handleCopyUid = () => {
    const uid = user?.uid || user?.userId || user?._id || "Not Available";
    if (uid && uid !== "Not Available") {
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

    try {
      const response = await api.put("/auth/profile", {
        name: editName,
        email: editEmail
      });

      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !oldPassword) {
      alert("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setPasswordLoading(true);
    try {
      const response = await api.put("/auth/change-password", {
        oldPassword,
        newPassword
      });

      if (response.data.success) {
        alert("Password changed successfully!");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to change password");
    } finally {
      setPasswordLoading(false);
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

  const getUserId = () => {
    return user?.uid || user?.userId || user?._id || "Not Available";
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

  const userId = getUserId();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="bg-linear-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          {/* Cover Image with Profile Picture */}
          <div className="relative h-40 bg-linear-to-r from-green-600 via-green-500 to-green-700">
            {/* Upload Button Overlay */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-black/60 backdrop-blur hover:bg-black/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                {uploading ? "Uploading..." : "Change Photo"}
              </button>
              {profileImage && (
                <button
                  onClick={handleRemoveImage}
                  className="bg-black/60 backdrop-blur hover:bg-red-600/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm"
                >
                  <Trash2 size={16} /> Remove
                </button>
              )}
            </div>
            
            {/* Profile Picture */}
            <div className="absolute -bottom-16 left-8">
              <div 
                className="relative group"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
              >
                <div className="w-32 h-32 rounded-2xl bg-zinc-800 border-4 border-zinc-900 overflow-hidden flex items-center justify-center shadow-2xl">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-green-500 to-green-700 flex items-center justify-center">
                      <span className="text-5xl font-black text-white">{getInitials()}</span>
                    </div>
                  )}
                </div>
                
                {/* Hover Overlay */}
                {hovering && !uploading && (
                  <div 
                    className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center cursor-pointer transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <Camera size={28} className="text-white mx-auto mb-1" />
                      <p className="text-white text-xs font-medium">Change Photo</p>
                    </div>
                  </div>
                )}
                
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
                    className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition"
                  >
                    <Save size={18} /> Save Changes
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
              {/* UID Card */}
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
                          {userId}
                        </p>
                        {userId !== "Not Available" && (
                          <button
                            onClick={handleCopyUid}
                            className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg transition"
                            title="Copy UID"
                          >
                            {copiedUid ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Your unique identifier</p>
                    </div>
                  </div>
                  <div className="bg-green-500/10 px-3 py-1 rounded-lg">
                    <p className="text-xs text-green-400">Cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-black rounded-2xl p-5 border border-zinc-800">
                <div className="flex items-center justify-between flex-wrap gap-3">
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
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold">{user?.email || "Not set"}</p>
                          {user?.email && (
                            <button
                              onClick={handleCopyEmail}
                              className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg transition"
                            >
                              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Balance Card */}
              <div className="bg-linear-to-r from-green-900/20 to-black rounded-2xl p-5 border border-green-500/30">
                <div className="flex items-center justify-between">
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