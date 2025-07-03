import { createClient } from '@supabase/supabase-js'
import type { Database } from "@/types/supabase"
import type { cookies } from "next/headers"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export function createServerSupabaseClient(cookieStore?: ReturnType<typeof cookies>) {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: { "Content-Type": "application/json" },
    },
  })
}

// Admin client with service role key
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

// Regular client with anon key
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Function to get admin client
export function getSupabaseAdmin() {
  return supabaseAdmin
}
