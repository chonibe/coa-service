import { SupabaseClient } from '@supabase/supabase-js'
import { createChinaDivisionClient } from '../chinadivision/client'

/**
 * Shared utility to sync a Shopify order to the database, including warehouse enrichment,
 * PII recovery, and edition assignment.
 */
export async function syncShopifyOrder(
  supabase: SupabaseClient,
  order: any,
  options: {
    forceWarehouseSync?: boolean;
    skipEditions?: boolean;
  } = {}
) {
  const { forceWarehouseSync = false, skipEditions = false } = options
  const results: string[] = []
  
  try {
    const orderId = order.id.toString()
    const orderName = order.name
    
    // 1. PII Recovery Logic
    let ownerEmail = order.email?.toLowerCase()?.trim() || null
    
    const getShopifyName = (order: any) => {
      const sources = [
        order.customer,
        order.shipping_address,
        order.billing_address
      ]
      for (const s of sources) {
        if (s && (s.first_name || s.last_name)) {
          return `${s.first_name || ''} ${s.last_name || ''}`.trim()
        }
      }
      return null
    }

    let ownerName = getShopifyName(order)
    let ownerPhone = order.customer?.phone || order.shipping_address?.phone || order.billing_address?.phone || null
    let ownerAddress = order.shipping_address || order.billing_address || null

    // Attempt Warehouse Match if PII is missing or forced
    if (forceWarehouseSync || !ownerEmail || !ownerName) {
      try {
        const chinaClient = createChinaDivisionClient()
        // Broaden search window slightly to be safe
        const startDate = new Date(new Date(order.created_at).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const endDate = new Date(new Date(order.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        const warehouseOrders = await chinaClient.getOrdersInfo(startDate, endDate)
        const matched = warehouseOrders.find(o => 
          o.order_id === orderName || 
          o.order_id === orderId || 
          (o as any).shopify_order_id === orderId
        )

        if (matched) {
          ownerEmail = matched.ship_email?.toLowerCase()?.trim() || ownerEmail
          ownerName = (matched.first_name || matched.last_name) ? `${matched.first_name || ''} ${matched.last_name || ''}`.trim() : ownerName
          ownerPhone = matched.ship_phone || ownerPhone
          ownerAddress = matched.ship_address1 ? {
            address1: matched.ship_address1,
            address2: matched.ship_address2,
            city: matched.ship_city,
            province: matched.ship_state,
            country: matched.ship_country,
            zip: matched.ship_zip
          } : ownerAddress
          results.push(`Recovered PII from Warehouse for ${orderName}`)
          
          // Cache in warehouse_orders
          await supabase.from('warehouse_orders').upsert({
            id: matched.sys_order_id || matched.order_id,
            order_id: matched.order_id,
            shopify_order_id: orderId,
            ship_email: ownerEmail,
            ship_name: ownerName,
            ship_phone: ownerPhone,
            ship_address: ownerAddress as any,
            raw_data: matched as any,
            updated_at: new Date().toISOString()
          })
        }
      } catch (whError) {
        console.warn(`Warehouse enrichment failed for ${orderName}:`, whError)
      }
    }

    // 2. Order Upsert
    const isGift = (orderName || "").toLowerCase().startsWith('simply')
    const shopifyTags = (order.tags || "").toLowerCase()
    const archived = shopifyTags.includes("archived") || order.closed_at !== null || order.cancel_reason !== null

    const orderData = {
      id: orderId,
      order_number: order.order_number?.toString() || orderName.replace('#', ''),
      order_name: orderName,
      processed_at: order.processed_at || order.created_at,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status || 'pending',
      total_price: parseFloat(order.current_total_price || order.total_price || '0'),
      currency_code: order.currency || 'USD',
      customer_email: ownerEmail,
      customer_name: ownerName,
      customer_phone: ownerPhone,
      shipping_address: ownerAddress,
      updated_at: new Date().toISOString(),
      raw_shopify_order_data: order,
      cancelled_at: order.cancelled_at || null,
      archived: archived,
      shopify_order_status: order.status || null,
      source: isGift ? 'warehouse' : 'shopify',
      customer_id: order.customer?.id?.toString() || null,
      shopify_id: orderId,
      created_at: order.created_at,
    }

    const { error: orderError } = await supabase.from('orders').upsert(orderData)
    if (orderError) throw orderError

    // 3. Line Items Sync
    const removedLineItemIds = new Set<number>()
    if (order.refunds && Array.isArray(order.refunds)) {
      order.refunds.forEach((refund: any) => {
        refund.refund_line_items?.forEach((ri: any) => {
          // Protocol: Any refunded item is considered removed from the active order
          removedLineItemIds.add(ri.line_item_id)
        })
      })
    }

    // Map existing products to get img_url
    const shopifyProductIds = order.line_items.map((li: any) => li.product_id).filter(Boolean)
    const { data: products } = await supabase
      .from('products')
      .select('product_id, img_url, image_url')
      .in('product_id', shopifyProductIds)
    
    const productMap = new Map(products?.map(p => [p.product_id?.toString(), p.img_url || p.image_url]) || [])

    // Proactively fetch missing products or update stale images from Shopify if needed
    for (const li of order.line_items) {
      if (!li.product_id) continue;
      const pid = li.product_id.toString();
      
      if (!productMap.has(pid)) {
        try {
          // Fetch from Shopify directly to get the latest image
          const shopifyRes = await fetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2024-01/products/${pid}.json`, {
            headers: { "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN || "" }
          });
          
          if (shopifyRes.ok) {
            const { product } = await shopifyRes.json();
            const img = product.image?.src || (product.images && product.images[0]?.src) || null;
            if (img) {
              productMap.set(pid, img);
              // Update/Insert into products table so it's fresh for next time
              await supabase.from('products').upsert({
                product_id: product.id,
                name: product.title,
                handle: product.handle,
                vendor_name: product.vendor,
                img_url: img,
                image_url: img,
                updated_at: new Date().toISOString()
              }, { onConflict: 'product_id' });
            }
          }
        } catch (e) {
          console.error(`Failed to fetch product ${pid} from Shopify:`, e);
        }
      }
    }

    const dbLineItems = order.line_items.map((li: any) => {
      // Protocol: Define 'removed' status based on refunds, properties, and fulfillable quantity
      const isRefunded = removedLineItemIds.has(li.id)
      
      const removedProperty = li.properties?.find((p: any) => 
        (p.name === 'removed' || p.key === 'removed') && 
        (p.value === 'true' || p.value === true)
      )
      const isRemovedByProperty = removedProperty !== undefined
      
      // If fulfillable_quantity is 0 and it hasn't been fulfilled, it was removed from the order
      const isRemovedByQty = (li.fulfillable_quantity === 0 || li.fulfillable_quantity === '0') && 
                             li.fulfillment_status !== 'fulfilled'
      
      const isCancelled = order.financial_status === 'voided' || order.cancelled_at !== null
      const isFulfilled = li.fulfillment_status === 'fulfilled'
      const isPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(order.financial_status)
      
      // Final status determination
      const isInactive = isRefunded || isRemovedByProperty || isRemovedByQty || isCancelled
      const status = isInactive ? 'inactive' : (isPaid || isFulfilled ? 'active' : 'inactive')

      return {
        order_id: orderId,
        order_name: orderName,
        line_item_id: li.id.toString(),
        product_id: li.product_id?.toString() || '',
        variant_id: li.variant_id?.toString() || null,
        name: li.title,
        description: li.title,
        quantity: li.quantity,
        price: parseFloat(li.price),
        sku: li.sku || null,
        vendor_name: li.vendor,
        fulfillment_status: li.fulfillment_status,
        status: status,
        owner_email: ownerEmail,
        owner_name: ownerName,
        img_url: li.product_id ? productMap.get(li.product_id.toString()) || null : null,
        created_at: order.created_at,
        updated_at: new Date().toISOString(),
      }
    })

    // Upsert Shopify line items
    const { error: liError } = await supabase.from('order_line_items_v2').upsert(dbLineItems, { onConflict: 'line_item_id' })
    if (liError) throw liError

    // 4. Warehouse items enrichment - REMOVED
    // We no longer ingest line items from the warehouse. 
    // Warehouse is used EXCLUSIVELY for PII recovery (Step 1).

    // 5. Assign Edition Numbers
    if (!skipEditions) {
      const allProductIds = Array.from(new Set([
        ...dbLineItems.map((li: any) => li.product_id),
        // include any others...
      ])).filter(Boolean) as string[]

      for (const pid of allProductIds) {
        await supabase.rpc('assign_edition_numbers', { p_product_id: pid })
      }
    }

    return { success: true, results }
  } catch (error: any) {
    console.error(`Sync failed for order ${order.name}:`, error)
    return { success: false, error: error.message }
  }
}
