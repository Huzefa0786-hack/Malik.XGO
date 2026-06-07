import express from 'express';

const router = express.Router();

let gameState = {
  gameStatus: 'ACTIVE',
  currentRound: 'round-1',
  timer: 30
};

router.get('/', (req, res) => {
  res.json(gameState);
});

export default router;