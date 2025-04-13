// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Basic check to ensure variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase environment variables!');
  // In a real app, you might want to throw an error or handle this differently
  // For now, we'll proceed but Supabase calls will fail.
}

// Initialize the client. Export it for use in pages/components.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);