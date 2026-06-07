"use client";

import { AuthProvider } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </AuthProvider>
  );
}