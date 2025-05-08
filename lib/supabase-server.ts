import type { Database } from "@/types/supabase"
import type { cookies } from "next/headers"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: { "Content-Type": "application/json" },
    },
  })
}
