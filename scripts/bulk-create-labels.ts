/**
 * Bulk create labels and assign orders based on owner mapping
 * 
 * Usage: 
 *   npx tsx scripts/bulk-create-labels.ts <token> <mapping-file.json>
 * 
 * Or set environment variables:
 *   TRACKING_TOKEN=your-token npx tsx scripts/bulk-create-labels.ts
 */

import { createClient } from '@supabase/supabase-js'

// Parse the owner mapping from the provided data
const ownerMapping: Record<string, string> = {
  'Simply1': 'Eliran',
  'Simply2': 'Eliran',
  'Simply3': 'Eliran',
  'Simply4': 'Eliran',
  'Simply5': 'Nadav',
  'Simply6': 'Nadav',
  'Simply7': 'Nadav',
  'Simply8': 'Oded',
  'Simply9': 'Oded',
  'Simply10': 'Nadav',
  'Simply11': 'Nadav',
  'Simply12': 'Nadav',
  'Simply13': 'Nadav',
  'Simply14': 'Nadav',
  'Simply15': 'Nadav',
  'Simply16': 'Nadav',
  'Simply17': 'Nadav',
  'Simply18': 'Nadav',
  'Simply19': 'Nadav',
  'Simply20': 'Nadav',
  'Simply21': 'Dan',
  'Simply22': 'Dan',
  'Simply23': 'Oded',
  'Simply24': 'Oded',
  'Simply25': 'Oded',
  'Simply26': 'Oded',
  'Simply27': 'Oded',
  'Simply28': 'shiloah',
  'Simply29': 'shiloah',
  'Simply30': 'shiloah',
  'Simply31': 'Sarah',
  'Simply32': 'Sarah',
  'Simply33': 'Sarah',
  'Simply34': 'Sarah',
  'Simply35': 'Sarah',
  'Simply36': 'Sarah',
  'Simply37': 'Sarah',
  'Simply38': 'Sarah',
  'Simply39': 'Sarah',
  'Simply40': 'Sarah',
  'Simply41': 'Sarah',
  'Simply42': 'Sarah',
  'Simply43': 'Sarah',
  'Simply44': 'Tamar',
  'Simply45': 'Tamar',
  'Simply46': 'Tamar',
  'Simply47': 'Tamar',
  'Simply48': 'Nadav',
  'Simply49': 'Eliran',
  'Simply50': 'shiloah',
  'Simply51': 'Eliran',
  'Simply52': 'Oded',
  'Simply53': 'Oded',
  'Simply54': 'Oded',
  'Simply55': 'Oded',
  'Simply56': 'Nadav',
  'Simply57': 'Nadav',
}

async function bulkCreateLabels(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verify the tracking link exists
  const { data: trackingLink, error: linkError } = await supabase
    .from('shared_order_tracking_links')
    .select('token, order_ids')
    .eq('token', token)
    .single()

  if (linkError || !trackingLink) {
    throw new Error(`Invalid tracking token: ${token}`)
  }

  console.log(`Found tracking link with ${trackingLink.order_ids?.length || 0} orders`)

  // Get unique owner names (labels)
  const uniqueOwners = [...new Set(Object.values(ownerMapping))]
  console.log(`Creating ${uniqueOwners.length} labels:`, uniqueOwners)

  // Create labels
  const labelsToInsert = uniqueOwners.map((owner, index) => ({
    token,
    label_name: owner,
    label_order: index,
  }))

  // Delete existing labels
  await supabase
    .from('tracking_link_labels')
    .delete()
    .eq('token', token)

  // Insert new labels
  const { error: labelsError } = await supabase
    .from('tracking_link_labels')
    .insert(labelsToInsert)

  if (labelsError) {
    throw new Error(`Error creating labels: ${labelsError.message}`)
  }

  console.log('✓ Labels created successfully')

  // Create order-label associations
  const orderLabelsToInsert: Array<{ token: string; order_id: string; label_name: string }> = []

  // Match orders to labels based on order_id
  // We need to check both order_id and sys_order_id formats
  for (const [orderNumber, owner] of Object.entries(ownerMapping)) {
    // Try different order ID formats
    const possibleOrderIds = [
      orderNumber,           // "Simply1"
      `#${orderNumber}`,     // "#Simply1"
      orderNumber.toLowerCase(), // "simply1"
    ]

    for (const orderId of possibleOrderIds) {
      // Check if this order exists in the tracking link
      if (trackingLink.order_ids?.includes(orderId)) {
        orderLabelsToInsert.push({
          token,
          order_id: orderId,
          label_name: owner,
        })
        break
      }
    }
  }

  // Also try to match by checking if order_id contains the number
  // This handles cases where order_id might be "Simply36a" instead of "Simply36"
  for (const orderId of trackingLink.order_ids || []) {
    // Extract number from order ID (e.g., "Simply36a" -> "36")
    const match = orderId.match(/Simply(\d+)/i)
    if (match) {
      const number = match[1]
      const orderNumber = `Simply${number}`
      const owner = ownerMapping[orderNumber]
      
      if (owner) {
        // Check if we already added this order
        const exists = orderLabelsToInsert.some(
          ol => ol.token === token && ol.order_id === orderId && ol.label_name === owner
        )
        
        if (!exists) {
          orderLabelsToInsert.push({
            token,
            order_id: orderId,
            label_name: owner,
          })
        }
      }
    }
  }

  console.log(`Creating ${orderLabelsToInsert.length} order-label associations...`)

  // Delete existing order labels
  await supabase
    .from('tracking_link_order_labels')
    .delete()
    .eq('token', token)

  // Insert new order labels
  if (orderLabelsToInsert.length > 0) {
    const { error: orderLabelsError } = await supabase
      .from('tracking_link_order_labels')
      .insert(orderLabelsToInsert)

    if (orderLabelsError) {
      throw new Error(`Error creating order labels: ${orderLabelsError.message}`)
    }
  }

  console.log('✓ Order-label associations created successfully')
  console.log(`\nSummary:`)
  console.log(`- Created ${uniqueOwners.length} labels`)
  console.log(`- Assigned ${orderLabelsToInsert.length} orders to labels`)
  
  // Show breakdown by label
  const labelCounts: Record<string, number> = {}
  orderLabelsToInsert.forEach(ol => {
    labelCounts[ol.label_name] = (labelCounts[ol.label_name] || 0) + 1
  })
  
  console.log(`\nOrders per label:`)
  Object.entries(labelCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, count]) => {
      console.log(`  ${label}: ${count} orders`)
    })
}

// Main execution
const token = process.env.TRACKING_TOKEN || process.argv[2]

if (!token) {
  console.error('Error: Tracking token is required')
  console.error('Usage: TRACKING_TOKEN=your-token npx tsx scripts/bulk-create-labels.ts')
  console.error('   or: npx tsx scripts/bulk-create-labels.ts <token>')
  process.exit(1)
}

bulkCreateLabels(token)
  .then(() => {
    console.log('\n✓ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Error:', error.message)
    process.exit(1)
  })

