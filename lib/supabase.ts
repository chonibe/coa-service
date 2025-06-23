import { createClient } from "@supabase/supabase-js"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Logging function
function logSupabaseConfig(type: string) {
  console.log(\`Supabase \${type} Client Configuration:\`, {
    url: supabaseUrl ? 'Configured' : 'MISSING',
    anonKey: supabaseAnonKey ? 'Configured' : 'MISSING',
    serviceKey: supabaseServiceKey ? 'Configured' : 'MISSING'
  })
}

// For client components
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    console.warn("Attempted to use client Supabase instance on server")
    return null
  }

  logSupabaseConfig('Client')

  if (!clientInstance && supabaseUrl && supabaseAnonKey) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })
      console.log("Client Supabase instance created successfully")
    } catch (error) {
      console.error("Error creating client Supabase instance:", error)
    }
  }

  return clientInstance
}

// For server components and API routes
let adminInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    console.warn("Attempted to use admin Supabase instance on client")
    return null
  }

  logSupabaseConfig('Admin')

  if (!adminInstance && supabaseUrl && supabaseServiceKey) {
    try {
      adminInstance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
      console.log("Admin Supabase instance created successfully")
    } catch (error) {
      console.error("Error creating admin Supabase instance:", error)
    }
  }

  return adminInstance
}

// Create and export the admin instance directly for server-side use
// This is needed for compatibility with existing code
export const supabaseAdmin =
  typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  if (typeof window !== "undefined") {
    // Client-side check
    return Boolean(supabaseUrl && supabaseAnonKey)
  }
  // Server-side check
  return Boolean(supabaseUrl && supabaseServiceKey)
}

// For backwards compatibility - will use the appropriate client based on context
// This should be avoided in favor of the specific functions above
export const supabase = typeof window !== "undefined" ? getSupabaseClient() : getSupabaseAdmin()
