import { createClient } from '@/lib/supabase/server'
import { recordPayoutWithdrawal } from '@/lib/banking/payout-withdrawal'
import { createPayPalPayout, isValidPayPalEmail } from './paypal/payouts'

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
      console.log(`Processing payout for ${payout.vendor_name}: $${payout.amount} via ${payment_method}`)

      let success = false
      let transfer_id = ''
      let batch_id = ''
      let error = ''

      if (payment_method === 'paypal') {
        // 1. Get vendor's PayPal email
        const { data: vendor, error: vendorError } = await client
          .from('vendors')
          .select('paypal_email')
          .eq('vendor_name', payout.vendor_name)
          .single()

        if (vendorError || !vendor?.paypal_email) {
          error = `Vendor PayPal email not found: ${vendorError?.message || 'Email missing'}`
        } else if (!isValidPayPalEmail(vendor.paypal_email)) {
          error = `Invalid PayPal email format: ${vendor.paypal_email}`
        } else {
          // 2. Call PayPal Payouts API
          try {
            const paypalResponse = await createPayPalPayout([
              {
                email: vendor.paypal_email,
                amount: payout.amount,
                note: notes || `Payout for ${payout.vendor_name} - Ref: ${payout.reference}`,
                senderItemId: payout.reference,
              },
            ])

            if (paypalResponse.batch_header) {
              success = true
              batch_id = paypalResponse.batch_header.payout_batch_id
              transfer_id = paypalResponse.batch_header.payout_batch_id // Batch ID is our primary reference
            } else {
              error = 'PayPal API response missing batch header'
            }
          } catch (err: any) {
            console.error('PayPal API error:', err)
            error = `PayPal API error: ${err.message || 'Unknown error'}`
          }
        }
      } else {
        // For other methods (manual, bank_transfer, stripe), we still use simulation for now
        // as per the requirement that only PayPal is active.
        success = true
        transfer_id = `simulated_${Date.now()}_${payout.payout_id}`
        batch_id = `batch_${Date.now()}`
      }

      if (success) {
        // Update payout status to completed (or processing for PayPal as it's asynchronous)
        const status = payment_method === 'paypal' ? 'processing' : 'completed'
        const { error: updateError } = await client
          .from('vendor_payouts')
          .update({
            status: status,
            payment_id: batch_id,
            payout_batch_id: batch_id, // Add this for PayPal tracking
            payout_date: status === 'completed' ? new Date().toISOString() : null,
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

        console.log(`Successfully initiated payout for ${payout.vendor_name}: ${withdrawalResult.usdWithdrawn} USD withdrawn, status: ${status}`)

        results.push({
          vendor_name: payout.vendor_name,
          success: true,
          payout_id: payout.payout_id,
          reference: payout.reference,
          status: status,
          transfer_id,
          batch_id,
        })
      } else {
        // Update payout status to failed
        await client
          .from('vendor_payouts')
          .update({
            status: 'failed',
            notes: error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payout.payout_id)

        results.push({
          vendor_name: payout.vendor_name,
          success: false,
          payout_id: payout.payout_id,
          reference: payout.reference,
          error: error || 'Payout processing failed',
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





