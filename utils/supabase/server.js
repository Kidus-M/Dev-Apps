// utils/supabase/server.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers' // If using App Router primarily, but can adapt

// Note: Using 'cookies' directly from 'next/headers' is more App Router style.
// For Pages Router (getServerSideProps), you receive 'req' and 'res'.
// We might need a slightly different approach for Pages Router SSR.
// Let's create a version for Pages Router context.

// --- Version for Pages Router getServerSideProps ---
import { createServerClient as createPagesServerClient } from '@supabase/ssr'

export function createServerClient(req, res) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("ERROR: Missing Supabase environment variables in server!");
    }

    return createPagesServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                return req.cookies[name];
            },
            set(name, value, options) {
                // Requires 'res' object from getServerSideProps context
                // This helper might be better used within getServerSideProps directly
                // For middleware, we use a different helper.
                console.warn("Set cookie called in server helper, ensure 'res' object is available if needed.");
                // Example if 'res' is available:
                // res.setHeader('Set-Cookie', serialize(name, value, options));
            },
            remove(name, options) {
                console.warn("Remove cookie called in server helper, ensure 'res' object is available if needed.");
                // Example if 'res' is available:
                // res.setHeader('Set-Cookie', serialize(name, '', options));
            },
        },
    });
}
// --- End Pages Router Version ---


// Keep this structure if migrating to App Router later or for API routes
export function createServerClientWithCookies() {
    const cookieStore = cookies() // Needs Next.js 13+ App Router context generally
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("ERROR: Missing Supabase environment variables in server (cookie context)!");
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
        get(name) {
            return cookieStore.get(name)?.value
        },
        set(name, value, options) {
            cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
            cookieStore.set({ name, value: '', ...options })
        },
        },
    })
}