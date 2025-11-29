import { createClient } from '@/lib/supabase/server';
import type { CollectorAccount, CollectorAccountType, CollectorAccountStatus } from './types';

/**
 * Get or create a collector account
 * Creates account if it doesn't exist
 */
export async function getOrCreateCollectorAccount(
  collectorIdentifier: string,
  accountType: CollectorAccountType,
  vendorId?: number
): Promise<CollectorAccount> {
  const supabase = createClient();

  // Try to get existing account
  const { data: existing, error: fetchError } = await supabase
    .from('collector_accounts')
    .select('*')
    .eq('collector_identifier', collectorIdentifier)
    .single();

  if (existing && !fetchError) {
    return {
      id: existing.id,
      collectorIdentifier: existing.collector_identifier,
      accountType: existing.account_type,
      vendorId: existing.vendor_id || undefined,
      accountStatus: existing.account_status,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    };
  }

  // Create new account if it doesn't exist
  const { data: newAccount, error: createError } = await supabase
    .from('collector_accounts')
    .insert({
      collector_identifier: collectorIdentifier,
      account_type: accountType,
      vendor_id: vendorId || null,
      account_status: 'active',
    })
    .select()
    .single();

  if (createError || !newAccount) {
    if (createError?.code === 'PGRST205') {
      // Table doesn't exist - migration hasn't been run
      console.error('Error: collector_accounts table does not exist. Please run the base migration: 20250202000000_collector_banking_system.sql');
      throw new Error('Database migration required: Please run the collector banking system migration first. The collector_accounts table does not exist.');
    }
    console.error('Error creating collector account:', createError);
    throw new Error(`Failed to create collector account: ${createError?.message || 'Unknown error'}`);
  }

  return {
    id: newAccount.id,
    collectorIdentifier: newAccount.collector_identifier,
    accountType: newAccount.account_type,
    vendorId: newAccount.vendor_id || undefined,
    accountStatus: newAccount.account_status,
    createdAt: newAccount.created_at,
    updatedAt: newAccount.updated_at,
  };
}

/**
 * Update account status
 */
export async function updateAccountStatus(
  collectorIdentifier: string,
  status: CollectorAccountStatus
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('collector_accounts')
    .update({ account_status: status })
    .eq('collector_identifier', collectorIdentifier);

  if (error) {
    if (error.code === 'PGRST205') {
      // Table doesn't exist - migration hasn't been run
      console.error('Error: collector_accounts table does not exist. Please run the base migration: 20250202000000_collector_banking_system.sql');
      throw new Error('Database migration required: Please run the collector banking system migration first. The collector_accounts table does not exist.');
    }
    console.error('Error updating account status:', error);
    throw new Error(`Failed to update account status: ${error.message}`);
  }
}

/**
 * Ensure collector account exists (alias for getOrCreateCollectorAccount)
 * Creates account if it doesn't exist
 */
export async function ensureCollectorAccount(
  collectorIdentifier: string,
  accountType: CollectorAccountType,
  vendorId?: number
): Promise<CollectorAccount> {
  return getOrCreateCollectorAccount(collectorIdentifier, accountType, vendorId);
}

/**
 * Get account by identifier
 */
export async function getCollectorAccount(
  collectorIdentifier: string
): Promise<CollectorAccount | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('collector_accounts')
    .select('*')
    .eq('collector_identifier', collectorIdentifier)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    if (error.code === 'PGRST205') {
      // Table doesn't exist - migration hasn't been run
      console.error('Error: collector_accounts table does not exist. Please run the base migration: 20250202000000_collector_banking_system.sql');
      throw new Error('Database migration required: Please run the collector banking system migration first. The collector_accounts table does not exist.');
    }
    console.error('Error getting collector account:', error);
    throw new Error(`Failed to get collector account: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    collectorIdentifier: data.collector_identifier,
    accountType: data.account_type,
    vendorId: data.vendor_id || undefined,
    accountStatus: data.account_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

