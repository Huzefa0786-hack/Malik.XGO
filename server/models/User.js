import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  wallet: {
    type: Number,
    default: 700,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    default: "user", // user | admin
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);