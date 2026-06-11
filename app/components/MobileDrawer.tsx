import { Home, User, History } from "lucide-react";

const menuItems = [
  { href: "/", label: "Dashboard", icon: <Home size={20} /> },
  // Remove this line: { href: "/numcards", label: "NumCards", icon: "🎴" },
  { href: "/color-trade", label: "Color Trade", icon: "🎨" },
  { href: "/mines", label: "Mines", icon: "💣" },
  { href: "/sky", label: "Sky Aviator", icon: "✈️" },
  { href: "/spin", label: "Spin Wheel", icon: "🎡" },
  { href: "/plinko", label: "Plinko", icon: "⚽" },
  { href: "/lottery", label: "Lottery", icon: "🎟️" },
  { href: "/quotex", label: "Trading", icon: "📈" },
  { href: "/history", label: "History", icon: <History size={20} /> },
  { href: "/profile", label: "Profile", icon: <User size={20} /> },
];