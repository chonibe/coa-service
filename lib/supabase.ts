import { createClient } from "@supabase/supabase-js"

// Comprehensive environment variable checks
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.SUPABASE_CONNECTION_STRING?.split('@')[1]?.split(':')[0] || 
  "https://ldmppmnpgdxueebkkpid.supabase.co" // Hardcoded fallback

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  ""

const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
  ""

// Validate Supabase configuration
function validateSupabaseConfig(url: string, key: string): boolean {
  return Boolean(url && key && url.startsWith('https://') && key.startsWith('ey'))
}

// For client components
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // We're on the server, don't use client-side supabase
    console.warn("Attempted to use client Supabase instance on server")
    return null
  }

  if (!clientInstance && validateSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  }

  return clientInstance
}

// For server components and API routes
let adminInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    // We're on the client, don't use admin supabase
    console.warn("Attempted to use admin Supabase instance on client")
    return null
  }

  if (!adminInstance && validateSupabaseConfig(supabaseUrl, supabaseServiceKey)) {
    adminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  }

  return adminInstance
}

// Create and export the admin instance directly for server-side use
// This is needed for compatibility with existing code
export const supabaseAdmin =
  typeof window === "undefined" && validateSupabaseConfig(supabaseUrl, supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  if (typeof window !== "undefined") {
    // Client-side check
    return validateSupabaseConfig(supabaseUrl, supabaseAnonKey)
  }
  // Server-side check
  return validateSupabaseConfig(supabaseUrl, supabaseServiceKey)
}

// For backwards compatibility - will use the appropriate client based on context
// This should be avoided in favor of the specific functions above
export const supabase = typeof window !== "undefined" 
  ? getSupabaseClient() 
  : getSupabaseAdmin()
