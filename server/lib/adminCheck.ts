import User from "@/models/User";
import { connectDB } from "@/lib/db";

export const isAdmin = async () => {
  await connectDB();

  const user = await User.findOne({ role: "admin" });

  return !!user;
};