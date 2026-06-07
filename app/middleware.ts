import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  const publicPaths = ['/login', '/register', '/reset-password'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/profile/:path*',
    '/deposit/:path*',
    '/withdraw/:path*',
    '/numcards/:path*',
    '/mines/:path*',
    '/sky/:path*',
    '/spin/:path*',
    '/lottery/:path*',
    '/plinko/:path*',
  ],
};