import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  await connectDB();

  const { userId, amount } = await req.json();

  const user = await User.findById(userId);

  if (!user) {
    return Response.json({ error: "User not found" });
  }

  user.wallet += amount;
  await user.save();

  return Response.json({
    message: "Wallet updated",
    wallet: user.wallet,
  });
}