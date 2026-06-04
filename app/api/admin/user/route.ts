import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  await connectDB();

  const users = await User.find().select("-__v");

  return Response.json(users);
}