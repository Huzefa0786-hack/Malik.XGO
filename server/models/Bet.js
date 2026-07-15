import mongoose from "mongoose";

const BetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userUid: { type: String, required: true },
  game: { type: String, required: true },
  betType: { type: String },
  selection: { type: String },
  amount: { type: Number, required: true },
  multiplier: { type: Number, default: 1 },
  result: { type: String },
  isWin: { type: Boolean, default: false },
  winAmount: { type: Number, default: 0 },
  roundId: { type: String, default: "" },
  status: { 
    type: String, 
    enum: ["pending", "completed", "cancelled"], 
    default: "pending" 
  },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
BetSchema.index({ userId: 1, createdAt: -1 });
BetSchema.index({ game: 1, createdAt: -1 });

const Bet = mongoose.models.Bet || mongoose.model("Bet", BetSchema);
export default Bet;