import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// In production, you would update environment variables or a database
// For demo, we'll update a JSON file
const ADMIN_CONFIG_PATH = path.join(process.cwd(), "admin-config.json");

// Default config
let adminConfig = {
  username: "malik",
  password: "king123",
  securityKey: "XG0@2024#SECURE"
};

// Load existing config
try {
  if (fs.existsSync(ADMIN_CONFIG_PATH)) {
    const data = fs.readFileSync(ADMIN_CONFIG_PATH, "utf-8");
    adminConfig = JSON.parse(data);
  }
} catch (error) {
  console.error("Failed to load admin config:", error);
}

export async function POST(request: Request) {
  try {
    const { currentUsername, currentPassword, currentKey, newUsername, newPassword, newKey } = await request.json();
    
    // Verify current credentials
    if (currentUsername !== adminConfig.username || 
        currentPassword !== adminConfig.password || 
        currentKey !== adminConfig.securityKey) {
      return NextResponse.json(
        { success: false, error: "Current credentials are incorrect" },
        { status: 401 }
      );
    }
    
    // Update credentials
    if (newUsername) adminConfig.username = newUsername;
    if (newPassword) adminConfig.password = newPassword;
    if (newKey) adminConfig.securityKey = newKey;
    
    // Save to file
    fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(adminConfig, null, 2));
    
    // Also update environment for current session
    process.env.NEXT_PUBLIC_ADMIN_USER = adminConfig.username;
    process.env.NEXT_PUBLIC_ADMIN_PASS = adminConfig.password;
    process.env.NEXT_PUBLIC_ADMIN_KEY = adminConfig.securityKey;
    
    return NextResponse.json({ 
      success: true, 
      message: "Admin credentials updated successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update credentials" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    username: adminConfig.username,
    // Don't return password or key for security
  });
}