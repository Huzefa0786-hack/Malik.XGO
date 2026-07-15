import { NextResponse } from "next/server";

// Admin credentials (in production, store these in environment variables)
const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || "malik";
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || "king123";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || "XG0@2024#SECURE";

export async function POST(request: Request) {
  try {
    const { username, password, securityKey } = await request.json();
    
    // Check all three credentials
    if (username === ADMIN_USER && password === ADMIN_PASS && securityKey === ADMIN_KEY) {
      const response = NextResponse.json({ success: true });
      
      // Set secure HTTP-only cookie
      response.cookies.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      return response;
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// Check admin session
export async function GET(request: Request) {
  const cookies = request.headers.get("cookie");
  const hasSession = cookies?.includes("admin_session=authenticated");
  
  return NextResponse.json({ authenticated: hasSession });
}

// Logout admin
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  return response;
}