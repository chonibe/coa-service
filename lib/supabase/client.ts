import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

let warnedMissingBrowserEnv = false

/** Shown in UI when NEXT_PUBLIC_* Supabase vars are absent (usually local dev). */
export const SUPABASE_BROWSER_ENV_HINT =
  'Supabase URL and anon key are missing. Run `vercel env pull` or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'

export function isSupabaseBrowserConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return Boolean(url && key)
}

/**
 * Browser Supabase client. Uses cookies (via createBrowserClient) so the session
 * stays in sync with the server—auth callback and API routes use the same cookies.
 *
 * In production, missing env throws. In development, returns `null` so the shell can load;
 * callers must guard before using auth/database methods.
 */
export function createClient<Schema = Database>() {
  if (clientInstance) {
    return clientInstance as ReturnType<typeof createBrowserClient<Schema>>
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing Supabase environment variables')
    }
    if (!warnedMissingBrowserEnv) {
      warnedMissingBrowserEnv = true
      console.warn(`[supabase/client] ${SUPABASE_BROWSER_ENV_HINT}`)
    }
    return null
  }

  clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return clientInstance as ReturnType<typeof createBrowserClient<Schema>>
}
