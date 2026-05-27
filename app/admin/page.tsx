"use client";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

type UserType = {
  _id: string;
  username: string;
  wallet: number;
  banned: boolean;
  uid?: string;
};

type DepositType = {
  _id: string;
  username: string;
  amount: number;
};

type WithdrawType = {
  _id: string;
  username: string;
  amount: number;
};

export default function AdminPage() {

  const [section, setSection] =
    useState(
      "dashboard"
    );

  const [users, setUsers] =
    useState<UserType[]>(
      []
    );

  const [deposits, setDeposits] =
    useState<
      DepositType[]
    >([]);

  const [withdraws, setWithdraws] =
    useState<
      WithdrawType[]
    >([]);

  const [search, setSearch] =
    useState("");

  const [walletAmount, setWalletAmount] =
    useState("");

    const [gameStatus, setGameStatus] =
  useState("RUNNING");

const [rtp, setRtp] =
  useState(72);

const [currentResult, setCurrentResult] =
  useState("7");

const [timer, setTimer] =
  useState(30);
const [searchUid, setSearchUid] =
  useState("");

const [foundUser, setFoundUser] =
  useState<any>(null);
  
const [control, setControl] =
  useState({
    numcards:
      "random",
    spin:
      "random",
    sky:
      "random",
    rtp: 72,
    gameStatus:
      "RUNNING",
  });

const [liveBets, setLiveBets] =
  useState([
    {
      user: "Rahul",
      game: "NumCards",
      amount: 500,
    },
    {
      user: "Aman",
      game: "Spin",
      amount: 1200,
    },
    {
      user: "Rohit",
      game: "Sky",
      amount: 800,
    },
  ]);

  const [profit, setProfit] =
  useState(45230);

const [todayDeposit, setTodayDeposit] =
  useState(125000);

const [todayWithdraw, setTodayWithdraw] =
  useState(72400);

const [fakePlayers, setFakePlayers] =
  useState([
    "Rahul",
    "Aman",
    "Rohit",
    "Vikas",
    "Arjun",
    "Sameer",
  ]);

const [activity, setActivity] =
  useState<string[]>(
    []
  );

  useEffect(() => {

  const interval =
    setInterval(() => {

      const games = [
        "NumCards",
        "Spin",
        "Sky",
      ];

      const amounts = [
        100,
        200,
        500,
        1000,
        2000,
      ];

      const player =
        fakePlayers[
          Math.floor(
            Math.random() *
              fakePlayers.length
          )
        ];

      const game =
        games[
          Math.floor(
            Math.random() *
              games.length
          )
        ];

      const amount =
        amounts[
          Math.floor(
            Math.random() *
              amounts.length
          )
        ];

      const newBet = {
        user: player,
        game,
        amount,
      };

      setLiveBets(
        (prev) => [
          newBet,
          ...prev.slice(
            0,
            5
          ),
        ]
      );

      setActivity(
        (prev) => [
          `${player} placed ₹${amount} on ${game}`,
          ...prev.slice(
            0,
            8
          ),
        ]
      );

    }, 3000);

  return () =>
    clearInterval(
      interval
    );

}, []);

  useEffect(() => {

  const interval =
    setInterval(() => {

      setTimer(
        (prev) => {

          if (prev <= 1) {

            return 30;

          }

          return prev - 1;

        }
      );

    }, 1000);

  return () =>
    clearInterval(
      interval
    );

}, []);

  useEffect(() => {

    loadData();

  }, []);

 const loadData =
  async () => {

    try {

      // Users
      const usersRes =
        await axios.get(
          "http://localhost:5000/api/auth/users"
        );

      setUsers(
        usersRes.data
      );

      // Deposits
      const depRes =
        await axios.get(
          "http://localhost:5000/api/deposit"
        );

      setDeposits(
        depRes.data
      );

      // Withdraws
      const wdRes =
        await axios.get(
          "http://localhost:5000/api/withdraw"
        );

      setWithdraws(
        wdRes.data
      );

      // Game Control
      const controlRes =
        await axios.get(
          "http://localhost:5000/api/control"
        );

      setControl(
        controlRes.data
      );

    } catch (error) {

      console.log(error);

    }
};
  // Approve Deposit
  const approveDeposit =
    async (id: string) => {

      await axios.put(
        `http://localhost:5000/api/deposit/approve/${id}`
      );

      setDeposits(
        deposits.filter(
          (d) =>
            d._id !== id
        )
      );
    };

  // Approve Withdraw
  const approveWithdraw =
    async (id: string) => {

      await axios.put(
        `http://localhost:5000/api/withdraw/approve/${id}`
      );

      setWithdraws(
        withdraws.filter(
          (w) =>
            w._id !== id
        )
      );
    };

  // Ban User
  const toggleBan =
    async (id: string) => {

      await axios.put(
        `http://localhost:5000/api/auth/ban/${id}`
      );

      setUsers(
        users.map((u) =>
          u._id === id
            ? {
                ...u,
                banned:
                  !u.banned,
              }
            : u
        )
      );
    };

  // Delete User
  const deleteUser =
    async (id: string) => {

      await axios.delete(
        `http://localhost:5000/api/auth/delete/${id}`
      );

      setUsers(
        users.filter(
          (u) =>
            u._id !== id
        )
      );
    };

  // Add Wallet
  const addWallet =
    async (
      id: string,
      current: number
    ) => {

      if (
        !walletAmount
      )
        return;

      const newWallet =
        current +
        Number(
          walletAmount
        );

      await axios.put(
        `http://localhost:5000/api/auth/wallet/${id}`,
        {
          wallet:
            newWallet,
        }
      );

      setUsers(
        users.map((u) =>
          u._id === id
            ? {
                ...u,
                wallet:
                  newWallet,
              }
            : u
        )
      );

      setWalletAmount(
        ""
      );
    };

    // Save Game Control
const saveControl =
  async (
    updated: any
  ) => {

    try {

      const newData = {
        ...control,
        ...updated,
      };

      setControl(
        newData
      );

      await axios.put(
        "http://localhost:5000/api/control",
        newData
      );

    } catch (error) {

      console.log(error);

    }
};
const searchUser =
  async () => {

    try {

      const res =
        await axios.get(
          `http://localhost:5000/api/wallet/${searchUid}`
        );

      setFoundUser(
        res.data
      );

    } catch {

      alert(
        "User not found"
      );

    }

};

const updateWallet =
  async (
    type: string
  ) => {

    try {

      const res =
        await axios.put(
          "http://localhost:5000/api/wallet/update",
          {
            uid:
              searchUid,
            amount:
              walletAmount,
            type,
          }
        );

      setFoundUser({
        ...foundUser,
        wallet:
          res.data.wallet,
      });

      loadData();

      alert(
        "Wallet Updated"
      );

    } catch {

      alert(
        "Update failed"
      );

    }

};
  return (

    <main className="min-h-screen bg-black text-white flex">

      {/* Sidebar */}
      <div className="w-72 bg-zinc-950 border-r border-zinc-800 p-6">

        <div className="text-center mb-10">

          <div className="w-24 h-24 rounded-full bg-green-500 mx-auto mb-4 flex items-center justify-center text-5xl">
            🎮
          </div>

          <h1 className="text-4xl font-black text-green-400">
            MATKA.KING
          </h1>

          <p className="text-zinc-500 mt-2">
            Admin Panel
          </p>

        </div>

        <div className="space-y-4">

          <button
            onClick={() =>
              setSection(
                "dashboard"
              )
            }
            className="w-full bg-zinc-900 hover:bg-green-500 transition p-4 rounded-2xl text-left font-black"
          >
            Dashboard
          </button>

          <button
            onClick={() =>
              setSection(
                "users"
              )
            }
            className="w-full bg-zinc-900 hover:bg-green-500 transition p-4 rounded-2xl text-left font-black"
          >
            User Control
          </button>

          <button
            onClick={() =>
              setSection(
                "deposits"
              )
            }
            className="w-full bg-zinc-900 hover:bg-green-500 transition p-4 rounded-2xl text-left font-black"
          >
            Deposit Requests
          </button>

          <button
            onClick={() =>
              setSection(
                "withdraws"
              )
            }
            className="w-full bg-zinc-900 hover:bg-green-500 transition p-4 rounded-2xl text-left font-black"
          >
            Withdraw Requests
          </button>

          <button
            onClick={() =>
              setSection(
                "winning"
              )
            }
            className="w-full bg-zinc-900 hover:bg-green-500 transition p-4 rounded-2xl text-left font-black"
          >
            Winning Control
          </button>

        </div>

      </div>

      {/* Main */}
      <div className="flex-1 p-10 overflow-y-auto">

       {/* Dashboard */}
{section ===
  "dashboard" && (

  <div>

    <div className="flex items-center justify-between mb-10">

      <div>

        <h1 className="text-6xl font-black">
          Dashboard
        </h1>

        <p className="text-zinc-500 mt-3 text-xl">
          Real Time Admin Control
        </p>

      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-8 py-5">

        <p className="text-zinc-500">
          Current Round
        </p>

        <h1 className="text-5xl font-black text-green-400">
          {timer}s
        </h1>

      </div>

    </div>

    <div className=" grid-cols-1 md:grid-cols-6 gap-6 mb-10">

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <p className="text-zinc-500 mb-4">
          Total Users
        </p>

        <h1 className="text-7xl font-black text-green-400">
          {users.length}
        </h1>

      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <p className="text-zinc-500 mb-4">
          Live Bets
        </p>

        <h1 className="text-7xl font-black text-yellow-400">
          {
            liveBets.length
          }
        </h1>

      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <p className="text-zinc-500 mb-4">
          RTP
        </p>

        <h1 className="text-7xl font-black text-blue-400">
          {rtp}%
        </h1>

      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <p className="text-zinc-500 mb-4">
          Game Status
        </p>

        <h1 className="text-5xl font-black text-red-400">
          {gameStatus}
        </h1>

      </div>

    </div>

<div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

  <p className="text-zinc-500 mb-4">
    Profit
  </p>

  <h1 className="text-5xl font-black text-green-400">
    ₹{profit}
  </h1>

</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

  <p className="text-zinc-500 mb-4">
    Deposits Today
  </p>

  <h1 className="text-5xl font-black text-blue-400">
    ₹{todayDeposit}
  </h1>

</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

  <p className="text-zinc-500 mb-4">
    Withdraw Today
  </p>

  <h1 className="text-5xl font-black text-red-400">
    ₹{todayWithdraw}
  </h1>

</div>

    {/* Live Bets */}
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">

      <div className="flex items-center justify-between mb-8">

        <h1 className="text-4xl font-black text-green-400">
          Live Bets
        </h1>

        <div className="bg-red-500 animate-pulse px-5 py-2 rounded-xl font-black">
          LIVE
        </div>

      </div>

      <div className="space-y-4">

        {liveBets.map(
          (
            bet,
            index
          ) => (

            <div
              key={index}
              className="bg-black border border-zinc-700 rounded-2xl p-5 flex items-center justify-between"
            >

              <div>

                <h1 className="text-2xl font-black">
                  {bet.user}
                </h1>

                <p className="text-zinc-500">
                  {bet.game}
                </p>

              </div>

              <p className="text-green-400 text-3xl font-black">
                ₹{bet.amount}
              </p>

            </div>

          )
        )}

      </div>

    </div>

{/* Live Activity */}
<div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">

  <div className="flex items-center justify-between mb-8">

    <h1 className="text-4xl font-black text-green-400">
      Live Activity
    </h1>

    <div className="bg-red-500 animate-pulse px-5 py-2 rounded-xl font-black">
      LIVE
    </div>

  </div>

  <div className="space-y-4">

    {activity.map(
      (
        item,
        index
      ) => (

        <div
          key={index}
          className="bg-black border border-zinc-700 rounded-2xl p-5 text-xl"
        >
          {item}
        </div>

      )
    )}

  </div>

</div>

    {/* Admin Controls */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-green-400 mb-8">
          Force Result
        </h1>

        <div className="grid grid-cols-5 gap-4">

          {[1,2,3,4,5,6,7,8,9,10].map(
            (num) => (

              <button
                key={num}
                onClick={() =>
                  setCurrentResult(
                    String(num)
                  )
                }
                className={`h-20 rounded-2xl font-black text-2xl ${
                  currentResult ===
                  String(num)
                    ? "bg-green-500"
                    : "bg-black border border-zinc-700"
                }`}
              >
                {num}
              </button>

            )
          )}

        </div>

      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-green-400 mb-8">
          System Controls
        </h1>

       <div className="space-y-5">

  <button
    onClick={() =>
      saveControl({
        gameStatus:
          "RUNNING",
      })
    }
    className={`w-full h-20 rounded-2xl text-2xl font-black ${
      control.gameStatus ===
      "RUNNING"
        ? "bg-green-500 text-black"
        : "bg-green-700"
    }`}
  >
    START GAMES
  </button>

  <button
    onClick={() =>
      saveControl({
        gameStatus:
          "PAUSED",
      })
    }
    className={`w-full h-20 rounded-2xl text-2xl font-black ${
      control.gameStatus ===
      "PAUSED"
        ? "bg-yellow-400 text-black"
        : "bg-yellow-600"
    }`}
  >
    PAUSE BETTING
  </button>

  <button
    onClick={() =>
      saveControl({
        gameStatus:
          "STOPPED",
      })
    }
    className={`w-full h-20 rounded-2xl text-2xl font-black ${
      control.gameStatus ===
      "STOPPED"
        ? "bg-red-500"
        : "bg-red-700"
    }`}
  >
    STOP SERVER
  </button>

</div>

      </div>

    </div>

  </div>

)}
        {/* User Control */}
        {section ===
          "users" && (

          <div>

            <div className="flex items-center justify-between mb-10">

              <h1 className="text-5xl font-black">
                User Control
              </h1>

             <input
  type="text"
  placeholder="User UID"
  value={searchUid}
  onChange={(e) =>
    setSearchUid(
      e.target.value
    )
  }
  className="bg-black border border-zinc-700 px-4 rounded-xl w-40"
/>

            </div>

            <div className="space-y-5">

              {users
                .filter((u) =>
                  u.username
                    .toLowerCase()
                    .includes(
                      search.toLowerCase()
                    )
                )
                .map((user) => (

                  <div
                    key={user._id}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <div className="flex items-center gap-3 mb-3">

                          <div
                            className={`w-4 h-4 rounded-full ${
                              user.banned
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                          />

                          <h1 className="text-3xl font-black">
                            {
                              user.username
                            }
                          </h1>

                        </div>
<div className="bg-black border border-zinc-800 rounded-xl px-4 py-3 inline-flex items-center gap-3">

  <p className="text-zinc-500 text-sm">
    UID
  </p>

  <p className="text-green-400 font-black tracking-wider">
    {user.uid || "NO UID"}
  </p>

</div>
                        <p className="text-green-400 text-xl mt-2">
                          Wallet:
                          ₹
                          {
                            user.wallet
                          }
                        </p>

                      </div>

                      <div className="flex gap-3">
<input
  type="number"
  placeholder="Amount"
  value={walletAmount}
  onChange={(e) =>
    setWalletAmount(
      e.target.value
    )
  }
  className="bg-black border border-zinc-700 px-4 rounded-xl w-32"
/>

<button
  onClick={() =>
    updateWallet(
      "add"
    )
  }
  className="bg-green-500 px-5 rounded-xl font-black"
>
  ADD
</button>

<button
  onClick={() =>
    updateWallet(
      "remove"
    )
  }
  className="bg-red-500 px-5 rounded-xl font-black"
>
  REMOVE
</button>
                      
                        

                        <button
                          onClick={() =>
                            toggleBan(
                              user._id
                            )
                          }
                          className={`px-5 rounded-xl font-black ${
                            user.banned
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {user.banned
                            ? "UNBAN"
                            : "BAN"}
                        </button>

                        <button
                          onClick={() =>
                            deleteUser(
                              user._id
                            )
                          }
                          className="bg-black border border-red-500 px-5 rounded-xl font-black"
                        >
                          DELETE
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

            </div>

          </div>

        )}

        {/* Deposits */}
        {section ===
          "deposits" && (

          <div>

            <h1 className="text-5xl font-black mb-10">
              Deposit Requests
            </h1>

            <div className="space-y-5">

              {deposits.map(
                (dep) => (

                  <div
                    key={dep._id}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between"
                  >

                    <div>

                      <h1 className="text-3xl font-black">
                        {
                          dep.username
                        }
                      </h1>

                      <p className="text-green-400 text-xl mt-2">
                        ₹
                        {
                          dep.amount
                        }
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        approveDeposit(
                          dep._id
                        )
                      }
                      className="bg-green-500 px-8 py-4 rounded-2xl font-black"
                    >
                      APPROVE
                    </button>

                  </div>

                )
              )}

            </div>

          </div>

        )}

        {/* Withdraws */}
        {section ===
          "withdraws" && (

          <div>

            <h1 className="text-5xl font-black mb-10">
              Withdraw Requests
            </h1>

            <div className="space-y-5">

              {withdraws.map(
                (wd) => (

                  <div
                    key={wd._id}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between"
                  >

                    <div>

                      <h1 className="text-3xl font-black">
                        {
                          wd.username
                        }
                      </h1>

                      <p className="text-green-400 text-xl mt-2">
                        ₹
                        {
                          wd.amount
                        }
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        approveWithdraw(
                          wd._id
                        )
                      }
                      className="bg-blue-500 px-8 py-4 rounded-2xl font-black"
                    >
                      APPROVE
                    </button>

                  </div>

                )
              )}

            </div>

          </div>

        )}

        {/* Winning */}
{section ===
  "winning" && (

  <div>

    <h1 className="text-5xl font-black mb-10">
      Advanced Admin Controls
    </h1>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* NumCards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-green-400 mb-8">
          NumCards Control
        </h1>

        <div className="grid grid-cols-5 gap-4">
{[
  1,2,3,4,5,
  6,7,8,9,10
].map((num) => (

  <button
    key={num}
    onClick={() =>
      saveControl({
        numcards:
          String(num),
      })
    }
    className={`h-24 rounded-2xl text-3xl font-black ${
      control.numcards ===
      String(num)
        ? "bg-green-500"
        : "bg-black border border-zinc-700"
    }`}
  >
    {num}
  </button>

))}

        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">

          <button className="bg-green-600 h-16 rounded-2xl font-black">
            LOW RTP
          </button>

          <button className="bg-yellow-500 h-16 rounded-2xl font-black">
            MEDIUM RTP
          </button>

          <button className="bg-red-600 h-16 rounded-2xl font-black">
            HIGH RTP
          </button>

        </div>

      </div>

      {/* Spin */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-green-400 mb-8">
          Spinning Wheel
        </h1>

        <div className="grid grid-cols-2 gap-4">

         {[
  "RED",
  "GREEN",
  "BLUE",
  "JACKPOT",
].map((color) => (

  <button
    key={color}
    onClick={() =>
      saveControl({
        spin:
          color,
      })
    }
    className={`h-24 rounded-2xl text-3xl font-black ${
      control.spin ===
      color
        ? "bg-green-500"
        : "bg-black border border-zinc-700"
    }`}
  >
    {color}
  </button>

))}

        </div>

      </div>

{/* Sky Control */}
<div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

  <div className="flex items-center justify-between mb-8">

    <h1 className="text-4xl font-black text-green-400">
      Sky Control
    </h1>

    <div className="bg-black px-4 py-2 rounded-xl border border-zinc-700">
      LIVE
    </div>

  </div>

  <p className="text-zinc-500 mb-8">
    Force Sky crash multiplier
  </p>

  <div className="grid grid-cols-3 gap-4">

    {[
      "1.5x",
      "2x",
      "5x",
      "10x",
      "25x",
      "50x",
      "100x",
      "random",
    ].map((item) => (

      <button
        key={item}
        onClick={() =>
          saveControl({
            sky: item,
          })
        }
        className={`h-24 rounded-2xl text-2xl font-black transition ${
          control.sky ===
          item
            ? "bg-green-500 text-black"
            : "bg-black border border-zinc-700 hover:bg-zinc-800"
        }`}
      >
        {item}
      </button>

    ))}

  </div>

  {/* Current Sky */}
  <div className="mt-8 bg-black border border-zinc-700 rounded-2xl p-6">

    <p className="text-zinc-500 mb-3">
      Current Sky Result
    </p>

    <h1 className="text-6xl font-black text-green-400">
      {control.sky}
    </h1>

  </div>

</div>

      {/* Live Bets */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-green-400 mb-8">
          Live Bets
        </h1>

        <div className="space-y-4">

          {[1,2,3].map(
            (bet) => (

              <div
                key={bet}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex items-center justify-between"
              >

                <div>

                  <h1 className="text-2xl font-black">
                    Player{bet}
                  </h1>

                  <p className="text-zinc-500">
                    NumCards Bet
                  </p>

                </div>

                <p className="text-green-400 text-2xl font-black">
                  ₹500
                </p>

              </div>

            )
          )}

        </div>

      </div>

      {/* System */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-green-400 mb-8">
          System Controls
        </h1>

        <div className="space-y-5">

          <button className="w-full bg-green-600 h-20 rounded-2xl text-2xl font-black">
            START GAMES
          </button>

          <button className="w-full bg-yellow-500 h-20 rounded-2xl text-2xl font-black">
            PAUSE BETTING
          </button>

          <button className="w-full bg-red-600 h-20 rounded-2xl text-2xl font-black">
            STOP SERVER
          </button>

        </div>

      </div>

    </div>

  </div>

)}

      </div>

    </main>

  );
}
      