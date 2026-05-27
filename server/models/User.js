import mongoose from "mongoose";

const userSchema =
  new mongoose.Schema(
    {
      uid: {
  type: String,
  unique: true,
},
      banned: {
  type: Boolean,
  default: false,
},
      name: String,

      email: {
        type: String,
        unique: true,
      },

      password: String,

      wallet: {
        type: Number,
        default: 1000,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "User",
  userSchema
);