import mongoose from "mongoose";

const BetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userUid: { type: String },
  game: { type: String, required: true },
  betType: { type: String },
  selection: { type: String },
  amount: { type: Number, required: true },
  multiplier: { type: Number, default: 1 },
  result: { type: String },
  isWin: { type: Boolean, default: false },
  winAmount: { type: Number, default: 0 },
  roundId: { type: String },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const Bet = mongoose.models.Bet || mongoose.model("Bet", BetSchema);
export default Bet;