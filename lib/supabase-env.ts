import { z } from 'zod'

// Define the schema for Supabase environment variables
const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

// Type for the validated environment variables
export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>

// Function to validate and get Supabase environment variables
export function getSupabaseEnv(): SupabaseEnv {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  try {
    return supabaseEnvSchema.parse(env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'))
      throw new Error(
        `Missing or invalid Supabase environment variables: ${missingVars.join(', ')}`
      )
    }
    throw error
  }
}

// Export validated environment variables
export const supabaseEnv = getSupabaseEnv() 