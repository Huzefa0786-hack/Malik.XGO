"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface GameState {
  timer: number;
  lastResult: any;
  roundId: string;
  isBettingOpen: boolean;
  gameStatus: "RUNNING" | "PAUSED" | "STOPPED";
}

interface GameContextType {
  gameState: GameState;
  updateGameState: (state: Partial<GameState>) => void;
  socket: Socket | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    timer: 30,
    lastResult: null,
    roundId: `round-${Date.now()}`,
    isBettingOpen: true,
    gameStatus: "RUNNING"
  });

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("timer_update", (value: number) => {
      setGameState(prev => ({ ...prev, timer: value, isBettingOpen: value > 0 }));
    });

    newSocket.on("result_update", (result: any) => {
      setGameState(prev => ({ ...prev, lastResult: result, roundId: `round-${Date.now()}` }));
    });

    newSocket.on("round_start", (roundId: string) => {
      setGameState(prev => ({ ...prev, roundId, timer: 30, isBettingOpen: true }));
    });

    newSocket.on("game_status", (status: "RUNNING" | "PAUSED" | "STOPPED") => {
      setGameState(prev => ({ ...prev, gameStatus: status }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateGameState = (state: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...state }));
  };

  return (
    <GameContext.Provider value={{ gameState, updateGameState, socket }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}