import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Browser Supabase client. Uses cookies (via createBrowserClient) so the session
 * stays in sync with the server—auth callback and API routes use the same cookies.
 */
export function createClient<Schema = Database>() {
  if (clientInstance) {
    return clientInstance as ReturnType<typeof createBrowserClient<Schema>>
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return clientInstance as ReturnType<typeof createBrowserClient<Schema>>
}

