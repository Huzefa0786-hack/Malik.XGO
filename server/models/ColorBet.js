import mongoose from "mongoose";

const ColorBetSchema = new mongoose.Schema({
  userId: String,
  username: String,
  period: String,
  type: String,
  value: String,
  amount: Number,
  status: {
    type: String,
    default: "pending",
  },
});

export default mongoose.model("ColorBet", ColorBetSchema);