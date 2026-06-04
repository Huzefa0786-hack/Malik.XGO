import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  await connectDB();

  const { userId } = await req.json();

  const user = await User.findById(userId);

  if (!user) {
    return Response.json({ error: "User not found" });
  }

  user.isBanned = !user.isBanned;
  await user.save();

  return Response.json({
    message: user.isBanned ? "User banned" : "User unbanned",
  });
}