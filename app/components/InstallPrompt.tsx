"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowPrompt(false);
      });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-zinc-900 border border-green-500 rounded-2xl p-4 z-50 shadow-2xl">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="text-black" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">Install Malik.XGO App</h3>
          <p className="text-sm text-zinc-400">Get faster gameplay and instant notifications</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleInstall} className="bg-green-500 text-black px-4 py-1.5 rounded-lg text-sm font-bold">
              Install
            </button>
            <button onClick={() => setShowPrompt(false)} className="bg-zinc-800 px-4 py-1.5 rounded-lg text-sm">
              Later
            </button>
          </div>
        </div>
        <button onClick={() => setShowPrompt(false)} className="text-zinc-500">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}