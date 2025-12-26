// Middleware for authentication and routing
// Handles redirects based on auth status

import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Get auth token from cookies
  const token = request.cookies.get('accessToken')?.value;

  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/health'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (token && (pathname.startsWith('/auth/'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT authenticated and tries to access protected pages, redirect to login
  if (!token && !isPublicPath && pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect root to dashboard if authenticated, or login if not
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except static files and api routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
