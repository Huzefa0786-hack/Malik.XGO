import express from "express";

const router = express.Router();

let gameState = {
  gameStatus: "ACTIVE", // ACTIVE, PAUSED, STOPPED
  currentRound: "round-1",
  roundStartTime: new Date(),
  roundEndTime: new Date(Date.now() + 30000),
  timer: 30
};

// Get game control state
router.get("/", (req, res) => {
  res.json(gameState);
});

// Update game state (admin only - add middleware later)
router.post("/update", (req, res) => {
  const { gameStatus, timer } = req.body;
  if (gameStatus) gameState.gameStatus = gameStatus;
  if (timer) gameState.timer = timer;
  res.json({ success: true, gameState });
});

// Start new round
router.post("/new-round", (req, res) => {
  const roundNumber = parseInt(gameState.currentRound.split("-")[1]) + 1;
  gameState.currentRound = `round-${roundNumber}`;
  gameState.roundStartTime = new Date();
  gameState.roundEndTime = new Date(Date.now() + 30000);
  gameState.timer = 30;
  res.json({ success: true, round: gameState.currentRound });
});

export default router;