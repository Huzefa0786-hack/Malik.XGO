"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface WalletContextType {
  wallet: number;
  setWallet: (value: number) => void;
  loadWallet: () => Promise<void>;
  updateWallet: (amount: number, type: "add" | "remove") => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState(0);

  const loadWallet = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await axios.get("http://localhost:5002/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setWallet(response.data.balance);
      }
    } catch (error) {
      console.error("Failed to load wallet:", error);
    }
  };

  const updateWallet = async (amount: number, type: "add" | "remove") => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    
    try {
      const response = await axios.put(
        "http://localhost:5002/api/wallet/update",
        { amount, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWallet(response.data.wallet);
      
      // Also update user object in localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.wallet = response.data.wallet;
        localStorage.setItem("user", JSON.stringify(user));
      }
      
      return true;
    } catch (error) {
      console.error("Failed to update wallet:", error);
      return false;
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, setWallet, loadWallet, updateWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}