"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  role?: string;
  [key: string]: unknown;
};

export default function AdminTestPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    console.log("User data:", parsedUser);
    console.log("User role:", parsedUser.role);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Test Page</h1>
      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">User Info:</h2>
        <pre className="text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
        {user.role === "admin" ? (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
            ✅ Admin access granted!
            <button 
              onClick={() => router.push("/admin")}
              className="ml-4 bg-green-500 text-black px-4 py-2 rounded-lg"
            >
              Go to Admin Panel
            </button>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            ❌ You don't have admin access. Role: {user.role}
          </div>
        )}
      </div>
    </div>
  );
}