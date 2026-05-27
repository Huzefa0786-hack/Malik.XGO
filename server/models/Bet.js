import mongoose from "mongoose";

const betSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,

    selection: String,

    amount: Number,

    roundId: String,

    result: String,

    status: {
      type: String,
      default: "pending",
    },

    winAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bet", betSchema);