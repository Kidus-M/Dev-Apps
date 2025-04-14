// utils/supabase/client.js
// Renamed - Keep this file for Supabase Storage Client
import { createClient } from '@supabase/supabase-js' // Use the standard client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('WARN: Missing Supabase environment variables! Supabase Storage might fail.');
  // Return a dummy object or null if you prefer strict checking elsewhere
}

// Create and export the client - primarily for Storage now
export const supabase = createClient(supabaseUrl, supabaseAnonKey);