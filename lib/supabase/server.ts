import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export function createClient() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    });
    return supabase;
  } catch (error) {
    console.error('Supabase client initialization error:', error);
    throw new Error('Failed to initialize Supabase client');
  }
}

export async function safeSupabaseCall<T>(
  callback: (supabase: ReturnType<typeof createClient>) => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const supabase = createClient();
    const data = await callback(supabase);
    return { data, error: null };
  } catch (error) {
    console.error('Supabase operation error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}

// Utility for common database operations
export const supabaseUtils = {
  select: async <T>(table: string, query?: Record<string, any>) => {
    return safeSupabaseCall(async (supabase) => {
      let dbQuery = supabase.from(table).select('*');
      
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          dbQuery = dbQuery.eq(key, value);
        });
      }

      const { data, error } = await dbQuery;
      
      if (error) throw error;
      return data as T[];
    });
  },

  insert: async <T>(table: string, record: T) => {
    return safeSupabaseCall(async (supabase) => {
      const { data, error } = await supabase.from(table).insert(record).select();
      
      if (error) throw error;
      return data;
    });
  },

  update: async <T>(table: string, id: string | number, updates: Partial<T>) => {
    return safeSupabaseCall(async (supabase) => {
      const { data, error } = await supabase.from(table).update(updates).eq('id', id).select();
      
      if (error) throw error;
      return data;
    });
  }
}; 