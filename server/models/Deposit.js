import mongoose from "mongoose";

const DepositSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const Deposit = mongoose.models.Deposit || mongoose.model("Deposit", DepositSchema);
export default Deposit;