import { createClient } from '@/lib/supabase/server'
import { recordPayoutWithdrawal } from '@/lib/banking/payout-withdrawal'

export type PaymentMethod = 'stripe' | 'paypal' | 'bank_transfer' | 'manual'

export interface PayoutRecord {
  vendor_name: string
  amount: number
  product_count: number
  payout_id: number
  reference: string
}

export interface PayoutProcessingOptions {
  payment_method: PaymentMethod
  generate_invoices: boolean
  notes?: string
  supabase?: ReturnType<typeof createClient>
}

export interface PayoutResult {
  vendor_name: string
  success: boolean
  payout_id?: number
  reference?: string
  status?: string
  error?: string
  transfer_id?: string
  batch_id?: string
}

/**
 * Process payouts for multiple vendors
 * This handles the unified payout processing logic
 */
export async function processPayouts(
  payouts: PayoutRecord[],
  options: PayoutProcessingOptions
): Promise<PayoutResult[]> {
  const { payment_method, generate_invoices, notes, supabase } = options
  const client = supabase || createClient()

  const results: PayoutResult[] = []

  for (const payout of payouts) {
    try {
      console.log(`Processing payout for ${payout.vendor_name}: $${payout.amount}`)

      // For now, we'll simulate successful processing
      // In a real implementation, this would integrate with Stripe, PayPal, etc.
      const success = true
      const transfer_id = `simulated_${Date.now()}_${payout.payout_id}`
      const batch_id = `batch_${Date.now()}`

      if (success) {
        // Update payout status to completed
        const { error: updateError } = await client
          .from('vendor_payouts')
          .update({
            status: 'completed',
            payout_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payout.payout_id)

        if (updateError) {
          console.error(`Error updating payout status for ${payout.vendor_name}:`, updateError)
          results.push({
            vendor_name: payout.vendor_name,
            success: false,
            payout_id: payout.payout_id,
            reference: payout.reference,
            error: `Failed to update payout status: ${updateError.message}`,
          })
          continue
        }

        // Record the payout withdrawal in the collector ledger
        // This debits the USD balance when payout is processed
        const withdrawalResult = await recordPayoutWithdrawal(
          payout.vendor_name,
          payout.payout_id,
          payout.amount,
          client
        )

        if (!withdrawalResult.success) {
          console.error(`Error recording payout withdrawal for ${payout.vendor_name}:`, withdrawalResult.error)
          // Don't fail the payout for ledger errors, but log it
        }

        console.log(`Successfully processed payout for ${payout.vendor_name}: ${withdrawalResult.usdWithdrawn} USD withdrawn, new balance: ${withdrawalResult.newUsdBalance} USD`)

        results.push({
          vendor_name: payout.vendor_name,
          success: true,
          payout_id: payout.payout_id,
          reference: payout.reference,
          status: 'completed',
          transfer_id,
          batch_id,
        })
      } else {
        // Update payout status to failed
        await client
          .from('vendor_payouts')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payout.payout_id)

        results.push({
          vendor_name: payout.vendor_name,
          success: false,
          payout_id: payout.payout_id,
          reference: payout.reference,
          error: 'Payout processing failed',
        })
      }

    } catch (error: any) {
      console.error(`Error processing payout for ${payout.vendor_name}:`, error)

      // Update payout status to failed
      try {
        await client
          .from('vendor_payouts')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payout.payout_id)
      } catch (updateError) {
        console.error(`Error updating payout status to failed for ${payout.vendor_name}:`, updateError)
      }

      results.push({
        vendor_name: payout.vendor_name,
        success: false,
        payout_id: payout.payout_id,
        reference: payout.reference,
        error: error.message || 'Unknown error occurred',
      })
    }
  }

  return results
}




