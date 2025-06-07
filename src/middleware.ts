import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware can be used for more complex auth scenarios like token refreshing,
// or protecting multiple routes based on roles from the token.
// For the current setup, AdminAuthGuard client-side component handles basic protection.
// If httpOnly cookies are used exclusively for session management, this middleware is crucial.

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('sessionToken')?.value;
  const { pathname } = request.nextUrl;

  // Example: Protect all /admin routes if sessionToken is not present or invalid
  if (pathname.startsWith('/admin')) {
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Here you could add token validation logic (e.g., using a library like 'jose' for JWT verification)
    // For simplicity, we are relying on the presence of the token.
    // Actual validation should happen on API routes or server actions consuming the token.
  }
  
  // Example: Redirect logged-in users from login/verify-otp pages
  if (sessionToken && (pathname === '/login' || pathname === '/verify-otp')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*', // Protect admin routes
    '/login',         // Redirect if logged in
    '/verify-otp',    // Redirect if logged in
  ],
}
