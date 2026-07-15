import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userUid: { type: String, required: true },
  type: { type: String, enum: ["deposit", "withdraw"], required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["upi", "bank", "crypto", "wallet"], required: true },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "completed", "failed"], 
    default: "pending" 
  },
  details: {
    upiId: { type: String },
    bankAccount: { type: String },
    bankName: { type: String },
    ifscCode: { type: String },
    accountHolder: { type: String },
    cryptoAddress: { type: String },
    cryptoNetwork: { type: String },
    transactionId: { type: String },
    notes: { type: String }
  },
  adminNotes: { type: String },
  processedBy: { type: String },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
export default Transaction;