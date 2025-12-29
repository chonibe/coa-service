const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCarstenUnfulfilled() {
  const vendorName = 'Carsten Gueth'
  
  console.log(`\nChecking unfulfilled items for ${vendorName}...\n`)
  
  // Get all line items for this vendor
  const { data: lineItems, error } = await supabase
    .from('order_line_items_v2')
    .select('line_item_id, order_id, order_name, product_id, name, price, created_at, fulfillment_status, status, restocked, vendor_name')
    .eq('vendor_name', vendorName)
    .or('fulfillment_status.in.(fulfilled,unfulfilled,partially_fulfilled),created_at.lt.2025-10-01')
  
  if (error) {
    console.error('Error fetching line items:', error)
    return
  }
  
  console.log(`Total line items found: ${lineItems?.length || 0}\n`)
  
  // Get paid items
  const { data: paidItems } = await supabase
    .from('vendor_payout_items')
    .select('line_item_id')
    .not('payout_id', 'is', null)
  
  const paidLineItemIds = new Set((paidItems || []).map(item => item.line_item_id))
  
  // Filter unfulfilled items
  const unfulfilled = (lineItems || []).filter(item => {
    const isPaid = paidLineItemIds.has(item.line_item_id)
    const isFulfilled = item.fulfillment_status === 'fulfilled'
    const isCancelled = item.status === 'cancelled'
    const isRestocked = item.restocked === true
    
    return !isPaid && !isFulfilled && !isCancelled && !isRestocked
  })
  
  console.log(`Unfulfilled items (after filtering): ${unfulfilled.length}\n`)
  
  // Check for potential issues
  const cancelledItems = unfulfilled.filter(item => item.status === 'cancelled')
  const restockedItems = unfulfilled.filter(item => item.restocked === true)
  const nullStatusItems = unfulfilled.filter(item => item.status === null || item.status === undefined)
  const nullRestockedItems = unfulfilled.filter(item => item.restocked === null || item.restocked === undefined)
  
  console.log('Potential Issues:')
  console.log(`- Items with cancelled status: ${cancelledItems.length}`)
  console.log(`- Items with restocked = true: ${restockedItems.length}`)
  console.log(`- Items with null status: ${nullStatusItems.length}`)
  console.log(`- Items with null restocked: ${nullRestockedItems.length}\n`)
  
  // Get order details for unfulfilled items
  const orderIds = [...new Set(unfulfilled.map(item => item.order_id))]
  
  if (orderIds.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_name, financial_status, fulfillment_status')
      .in('id', orderIds)
    
    const cancelledOrders = orders?.filter(order => order.financial_status === 'voided' || order.financial_status === 'cancelled') || []
    
    console.log(`Orders with cancelled/voided financial_status: ${cancelledOrders.length}`)
    
    if (cancelledOrders.length > 0) {
      console.log('\nCancelled Orders:')
      cancelledOrders.forEach(order => {
        console.log(`  - ${order.order_name} (${order.id}): ${order.financial_status}`)
      })
    }
    
    // Check which unfulfilled items are from cancelled orders
    const unfulfilledFromCancelledOrders = unfulfilled.filter(item => 
      cancelledOrders.some(order => order.id === item.order_id)
    )
    
    console.log(`\nUnfulfilled items from cancelled orders: ${unfulfilledFromCancelledOrders.length}`)
    
    if (unfulfilledFromCancelledOrders.length > 0) {
      console.log('\nThese items should be excluded:')
      unfulfilledFromCancelledOrders.forEach(item => {
        console.log(`  - ${item.name || item.product_id} (${item.line_item_id})`)
        console.log(`    Order: ${item.order_name} (${item.order_id})`)
        console.log(`    Status: ${item.status}, Restocked: ${item.restocked}`)
      })
    }
  }
  
  // Group unfulfilled items by order
  const ordersMap = new Map()
  unfulfilled.forEach((item) => {
    const orderId = item.order_id
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        order_id: orderId,
        order_name: item.order_name,
        items: []
      })
    }
    ordersMap.get(orderId).items.push(item)
  })

  // Show unfulfilled orders
  console.log(`\n=== UNFULFILLED ORDERS (${ordersMap.size} orders) ===\n`)
  Array.from(ordersMap.values()).forEach((order, index) => {
    console.log(`${index + 1}. Order: ${order.order_name} (${order.order_id})`)
    console.log(`   Items: ${order.items.length}`)
    order.items.forEach((item, itemIndex) => {
      console.log(`   ${itemIndex + 1}. ${item.name || item.product_id}`)
      console.log(`      Line Item ID: ${item.line_item_id}`)
      console.log(`      Status: ${item.status || 'null'}`)
      console.log(`      Restocked: ${item.restocked || 'null'}`)
      console.log(`      Fulfillment Status: ${item.fulfillment_status || 'null'}`)
      console.log(`      Created: ${item.created_at}`)
    })
    console.log('')
  })

  // Show all unfulfilled items summary
  console.log(`\n=== SUMMARY ===`)
  console.log(`Total unfulfilled items: ${unfulfilled.length}`)
  console.log(`Total unfulfilled orders: ${ordersMap.size}`)
}

checkCarstenUnfulfilled().catch(console.error)

