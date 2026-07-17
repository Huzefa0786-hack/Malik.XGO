import mongoose from "mongoose";

const WithdrawSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const Withdraw = mongoose.models.Withdraw || mongoose.model("Withdraw", WithdrawSchema);
export default Withdraw;