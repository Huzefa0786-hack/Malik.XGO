import type { Metadata } from "next";
// Ignore missing type declarations for global CSS side-effect import in this environment
// @ts-ignore
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Malik.XGO - Premium Gaming Platform",
  description: "Play, win and enjoy premium gaming experience with instant deposits and withdrawals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}