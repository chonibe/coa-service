import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppreciationMultiplier, APPRECIATION_SCHEDULE } from '@/lib/membership/tiers'

/**
 * POST /api/cron/credit-appreciation
 * 
 * Cron job to apply credit appreciation for subscription credits.
 * Runs monthly to calculate and apply appreciation bonuses.
 * 
 * Appreciation schedule:
 * - 0-2 months: 1.0x (no appreciation)
 * - 3-5 months: 1.05x (5% bonus)
 * - 6-11 months: 1.10x (10% bonus)
 * - 12-23 months: 1.15x (15% bonus)
 * - 24+ months: 1.20x (20% max bonus)
 * 
 * This job processes subscription credit deposits that have reached
 * appreciation milestones and adds bonus credits.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (Vercel crons)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const now = new Date()
    const results = {
      processed: 0,
      appreciated: 0,
      totalBonusCredits: 0,
      errors: [] as string[],
    }

    console.log('[credit-appreciation] Starting appreciation run...')

    // Get all subscription credit deposits that haven't been fully appreciated
    // We track appreciation by looking at credits with source='subscription'
    // that are eligible for the next appreciation tier
    
    for (const schedule of APPRECIATION_SCHEDULE.slice(1)) { // Skip first (1.0x)
      const { months, multiplier } = schedule
      const cutoffDate = new Date(now)
      cutoffDate.setMonth(cutoffDate.getMonth() - months)

      // Find subscription deposits older than the cutoff that haven't
      // received this appreciation tier yet
      const { data: eligibleEntries, error: queryError } = await supabase
        .from('collector_ledger_entries')
        .select(`
          id,
          collector_identifier,
          credits_amount,
          created_at,
          metadata
        `)
        .eq('transaction_type', 'deposit')
        .eq('credit_source', 'subscription')
        .lte('created_at', cutoffDate.toISOString())
        .gt('credits_amount', 0)

      if (queryError) {
        console.error('[credit-appreciation] Query error:', queryError)
        results.errors.push(`Query error for ${months}mo: ${queryError.message}`)
        continue
      }

      if (!eligibleEntries || eligibleEntries.length === 0) {
        continue
      }

      // Process each eligible entry
      for (const entry of eligibleEntries) {
        const metadata = (entry.metadata || {}) as Record<string, any>
        const lastAppreciationTier = metadata.last_appreciation_tier || 0

        // Skip if already appreciated at this tier
        if (lastAppreciationTier >= months) {
          continue
        }

        results.processed++

        // Calculate bonus credits
        // We give the delta between current and previous multiplier
        const previousMultiplier = getAppreciationMultiplier(lastAppreciationTier)
        const bonusRate = multiplier - previousMultiplier
        const bonusCredits = Math.floor(entry.credits_amount * bonusRate)

        if (bonusCredits <= 0) {
          continue
        }

        // Add appreciation bonus to collector's account
        const { data: collector } = await supabase
          .from('collectors')
          .select('id')
          .eq('email', entry.collector_identifier)
          .maybeSingle()

        if (!collector) {
          results.errors.push(`Collector not found: ${entry.collector_identifier}`)
          continue
        }

        // Create appreciation ledger entry
        const { error: insertError } = await supabase
          .from('collector_ledger_entries')
          .insert({
            collector_identifier: entry.collector_identifier,
            transaction_type: 'deposit',
            credits_amount: bonusCredits,
            usd_amount: bonusCredits * 0.10,
            description: `Credit appreciation bonus (${months}mo milestone, ${Math.round(bonusRate * 100)}%)`,
            credit_source: 'appreciation',
            reference_type: 'appreciation',
            reference_id: entry.id,
            metadata: {
              original_entry_id: entry.id,
              original_credits: entry.credits_amount,
              months_held: months,
              multiplier,
              bonus_rate: bonusRate,
            },
          })

        if (insertError) {
          results.errors.push(`Insert error for ${entry.id}: ${insertError.message}`)
          continue
        }

        // Update collector account balance
        await supabase.rpc('increment_collector_credits', {
          p_collector_identifier: entry.collector_identifier,
          p_amount: bonusCredits,
        })

        // Mark original entry as appreciated at this tier
        await supabase
          .from('collector_ledger_entries')
          .update({
            metadata: {
              ...metadata,
              last_appreciation_tier: months,
              last_appreciation_at: now.toISOString(),
            },
          })
          .eq('id', entry.id)

        results.appreciated++
        results.totalBonusCredits += bonusCredits

        console.log(`[credit-appreciation] Applied ${bonusCredits} bonus to ${entry.collector_identifier}`)
      }
    }

    // Update analytics
    if (results.appreciated > 0) {
      const today = now.toISOString().split('T')[0]
      
      await supabase
        .from('membership_analytics')
        .upsert({
          date: today,
          total_credits_appreciated: results.totalBonusCredits,
        }, {
          onConflict: 'date',
        })
    }

    console.log('[credit-appreciation] Completed:', results)

    return NextResponse.json({
      success: true,
      ...results,
      message: `Processed ${results.processed} entries, appreciated ${results.appreciated} with ${results.totalBonusCredits} bonus credits`,
    })
  } catch (error: any) {
    console.error('[credit-appreciation] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Appreciation job failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/credit-appreciation
 * 
 * Returns appreciation schedule info and stats.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Get recent appreciation stats
  const { data: recentStats } = await supabase
    .from('membership_analytics')
    .select('date, total_credits_appreciated')
    .order('date', { ascending: false })
    .limit(30)

  return NextResponse.json({
    schedule: APPRECIATION_SCHEDULE,
    recentStats: recentStats || [],
    nextMilestones: APPRECIATION_SCHEDULE.map(s => ({
      months: s.months,
      multiplier: s.multiplier,
      bonusPercent: Math.round((s.multiplier - 1) * 100),
    })),
  })
}
