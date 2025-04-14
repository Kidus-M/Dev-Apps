// middleware.js
import { NextResponse } from 'next/server';

// Minimal middleware function - allows all requests for now
// We will add Firebase authentication checks here later.
export function middleware(request) {
  // You can optionally log the path being accessed
  // console.log('Middleware processing:', request.nextUrl.pathname);

  // Let the request continue to the intended page
  return NextResponse.next();
}

// Matcher configuration - Apply middleware to relevant paths
// (This is the same config as before, adjust if needed)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (or your public assets folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}