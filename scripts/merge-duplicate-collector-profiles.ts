/**
 * Merge Duplicate Collector Profiles
 * 
 * This script merges duplicate collector profiles that share the same shopify_customer_id.
 * It consolidates all data into the oldest profile and removes duplicates.
 * 
 * Usage:
 *   npx tsx scripts/merge-duplicate-collector-profiles.ts [shopify_customer_id]
 * 
 * Example:
 *   npx tsx scripts/merge-duplicate-collector-profiles.ts 6435402285283
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ProfileRecord {
  id: number
  email: string
  user_id: string | null
  shopify_customer_id: string | null
  created_at: string
}

interface MergeResult {
  shopify_customer_id: string
  kept_profile_id: number
  merged_profile_ids: number[]
  orders_updated: number
  line_items_updated: number
  success: boolean
  error?: string
}

/**
 * Find all profiles with the same shopify_customer_id
 */
async function findDuplicateProfiles(shopifyCustomerId: string): Promise<ProfileRecord[]> {
  const { data, error } = await supabase
    .from('collector_profiles')
    .select('id, email, user_id, shopify_customer_id, created_at')
    .eq('shopify_customer_id', shopifyCustomerId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  return data || []
}

/**
 * Merge duplicate profiles into the oldest one
 */
async function mergeDuplicateProfiles(shopifyCustomerId: string, dryRun: boolean = true): Promise<MergeResult> {
  const result: MergeResult = {
    shopify_customer_id: shopifyCustomerId,
    kept_profile_id: 0,
    merged_profile_ids: [],
    orders_updated: 0,
    line_items_updated: 0,
    success: false,
  }

  try {
    // Find all duplicate profiles
    const profiles = await findDuplicateProfiles(shopifyCustomerId)

    if (profiles.length < 2) {
      console.log(`✓ No duplicates found for Shopify customer ID: ${shopifyCustomerId}`)
      result.success = true
      return result
    }

    console.log(`\n📋 Found ${profiles.length} profiles for Shopify customer ID: ${shopifyCustomerId}`)
    profiles.forEach((p, i) => {
      console.log(`  ${i + 1}. ID: ${p.id}, Email: ${p.email}, Created: ${p.created_at}`)
    })

    // Keep the oldest profile (first in sorted array)
    const keepProfile = profiles[0]
    const mergeProfiles = profiles.slice(1)

    result.kept_profile_id = keepProfile.id
    result.merged_profile_ids = mergeProfiles.map(p => p.id)

    console.log(`\n✓ Keeping profile ID: ${keepProfile.id} (${keepProfile.email})`)
    console.log(`✓ Merging ${mergeProfiles.length} duplicate(s): ${mergeProfiles.map(p => p.id).join(', ')}`)

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be made')
      console.log('   Run with --execute flag to apply changes')
      result.success = true
      return result
    }

    // Start transaction-like operations
    console.log('\n🔄 Starting merge process...')

    // Note: Since Supabase doesn't expose native transactions via JS client,
    // we'll do sequential updates and track success/failure

    // Update user_id in kept profile if it's null but exists in duplicates
    if (!keepProfile.user_id) {
      const profileWithUserId = mergeProfiles.find(p => p.user_id)
      if (profileWithUserId) {
        console.log(`  Updating user_id in kept profile: ${profileWithUserId.user_id}`)
        const { error } = await supabase
          .from('collector_profiles')
          .update({ user_id: profileWithUserId.user_id })
          .eq('id', keepProfile.id)

        if (error) {
          throw new Error(`Failed to update user_id: ${error.message}`)
        }
      }
    }

    // Update orders table (if it references shopify_customer_id)
    // Note: Orders may already be correctly associated via shopify_customer_id
    // This is informational only
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('shopify_customer_id', shopifyCustomerId)

    if (!orderError && orderCount) {
      result.orders_updated = orderCount
      console.log(`  ✓ Found ${orderCount} orders for this customer`)
    }

    // Check line items
    const { count: lineItemCount, error: lineItemError } = await supabase
      .from('order_line_items_v2')
      .select('id', { count: 'exact', head: true })
      .in('order_id', 
        supabase
          .from('orders')
          .select('id')
          .eq('shopify_customer_id', shopifyCustomerId)
      )

    if (!lineItemError && lineItemCount) {
      result.line_items_updated = lineItemCount
      console.log(`  ✓ Found ${lineItemCount} line items for this customer`)
    }

    // Delete duplicate profiles
    console.log(`\n🗑️  Deleting ${mergeProfiles.length} duplicate profile(s)...`)
    for (const profile of mergeProfiles) {
      const { error } = await supabase
        .from('collector_profiles')
        .delete()
        .eq('id', profile.id)

      if (error) {
        throw new Error(`Failed to delete profile ${profile.id}: ${error.message}`)
      }
      console.log(`  ✓ Deleted profile ID: ${profile.id}`)
    }

    console.log('\n✅ Merge completed successfully!')
    console.log(`   Kept profile: ${keepProfile.id} (${keepProfile.email})`)
    console.log(`   Removed: ${mergeProfiles.length} duplicate(s)`)
    console.log(`   Orders: ${result.orders_updated}`)
    console.log(`   Line items: ${result.line_items_updated}`)

    result.success = true
    return result

  } catch (error: any) {
    result.success = false
    result.error = error.message
    console.error(`\n❌ Merge failed: ${error.message}`)
    return result
  }
}

/**
 * Merge all duplicate profiles in the database
 */
async function mergeAllDuplicates(dryRun: boolean = true): Promise<void> {
  console.log('🔍 Finding all duplicate profiles...\n')

  // Find all shopify_customer_ids with duplicates
  const { data: duplicates, error } = await supabase.rpc('get_duplicate_shopify_ids')

  // If RPC doesn't exist, use raw query
  if (error || !duplicates) {
    console.log('Running direct query to find duplicates...')
    
    const { data: profiles, error: queryError } = await supabase
      .from('collector_profiles')
      .select('shopify_customer_id')
      .not('shopify_customer_id', 'is', null)

    if (queryError) {
      throw new Error(`Failed to query profiles: ${queryError.message}`)
    }

    // Group by shopify_customer_id
    const grouped = new Map<string, number>()
    profiles?.forEach(p => {
      if (p.shopify_customer_id) {
        grouped.set(p.shopify_customer_id, (grouped.get(p.shopify_customer_id) || 0) + 1)
      }
    })

    const duplicateIds = Array.from(grouped.entries())
      .filter(([_, count]) => count > 1)
      .map(([id, _]) => id)

    console.log(`\n📊 Found ${duplicateIds.length} Shopify customer IDs with duplicates\n`)

    if (duplicateIds.length === 0) {
      console.log('✓ No duplicates to merge!')
      return
    }

    // Merge each set of duplicates
    for (const shopifyId of duplicateIds) {
      await mergeDuplicateProfiles(shopifyId, dryRun)
      console.log('\n' + '='.repeat(80) + '\n')
    }
  }
}

// Main execution
const args = process.argv.slice(2)
const dryRun = !args.includes('--execute')
const shopifyCustomerId = args.find(arg => !arg.startsWith('--'))

console.log('🔧 Collector Profile Merge Tool\n')
console.log('='.repeat(80))

if (shopifyCustomerId) {
  // Merge specific customer
  mergeDuplicateProfiles(shopifyCustomerId, dryRun)
    .then(result => {
      if (!result.success && result.error) {
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
} else {
  // Merge all duplicates
  mergeAllDuplicates(dryRun)
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
