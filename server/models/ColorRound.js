import mongoose from "mongoose";

const ColorRoundSchema = new mongoose.Schema({
  period: String,
  resultNumber: Number,
  resultColor: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ColorRound", ColorRoundSchema);