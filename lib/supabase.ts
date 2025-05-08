import { createClient } from "@supabase/supabase-js"
import { supabaseEnv } from "./supabase-env"

// Initialize the Supabase client with validated environment variables
export const supabase = createClient(
  supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Service role client for admin operations
export const supabaseAdmin = createClient(
  supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseEnv.SUPABASE_SERVICE_ROLE_KEY
)
