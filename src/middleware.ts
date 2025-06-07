
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware logic is simplified as the 'sessionToken' httpOnly cookie
// might not be set if auth actions (like verifyOtpAction) are fully client-side
// and rely on localStorage for token management (via AuthContext).
// Client-side guards (e.g., AdminAuthGuard) and page-level useEffect hooks
// will be primarily responsible for route protection and redirection based on auth state.

export function middleware(request: NextRequest) {
  // const sessionToken = request.cookies.get('sessionToken')?.value;
  // const { pathname } = request.nextUrl;

  // Previous logic for redirecting based on sessionToken cookie:
  // if (pathname.startsWith('/admin')) {
  //   if (!sessionToken) {
  //     const loginUrl = new URL('/login', request.url);
  //     loginUrl.searchParams.set('redirect', pathname);
  //     return NextResponse.redirect(loginUrl);
  //   }
  // }
  // if (sessionToken && (pathname === '/login' || pathname === '/verify-otp')) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  // For now, allow requests to pass through. Client-side checks will handle auth.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/verify-otp',
  ],
}
