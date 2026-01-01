import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let clientInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient<Schema = Database>() {
  if (clientInstance) {
    return clientInstance as ReturnType<typeof createSupabaseClient<Schema>>
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  clientInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return clientInstance as ReturnType<typeof createSupabaseClient<Schema>>
}

