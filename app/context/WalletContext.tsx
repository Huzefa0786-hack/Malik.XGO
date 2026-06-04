"use client";

import axios from "axios";
import {
  createContext,
  useContext,
  useState,
} from "react";

type WalletContextType = {
  wallet: number;
  setWallet: React.Dispatch<
    React.SetStateAction<number>
  >;
  loadWallet: () => Promise<void>;
};
const WalletContext =
  createContext<WalletContextType | null>(
    null
  );

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wallet, setWallet] =
    useState(5000);

  const loadWallet = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/wallet",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWallet(res.data.wallet);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        setWallet,
        loadWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context =
    useContext(WalletContext);

  if (!context) {
    throw new Error(
      "WalletProvider missing"
    );
  }

  return context;
};