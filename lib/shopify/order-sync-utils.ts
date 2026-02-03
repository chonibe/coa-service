import { SupabaseClient } from '@supabase/supabase-js'
import { createChinaDivisionClient } from '../chinadivision/client'

/**
 * ============================================================================
 * ⚠️  DEPRECATED FILE - DO NOT USE DIRECTLY ⚠️
 * ============================================================================
 * 
 * This file contains DEPRECATED logic that has been centralized in the
 * Edition Ledger MCP Server to prevent recurring bugs.
 * 
 * ❌ DO NOT call syncShopifyOrder() directly
 * ❌ DO NOT duplicate status determination logic from this file
 * ❌ DO NOT use this as a reference for new implementations
 * 
 * ✅ INSTEAD: Use Edition Ledger MCP Server tools:
 *    - sync_order_line_items
 *    - mark_line_item_inactive
 *    - get_collector_editions
 *    - validate_data_integrity
 * 
 * See: .cursor/rules/edition-ledger-mcp.mdc
 * See: mcp-servers/edition-verification/README.md
 * 
 * This file is kept for backward compatibility with existing scripts only.
 * All new code MUST use the MCP server.
 * ============================================================================
 */

/**
 * @deprecated Use Edition Ledger MCP Server instead
 * 
 * This function is DEPRECATED and should NOT be used directly by AI agents
 * or new application code.
 * 
 * **Why deprecated:**
 * - Status logic has been centralized in MCP server to prevent bugs
 * - Direct usage bypasses data integrity validation
 * - Duplicating this logic causes inconsistencies
 * 
 * **Use instead:**
 * ```typescript
 * await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {
 *   order: shopifyOrderObject,
 *   skip_editions: false
 * });
 * ```
 * 
 * **For existing scripts only:**
 * This function remains for backward compatibility with existing sync scripts
 * that haven't been migrated yet. Do not create new usages.
 * 
 * @see .cursor/rules/edition-ledger-mcp.mdc
 * @see mcp-servers/edition-verification/README.md
 */
export async function syncShopifyOrder(
  supabase: SupabaseClient,
  order: any,
  options: {
    forceWarehouseSync?: boolean;
    skipEditions?: boolean;
  } = {}
) {
  // ⚠️  DEPRECATION WARNING
  console.warn('⚠️  DEPRECATED: syncShopifyOrder() is deprecated.');
  console.warn('   Use Edition Ledger MCP Server instead:');
  console.warn('   await mcpClient.callTool("edition-ledger", "sync_order_line_items", {...})');
  console.warn('   See: .cursor/rules/edition-ledger-mcp.mdc');
  
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
    // IMPORTANT: Use string Set for consistent comparison (line_item_id can be number or string)
    const removedLineItemIds = new Set<string>()
    if (order.refunds && Array.isArray(order.refunds)) {
      order.refunds.forEach((refund: any) => {
        refund.refund_line_items?.forEach((ri: any) => {
          // Protocol: Any refunded item is considered removed from the active order
          removedLineItemIds.add(ri.line_item_id.toString())
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
      // Robust detection of refunds and restocks
      const liIdStr = li.id.toString();
      const refundEntry = order.refunds?.flatMap((r: any) => r.refund_line_items || [])
                                       .find((ri: any) => ri.line_item_id.toString() === liIdStr);
      
      // FIXED: Use string comparison for removedLineItemIds (now a Set<string>)
      const isRefunded = removedLineItemIds.has(liIdStr) || li.refund_status === 'refunded' || refundEntry !== undefined || (li.refunded_quantity && li.refunded_quantity > 0);
      const isRestocked = Boolean(
        li.restocked === true || 
        (li.restock_type && li.restock_type !== null) || 
        li.fulfillment_status === 'restocked' || 
        (refundEntry?.restock_type && refundEntry?.restock_type !== undefined)
      );
      
      const removedProperty = li.properties?.find((p: any) => 
        (p.name === 'removed' || p.key === 'removed') && 
        (p.value === 'true' || p.value === true)
      )
      const isRemovedByProperty = removedProperty !== undefined
      
      // If fulfillable_quantity is 0 and it hasn't been fulfilled, it was removed from the order
      const isRemovedByQty = (li.fulfillable_quantity === 0 || li.fulfillable_quantity === '0') && 
                             li.fulfillment_status !== 'fulfilled'
      
      const isCancelled = order.financial_status === 'voided' || order.cancelled_at !== null || order.fulfillment_status === 'canceled'
      const isFulfilled = li.fulfillment_status === 'fulfilled'
      const isPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(order.financial_status)
      
      // Final status determination
      const isInactive = isRefunded || isRemovedByProperty || isRemovedByQty || isCancelled || isRestocked
      const status = isInactive ? 'inactive' : (isPaid || isFulfilled ? 'active' : 'inactive')

      return {
        order_id: orderId,
        order_name: orderName,
        line_item_id: liIdStr,
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
        restocked: isRestocked,
        refund_status: 'none'
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
