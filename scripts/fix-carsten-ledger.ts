#!/usr/bin/env node

/**
 * Script to diagnose and fix Carsten's ledger balance discrepancy
 * The issue: payouts were processed but ledger wasn't debited
 */

const { createClient } = require('../lib/supabase/server')
const { recordPayoutWithdrawal } = require('../lib/banking/payout-withdrawal')

async function fixCarstenLedger() {
  const supabase = createClient()

  try {
    console.log('🔍 Diagnosing Carsten ledger balance...')

    // Get Carsten's vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, auth_id, vendor_name')
      .eq('vendor_name', 'carsten')
      .single()

    if (vendorError || !vendor) {
      console.error('❌ Carsten vendor not found:', vendorError)
      return
    }

    console.log('📋 Vendor info:', vendor)

    const collectorIdentifier = vendor.auth_id || vendor.vendor_name
    console.log('🎯 Collector identifier:', collectorIdentifier)

    // Get current USD balance
    const { getUsdBalance } = require('../lib/banking/balance-calculator')
    const currentBalance = await getUsdBalance(collectorIdentifier)
    console.log('💰 Current USD balance:', currentBalance)

    // Get all ledger entries for Carsten
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from('collector_ledger_entries')
      .select('*')
      .eq('collector_identifier', collectorIdentifier)
      .order('created_at', { ascending: false })

    if (ledgerError) {
      console.error('❌ Error fetching ledger entries:', ledgerError)
      return
    }

    console.log('📊 Ledger entries:', ledgerEntries?.length || 0)
    ledgerEntries?.forEach(entry => {
      console.log(`  - ${entry.transaction_type}: ${entry.amount} ${entry.currency} (${entry.created_at})`)
    })

    // Get completed payouts for Carsten
    const { data: payouts, error: payoutError } = await supabase
      .from('vendor_payouts')
      .select('id, amount, status, payout_date, reference')
      .eq('vendor_name', 'carsten')
      .eq('status', 'completed')
      .order('payout_date', { ascending: false })

    if (payoutError) {
      console.error('❌ Error fetching payouts:', payoutError)
      return
    }

    console.log('💸 Completed payouts:', payouts?.length || 0)

    // Process each payout
    for (const payout of payouts || []) {
      console.log(`  - Payout ${payout.id}: $${payout.amount} (${payout.payout_date}) - ${payout.reference}`)

      // Check if withdrawal was recorded
      const withdrawalEntry = ledgerEntries?.find(entry =>
        entry.payout_id === payout.id &&
        entry.transaction_type === 'payout_withdrawal'
      )

      if (withdrawalEntry) {
        console.log(`    ✅ Withdrawal recorded: ${withdrawalEntry.amount} USD`)
      } else {
        console.log(`    ❌ MISSING withdrawal entry - needs to be recorded!`)

        // Record the missing withdrawal
        console.log(`    🔧 Recording missing withdrawal...`)
        const withdrawalResult = await recordPayoutWithdrawal('carsten', payout.id, payout.amount, supabase)
        if (withdrawalResult.success) {
          console.log(`    ✅ Successfully recorded withdrawal: ${withdrawalResult.usdWithdrawn} USD withdrawn`)
        } else {
          console.log(`    ❌ Failed to record withdrawal: ${withdrawalResult.error}`)
        }
      }
    }

    // Get new balance after fixes
    const newBalance = await getUsdBalance(collectorIdentifier)
    console.log('💰 New USD balance after fixes:', newBalance)
    console.log('📈 Balance change:', newBalance - currentBalance)

  } catch (error) {
    console.error('💥 Error in fix script:', error)
  }
}

// Run the script
async function main() {
  await fixCarstenLedger()
  console.log('🏁 Ledger diagnosis complete.')
}

main().catch((error) => {
  console.error('💥 Script failed:', error)
})
