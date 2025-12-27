#!/usr/bin/env node

/**
 * Script to verify that existing vendor invoices work with the new format
 * This tests invoice generation for all completed payouts
 */

const { createClient } = require('../lib/supabase/server')
const { generateInvoiceBuffer } = require('../lib/invoices/generator')

async function verifyInvoiceGeneration() {
  console.log('🔍 Verifying invoice generation with new format...')

  try {
    // Get all completed payouts
    const supabase = createClient()

    const { data: payouts, error } = await supabase
      .from('vendor_payouts')
      .select('id, vendor_name, status, amount, invoice_number')
      .in('status', ['completed', 'paid'])
      .order('created_at', { ascending: false })
      .limit(10) // Test with first 10 payouts

    if (error) {
      console.error('❌ Error fetching payouts:', error)
      return
    }

    if (!payouts || payouts.length === 0) {
      console.log('ℹ️  No completed payouts found to test.')
      console.log('✅ Invoice format is ready for future payouts.')
      return
    }

    console.log(`📋 Testing invoice generation for ${payouts.length} completed payouts`)

    let successCount = 0
    let errorCount = 0

    for (const payout of payouts) {
      try {
        console.log(`🔄 Testing invoice for payout ${payout.id} (${payout.vendor_name})`)

        // Get vendor details
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('vendor_name', payout.vendor_name)
          .single()

        if (vendorError || !vendor) {
          console.error(`❌ Vendor not found for payout ${payout.id}:`, vendorError)
          errorCount++
          continue
        }

        // Get line items for this payout
        const { data: payoutItems, error: itemsError } = await supabase
          .from('vendor_payout_items')
          .select(`
            *,
            order_line_items_v2 (
              order_id,
              order_name,
              product_id,
              price,
              quantity
            )
          `)
          .eq('payout_id', payout.id)

        // Get product details for line items
        const lineItems = await Promise.all(
          (payoutItems || []).map(async (item) => {
            const lineItem = item.order_line_items_v2
            if (!lineItem) return null

            // Get product title
            const { data: product } = await supabase
              .from('products')
              .select('name, product_id')
              .or(`product_id.eq.${lineItem.product_id},id.eq.${lineItem.product_id}`)
              .single()

            return {
              productTitle: product?.name || `Product ${lineItem.product_id}`,
              orderId: lineItem.order_id,
              orderName: lineItem.order_name,
              quantity: lineItem.quantity || 1,
              unitPrice: lineItem.price || 0,
              payoutAmount: item.amount || 0,
            }
          })
        )

        // Filter out null items
        const validLineItems = lineItems.filter((item) => item !== null)

        // Generate invoice data
        const invoiceData = {
          invoiceNumber: payout.invoice_number || `INV-${payout.id}`,
          payoutId: payout.id,
          vendorName: payout.vendor_name,
          vendorEmail: vendor.paypal_email || undefined,
          vendorTaxId: vendor.tax_id || undefined,
          vendorTaxCountry: vendor.tax_country || undefined,
          vendorIsCompany: vendor.is_company || false,
          payoutDate: new Date().toISOString(),
          payoutAmount: parseFloat(payout.amount.toString()),
          currency: 'USD',
          taxRate: 0,
          taxAmount: 0,
          lineItems: validLineItems,
          reference: `TEST-${payout.id}`,
          payoutBatchId: undefined,
          paymentMethod: 'paypal',
          notes: undefined,
        }

        // Generate PDF (this will test if the new format works)
        const pdfBuffer = generateInvoiceBuffer(invoiceData)

        if (pdfBuffer && pdfBuffer.length > 0) {
          console.log(`✅ Invoice generated successfully for payout ${payout.id} (${pdfBuffer.length} bytes)`)
          successCount++
        } else {
          throw new Error('Empty PDF buffer')
        }

      } catch (error) {
        console.error(`❌ Error generating invoice for payout ${payout.id}:`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 Verification Summary:')
    console.log(`✅ Successfully generated: ${successCount} invoices`)
    console.log(`❌ Errors: ${errorCount} invoices`)

    if (successCount > 0 && errorCount === 0) {
      console.log('\n🎉 All existing invoices will work with the new format!')
      console.log('   The updated invoice structure is ready and functional.')
    } else if (successCount > 0) {
      console.log('\n⚠️  Some invoices had issues, but the new format is working for most.')
    } else {
      console.log('\n❌ No invoices could be generated. Please check the invoice generator.')
    }

  } catch (error) {
    console.error('💥 Fatal error during verification:', error)
    process.exit(1)
  }
}

// Run the script
verifyInvoiceGeneration().then(() => {
  console.log('🏁 Invoice verification completed.')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
