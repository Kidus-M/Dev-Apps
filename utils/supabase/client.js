// utils/supabase/client.js
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Define variable to hold Supabase URL and Anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Throw error if Supabase URL or Anon key is missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERROR: Missing Supabase environment variables in client!");
    // Consider throwing an error or handling more gracefully
  }

  // Create and return Supabase client
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}