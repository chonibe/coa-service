import { createClient } from "@/lib/supabase/server";

/**
 * Centralized utility for accessing enriched collector data.
 * Always targets the collector_profile_comprehensive view to ensure
 * the Data Enrichment Protocol (PII Bridge) is followed.
 */

export interface CollectorProfile {
  user_email: string;
  user_id: string | null;
  display_name: string;
  display_phone: string | null;
  total_editions: number;
  authenticated_editions: number;
  total_orders: number;
  total_spent: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
  is_kickstarter_backer: boolean;
  pii_sources: {
    profile?: any;
    shopify?: any;
    warehouse?: any;
  };
}

/**
 * Fetch a single collector by email or ID
 */
export async function getCollectorProfile(identifier: string): Promise<CollectorProfile | null> {
  const supabase = createClient();
  
  const isEmail = identifier.includes('@');
  const query = supabase
    .from('collector_profile_comprehensive')
    .select('*');

  if (isEmail) {
    query.eq('user_email', identifier.toLowerCase().trim());
  } else {
    query.eq('user_id', identifier);
  }

  const { data, error } = await query.maybeSingle();
  
  if (error) {
    console.error(`[Collectors Lib] Error fetching profile for ${identifier}:`, error);
    return null;
  }

  return data as CollectorProfile;
}

/**
 * Search collectors with pagination
 */
export async function searchCollectors(options: {
  query?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  const { query = '', limit = 50, offset = 0 } = options;

  let dbQuery = supabase
    .from('collector_profile_comprehensive')
    .select('*', { count: 'exact' })
    .order('last_purchase_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query) {
    dbQuery = dbQuery.or(
      `user_email.ilike.%${query}%,display_name.ilike.%${query}%,display_phone.ilike.%${query}%`
    );
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error('[Collectors Lib] Search error:', error);
    throw error;
  }

  return {
    collectors: (data || []) as CollectorProfile[],
    total: count || 0
  };
}

