import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Missing Supabase environment variables')
  } else {
    throw new Error('Missing Supabase environment variables')
  }
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Service role client for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!
)
