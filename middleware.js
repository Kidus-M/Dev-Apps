// middleware.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  // Clone request headers to avoid modifying the original
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname) // Pass pathname for potential server use

  // Create an outgoing response object (will be updated by Supabase helper)
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("MW ERROR: Missing Supabase env vars!")
    return response; // Allow request if Supabase isn't configured
  }

  // Create Supabase client configured for middleware
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ // Recreate response to apply cookie changes
          request: { headers: request.headers },
        })
        response.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ // Recreate response to apply cookie changes
          request: { headers: request.headers },
        })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  // --- IMPORTANT: Refresh session ---
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Redirect logged-in users from auth pages ---
  if (user && (pathname === '/signin' || pathname === '/signup' || pathname === '/forgot-password')) {
      console.log("MW: User logged in, redirecting from auth page...");
      // Redirect to a generic dashboard first, let that page fetch role
      return NextResponse.redirect(new URL('/dashboard-redirect', request.url))
  }

   // --- Redirect logged-in users from landing page ---
   if (user && pathname === '/') {
      console.log("MW: User logged in, redirecting from landing page...");
      // Redirect to a generic dashboard first
      return NextResponse.redirect(new URL('/dashboard-redirect', request.url))
  }

  // --- Protect dashboard routes ---
  const protectedRoutes = ['/developer', '/tester', '/dashboard-redirect']; // Add routes needing login
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
      console.log("MW: User not logged in, redirecting to signin from protected route...");
      return NextResponse.redirect(new URL('/signin', request.url));
  }

  // --- Role-specific protection (Requires fetching role - complex in MW) ---
  // We'll handle role checks on the specific dashboard pages for now.
  // Example (if role check WAS done here):
  // if (user && pathname.startsWith('/developer') && userRole !== 'developer') {
  //    return NextResponse.redirect(new URL('/unauthorized', request.url));
  // }
  // if (user && pathname.startsWith('/tester') && userRole !== 'tester') {
  //    return NextResponse.redirect(new URL('/unauthorized', request.url));
  // }

  // If no redirects needed, return the response (potentially with updated cookies)
  return response;
}

// --- Configure Middleware Matcher ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (or your public assets folder)
     * Feel free to modify this pattern to include more exceptions.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}