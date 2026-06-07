"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import axios from "axios";

interface WalletContextType {
  wallet: number;
  setWallet: (value: number) => void;
  loadWallet: () => Promise<void>;
}

const WalletContext =
  createContext<WalletContextType>({
    wallet: 0,
    setWallet: () => {},
    loadWallet: async () => {},
  });

export function WalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wallet, setWallet] =
    useState(0);

  const loadWallet =
    async () => {
      try {
        const user =
          JSON.parse(
            localStorage.getItem(
              "user"
            ) || "{}"
          );

        if (!user?.uid) return;

        const res =
          await axios.get(
            `http://localhost:5000/api/wallet/${user.uid}`
          );

        setWallet(
          res.data.wallet || 0
        );
      } catch (error) {
        console.log(
          "Wallet Error:",
          error
        );
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

export const useWallet =
  () => useContext(
    WalletContext
  );