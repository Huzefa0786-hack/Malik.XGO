"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { io } from "socket.io-client";
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Shield,
  AlertCircle,
  RefreshCw,
  Search,
  Ban,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  Gamepad2,
  BarChart3,
  Clock,
  Award,
  Zap
} from "lucide-react";

const socket = io("http://localhost:5000");

type UserType = {
  _id: string;
  username: string;
  name?: string;
  email: string;
  wallet: number;
  banned: boolean;
  uid?: string;
  createdAt?: string;
  role?: string;
};

type DepositType = {
  _id: string;
  username: string;
  amount: number;
  upiId?: string;
  status?: string;
  createdAt?: string;
};

type WithdrawType = {
  _id: string;
  username: string;
  amount: number;
  upiId?: string;
  status?: string;
  createdAt?: string;
};

export default function AdminPage() {
  const [section, setSection] = useState("dashboard");
  const [users, setUsers] = useState<UserType[]>([]);
  const [deposits, setDeposits] = useState<DepositType[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawType[]>([]);
  const [search, setSearch] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [gameStatus, setGameStatus] = useState("RUNNING");
  const [rtp, setRtp] = useState(72);
  const [currentResult, setCurrentResult] = useState("7");
  const [timer, setTimer] = useState(30);
  const [searchUid, setSearchUid] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [control, setControl] = useState({
    numcards: "random",
    spin: "random",
    sky: "random",
    rtp: 72,
    gameStatus: "RUNNING",
  });
  const [liveBets, setLiveBets] = useState([
    { user: "Rahul", game: "NumCards", amount: 500, time: new Date().toLocaleTimeString() },
    { user: "Aman", game: "Spin", amount: 1200, time: new Date().toLocaleTimeString() },
    { user: "Rohit", game: "Sky", amount: 800, time: new Date().toLocaleTimeString() },
  ]);
  const [profit, setProfit] = useState(45230);
  const [todayDeposit, setTodayDeposit] = useState(125000);
  const [todayWithdraw, setTodayWithdraw] = useState(72400);
  const [fakePlayers] = useState(["Rahul", "Aman", "Rohit", "Vikas", "Arjun", "Sameer"]);
  const [activity, setActivity] = useState<string[]>([]);
  const [totalBets, setTotalBets] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalDeposits: 0,
    totalWithdraws: 0,
    totalBets: 0,
  });

  // Load initial data
  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    const timerInterval = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    const liveBetsInterval = setInterval(() => {
      const games = ["NumCards", "Spin", "Sky", "Mines", "Plinko"];
      const amounts = [100, 200, 500, 1000, 2000, 5000];
      const player = fakePlayers[Math.floor(Math.random() * fakePlayers.length)];
      const game = games[Math.floor(Math.random() * games.length)];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];

      setLiveBets((prev) => [
        { user: player, game, amount, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 5),
      ]);

      setActivity((prev) => [
        `${player} placed ₹${amount} on ${game}`,
        ...prev.slice(0, 8),
      ]);
      
      setTotalBets((prev) => prev + 1);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
      clearInterval(liveBetsInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, depRes, wdRes, controlRes] = await Promise.all([
        axios.get("http://localhost:5000/api/auth/users"),
        axios.get("http://localhost:5000/api/deposit"),
        axios.get("http://localhost:5000/api/withdraw"),
        axios.get("http://localhost:5000/api/control"),
      ]);

      setUsers(usersRes.data);
      setDeposits(depRes.data);
      setWithdraws(wdRes.data);
      setControl(controlRes.data);
      
      // Update stats
      setStats({
        totalUsers: usersRes.data.length,
        activeUsers: usersRes.data.filter((u: UserType) => !u.banned).length,
        bannedUsers: usersRes.data.filter((u: UserType) => u.banned).length,
        totalDeposits: depRes.data.reduce((sum: number, d: DepositType) => sum + d.amount, 0),
        totalWithdraws: wdRes.data.reduce((sum: number, w: WithdrawType) => sum + w.amount, 0),
        totalBets: totalBets,
      });
    } catch (err) {
      console.log("Error loading data:", err);
    }
  };

  const approveDeposit = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/deposit/approve/${id}`);
      setDeposits(deposits.filter((d) => d._id !== id));
      loadData();
      alert("Deposit approved!");
    } catch (err) {
      alert("Failed to approve deposit");
    }
  };

  const approveWithdraw = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/withdraw/approve/${id}`);
      setWithdraws(withdraws.filter((w) => w._id !== id));
      loadData();
      alert("Withdrawal approved!");
    } catch (err) {
      alert("Failed to approve withdrawal");
    }
  };

  const toggleBan = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/auth/ban/${id}`);
      setUsers(users.map((u) => (u._id === id ? { ...u, banned: !u.banned } : u)));
      alert("User ban status updated!");
    } catch (err) {
      alert("Failed to update ban status");
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/api/auth/delete/${id}`);
        setUsers(users.filter((u) => u._id !== id));
        alert("User deleted!");
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  const updateUserWallet = async (id: string, amount: number, type: "add" | "remove") => {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const user = users.find((u) => u._id === id);
      if (!user) return;

      const newWallet = type === "add" ? user.wallet + amount : user.wallet - amount;
      
      if (newWallet < 0) {
        alert("Wallet cannot go negative!");
        return;
      }

      await axios.put(`http://localhost:5000/api/auth/wallet/${id}`, { wallet: newWallet });
      
      setUsers(users.map((u) => (u._id === id ? { ...u, wallet: newWallet } : u)));
      setWalletAmount("");
      alert(`₹${amount} ${type === "add" ? "added to" : "removed from"} wallet!`);
    } catch (err) {
      alert("Failed to update wallet");
    }
  };

  const saveControl = async (updated: any) => {
    try {
      const newData = { ...control, ...updated };
      setControl(newData);
      await axios.put("http://localhost:5000/api/control", newData);
      alert("Settings saved!");
    } catch (error) {
      console.log(error);
      alert("Failed to save settings");
    }
  };

  const searchUser = async () => {
    if (!searchUid) return;
    
    try {
      const res = await axios.get(`http://localhost:5000/api/wallet/${searchUid}`);
      setFoundUser(res.data);
      setSelectedUser(res.data);
      setShowUserModal(true);
    } catch {
      alert("User not found");
    }
  };

  const forceGameResult = async (game: string, result: string | number) => {
    try {
      await axios.post("http://localhost:5000/api/admin/force-result", { game, result });
      alert(`${game} result forced to ${result}`);
    } catch (err) {
      alert("Failed to force result");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition"
      >
        ← Back
      </Link>

      {/* Sidebar */}
      <div className="w-72 bg-zinc-950 border-r border-zinc-800 p-6">
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-green-500 to-green-700 mx-auto mb-4 flex items-center justify-center text-5xl">
            🎮
          </div>
          <h1 className="text-4xl font-black text-green-400">Malik.XGO</h1>
          <p className="text-zinc-500 mt-2">Admin Panel</p>
        </div>

        <div className="space-y-3">
          {[
            { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={20} /> },
            { id: "users", label: "User Control", icon: <Users size={20} /> },
            { id: "deposits", label: "Deposit Requests", icon: <TrendingUp size={20} /> },
            { id: "withdraws", label: "Withdraw Requests", icon: <TrendingDown size={20} /> },
            { id: "winning", label: "Game Control", icon: <Gamepad2 size={20} /> },
            { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 ${
                section === item.id ? "bg-green-500 text-black" : "bg-zinc-900 hover:bg-zinc-800"
              } transition p-4 rounded-2xl font-black`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        {/* Dashboard Section */}
        {section === "dashboard" && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-6xl font-black">Dashboard</h1>
                <p className="text-zinc-500 mt-3 text-xl">Real Time Admin Control</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-8 py-5 text-center">
                <p className="text-zinc-500">Next Round</p>
                <h1 className="text-5xl font-black text-green-400">{timer}s</h1>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <Users className="text-green-400 mb-3" size={32} />
                <p className="text-zinc-500">Total Users</p>
                <h2 className="text-4xl font-black">{stats.totalUsers}</h2>
                <p className="text-sm text-zinc-500 mt-2">Active: {stats.activeUsers}</p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <Activity className="text-yellow-400 mb-3" size={32} />
                <p className="text-zinc-500">Live Bets</p>
                <h2 className="text-4xl font-black">{liveBets.length}</h2>
                <p className="text-sm text-zinc-500 mt-2">Today: {totalBets}</p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <DollarSign className="text-blue-400 mb-3" size={32} />
                <p className="text-zinc-500">Today's Deposit</p>
                <h2 className="text-4xl font-black text-green-400">₹{todayDeposit.toLocaleString()}</h2>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <TrendingUp className="text-purple-400 mb-3" size={32} />
                <p className="text-zinc-500">Profit</p>
                <h2 className="text-4xl font-black text-green-400">₹{profit.toLocaleString()}</h2>
              </div>
            </div>

            {/* Live Bets */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black flex items-center gap-2">
                  <Zap className="text-yellow-400" />
                  Live Bets
                </h2>
                <div className="bg-red-500 animate-pulse px-4 py-2 rounded-xl font-black text-sm">LIVE</div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {liveBets.map((bet, index) => (
                  <div key={index} className="bg-black border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-green-500 transition">
                    <div>
                      <p className="font-bold text-lg">{bet.user}</p>
                      <p className="text-zinc-500 text-sm">{bet.game} • {bet.time}</p>
                    </div>
                    <p className="text-green-400 text-2xl font-bold">₹{bet.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black flex items-center gap-2">
                  <Activity className="text-green-400" />
                  Live Activity
                </h2>
                <div className="bg-red-500 animate-pulse px-4 py-2 rounded-xl font-black text-sm">LIVE</div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activity.map((item, index) => (
                  <div key={index} className="bg-black border border-zinc-800 rounded-xl p-3 text-zinc-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Control Section */}
        {section === "users" && (
          <div>
            <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
              <h1 className="text-5xl font-black">User Control</h1>
              <div className="flex gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by UID"
                    value={searchUid}
                    onChange={(e) => setSearchUid(e.target.value)}
                    className="bg-black border border-zinc-700 px-4 py-3 rounded-xl w-48"
                  />
                  <button onClick={searchUser} className="bg-green-500 px-6 rounded-xl font-black">
                    <Search size={20} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-black border border-zinc-700 px-4 py-3 rounded-xl w-64"
                />
              </div>
            </div>

            <div className="space-y-4">
              {users
                .filter((u) => u.username?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()))
                .map((user) => (
                  <div key={user._id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${user.banned ? "bg-red-500" : "bg-green-500"} animate-pulse`} />
                          <h2 className="text-2xl font-black">{user.name || user.username}</h2>
                          <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg">{user.role || "user"}</span>
                        </div>
                        <p className="text-zinc-400 text-sm">UID: {user.uid || "N/A"}</p>
                        <p className="text-zinc-400 text-sm">Email: {user.email}</p>
                        <p className="text-green-400 text-2xl font-bold mt-2">₹{user.wallet.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="Amount"
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            className="bg-black border border-zinc-700 px-3 py-2 rounded-xl w-28 text-sm"
                          />
                          <button
                            onClick={() => updateUserWallet(user._id, Number(walletAmount), "add")}
                            className="bg-green-600 px-4 py-2 rounded-xl font-black text-sm hover:bg-green-700"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => updateUserWallet(user._id, Number(walletAmount), "remove")}
                            className="bg-red-600 px-4 py-2 rounded-xl font-black text-sm hover:bg-red-700"
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => toggleBan(user._id)}
                          className={`px-4 py-2 rounded-xl font-black text-sm ${
                            user.banned ? "bg-yellow-600" : "bg-red-600"
                          }`}
                        >
                          <Ban size={16} className="inline mr-1" />
                          {user.banned ? "Unban" : "Ban"}
                        </button>
                        
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="bg-black border border-red-500 px-4 py-2 rounded-xl font-black text-sm hover:bg-red-500/10"
                        >
                          <Trash2 size={16} className="inline mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Deposit Requests */}
        {section === "deposits" && (
          <div>
            <h1 className="text-5xl font-black mb-10">Deposit Requests</h1>
            <div className="space-y-4">
              {deposits.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                  <p className="text-zinc-500 text-xl">No pending deposit requests</p>
                </div>
              ) : (
                deposits.map((dep) => (
                  <div key={dep._id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{dep.username}</h2>
                      <p className="text-green-400 text-3xl font-bold mt-1">₹{dep.amount.toLocaleString()}</p>
                      {dep.upiId && <p className="text-zinc-500 text-sm mt-1">UPI: {dep.upiId}</p>}
                      {dep.createdAt && <p className="text-zinc-500 text-xs">{new Date(dep.createdAt).toLocaleString()}</p>}
                    </div>
                    <button
                      onClick={() => approveDeposit(dep._id)}
                      className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-2xl font-black text-lg transition"
                    >
                      APPROVE
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Withdraw Requests */}
        {section === "withdraws" && (
          <div>
            <h1 className="text-5xl font-black mb-10">Withdraw Requests</h1>
            <div className="space-y-4">
              {withdraws.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                  <p className="text-zinc-500 text-xl">No pending withdrawal requests</p>
                </div>
              ) : (
                withdraws.map((wd) => (
                  <div key={wd._id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{wd.username}</h2>
                      <p className="text-blue-400 text-3xl font-bold mt-1">₹{wd.amount.toLocaleString()}</p>
                      {wd.upiId && <p className="text-zinc-500 text-sm mt-1">UPI: {wd.upiId}</p>}
                      {wd.createdAt && <p className="text-zinc-500 text-xs">{new Date(wd.createdAt).toLocaleString()}</p>}
                    </div>
                    <button
                      onClick={() => approveWithdraw(wd._id)}
                      className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-2xl font-black text-lg transition"
                    >
                      APPROVE
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Game Control Section */}
        {section === "winning" && (
          <div>
            <h1 className="text-5xl font-black mb-10">Game Control Panel</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Game Status */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-3xl font-black mb-6 flex items-center gap-2">
                  <Settings className="text-green-400" />
                  Game Status
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={() => saveControl({ gameStatus: "RUNNING" })}
                    className={`w-full py-4 rounded-2xl text-2xl font-black transition ${
                      control.gameStatus === "RUNNING" ? "bg-green-500 text-black" : "bg-green-700 hover:bg-green-600"
                    }`}
                  >
                    🟢 START GAMES
                  </button>
                  <button
                    onClick={() => saveControl({ gameStatus: "PAUSED" })}
                    className={`w-full py-4 rounded-2xl text-2xl font-black transition ${
                      control.gameStatus === "PAUSED" ? "bg-yellow-500 text-black" : "bg-yellow-700 hover:bg-yellow-600"
                    }`}
                  >
                    🟡 PAUSE BETTING
                  </button>
                  <button
                    onClick={() => saveControl({ gameStatus: "STOPPED" })}
                    className={`w-full py-4 rounded-2xl text-2xl font-black transition ${
                      control.gameStatus === "STOPPED" ? "bg-red-500" : "bg-red-700 hover:bg-red-600"
                    }`}
                  >
                    🔴 STOP SERVER
                  </button>
                </div>
              </div>

              {/* RTP Control */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-3xl font-black mb-6 flex items-center gap-2">
                  <BarChart3 className="text-blue-400" />
                  RTP Control
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => saveControl({ rtp: 60 })} className="bg-green-700 py-4 rounded-2xl font-black hover:bg-green-600">
                      LOW (60%)
                    </button>
                    <button onClick={() => saveControl({ rtp: 75 })} className="bg-yellow-600 py-4 rounded-2xl font-black hover:bg-yellow-500">
                      MEDIUM (75%)
                    </button>
                    <button onClick={() => saveControl({ rtp: 90 })} className="bg-red-600 py-4 rounded-2xl font-black hover:bg-red-500">
                      HIGH (90%)
                    </button>
                  </div>
                  <div className="text-center p-4 bg-black rounded-2xl">
                    <p className="text-zinc-500">Current RTP</p>
                    <p className="text-5xl font-bold text-green-400">{control.rtp}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NumCards Control */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-2">
                <Gamepad2 className="text-purple-400" />
                NumCards Control
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      saveControl({ numcards: String(num) });
                      forceGameResult("numcards", num);
                    }}
                    className={`h-16 rounded-2xl text-2xl font-black transition ${
                      control.numcards === String(num) ? "bg-green-500 text-black" : "bg-black border border-zinc-700 hover:bg-zinc-800"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Sky Control */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-2">
                <Award className="text-cyan-400" />
                Sky / Aviator Control
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {["1.5x", "2x", "5x", "10x", "25x", "50x", "100x", "random"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      saveControl({ sky: item });
                      forceGameResult("sky", item);
                    }}
                    className={`h-16 rounded-2xl text-lg font-black transition ${
                      control.sky === item ? "bg-green-500 text-black" : "bg-black border border-zinc-700 hover:bg-zinc-800"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 bg-black rounded-2xl text-center">
                <p className="text-zinc-500">Current Sky Result</p>
                <p className="text-4xl font-bold text-cyan-400">{control.sky}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {section === "analytics" && (
          <div>
            <h1 className="text-5xl font-black mb-10">Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-2xl font-black mb-4">User Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-bold text-green-400">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span className="font-bold text-green-400">{stats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Banned Users:</span>
                    <span className="font-bold text-red-400">{stats.bannedUsers}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-2xl font-black mb-4">Financial Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Deposits:</span>
                    <span className="font-bold text-green-400">₹{stats.totalDeposits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Withdraws:</span>
                    <span className="font-bold text-red-400">₹{stats.totalWithdraws.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Bets:</span>
                    <span className="font-bold text-blue-400">{stats.totalBets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-zinc-800">
                    <span>Net Profit:</span>
                    <span className="font-bold text-yellow-400">₹{(stats.totalDeposits - stats.totalWithdraws).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-black mb-4">{selectedUser.name || selectedUser.username}</h2>
            <div className="space-y-3">
              <p><span className="text-zinc-500">UID:</span> {selectedUser.uid}</p>
              <p><span className="text-zinc-500">Email:</span> {selectedUser.email}</p>
              <p><span className="text-zinc-500">Wallet:</span> <span className="text-green-400 font-bold">₹{selectedUser.wallet.toLocaleString()}</span></p>
              <p><span className="text-zinc-500">Status:</span> {selectedUser.banned ? <span className="text-red-400">Banned</span> : <span className="text-green-400">Active</span>}</p>
            </div>
            <button onClick={() => setShowUserModal(false)} className="w-full mt-6 bg-green-500 py-3 rounded-xl font-black">
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
