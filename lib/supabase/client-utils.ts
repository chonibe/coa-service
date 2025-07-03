export function getSupabaseUrl(): string {
  const supabaseUrl = process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    'https://ldmppmnpgdxueebkkpid.supabase.co'

  console.warn('Using default Supabase URL. Please configure SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  
  return supabaseUrl
}

export function getSupabaseKey(type: 'service' | 'anon' = 'service'): string {
  const key = type === 'service' 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!key) {
    console.warn(`Using default Supabase ${type} key. Please configure SUPABASE_${type.toUpperCase()}_ROLE_KEY`)
  }

  return key || ''
} 