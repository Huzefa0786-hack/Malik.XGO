import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL!;

export const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(MONGO_URL);
};