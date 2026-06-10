import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "./context/GameContext";

export const metadata: Metadata = {
  title: "Malik.XGO - Premium Gaming Platform",
  description: "Play, win and enjoy premium gaming experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}