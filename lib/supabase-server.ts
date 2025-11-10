import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { cookies as defaultCookies } from "next/headers"

type CookieStore = ReturnType<typeof defaultCookies>

export const createClient = (cookieStore?: CookieStore) => {
  const store = cookieStore ?? defaultCookies()

  return createRouteHandlerClient<Database>({
    cookies: () => store,
  })
}
