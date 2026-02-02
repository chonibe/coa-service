import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { cookies } from "next/headers"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

/**
 * Creates a Supabase client for Next.js Route Handlers with proper cookie management
 * This ensures PKCE flow works correctly by properly storing/retrieving the code_verifier cookie
 * 
 * IMPORTANT: This uses @supabase/ssr which properly handles PKCE code_verifier cookies
 * that are required for OAuth authentication flows.
 */
export const createClient = (cookieStore?: ReadonlyRequestCookies) => {
  const store = cookieStore ?? cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            store.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            console.warn('[supabase-server] Cookie set failed:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            store.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            console.warn('[supabase-server] Cookie remove failed:', error)
          }
        },
      },
    }
  )
}
