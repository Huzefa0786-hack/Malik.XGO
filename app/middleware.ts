import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only protect /admin route
  if (pathname.startsWith("/admin")) {
    // Skip admin-login page
    if (pathname === "/admin-login") {
      return NextResponse.next();
    }
    
    const adminLoggedIn = request.cookies.get("admin")?.value;
    
    if (!adminLoggedIn || adminLoggedIn !== "true") {
      const url = new URL("/admin-login", request.url);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};