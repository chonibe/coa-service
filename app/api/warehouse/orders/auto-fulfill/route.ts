import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { sendTrackingUpdateEmail, type TrackingEmailOrder } from '@/lib/notifications/tracking-link'
import { createFulfillmentWithTracking } from '@/lib/shopify/fulfillment'

const CRON_SECRET = process.env.CRON_SECRET

const APPROVING_STATUS = 0
const IN_TRANSIT_TRACK_STATUS = 101

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-cron-secret')
    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'

    if (!CRON_SECRET || secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const chinaClient = createChinaDivisionClient()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    const orders = await chinaClient.getOrdersInfo(startStr, endStr, true)

    const eligible = (orders || []).filter((order) => {
      const hasTracking = !!order.tracking_number
      const inTransit = typeof order.track_status === 'number' && order.track_status >= IN_TRANSIT_TRACK_STATUS
      const shipped = order.status === 3
      return hasTracking && (inTransit || shipped)
    })

    const results: Array<{ orderId: string; status: string; detail?: string }> = []
    let linksCreated = 0
    let emailsSent = 0
    let fulfillmentsCreated = 0
    let skipped = 0

    for (const order of eligible) {
      const orderId = order.order_id || order.sys_order_id || ''
      if (!orderId) {
        skipped++
        results.push({ orderId: 'unknown', status: 'skipped', detail: 'missing order_id' })
        continue
      }

      try {
        // Cache in warehouse_orders table
        if (!dryRun) {
          await supabase
            .from('warehouse_orders')
            .upsert({
              id: order.sys_order_id || orderId,
              order_id: order.order_id,
              ship_email: order.ship_email?.toLowerCase(),
              ship_name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
              ship_phone: order.ship_phone,
              ship_address: {
                address1: order.ship_address1,
                address2: order.ship_address2,
                city: order.ship_city,
                state: order.ship_state,
                zip: order.ship_zip,
                country: order.ship_country
              },
              tracking_number: order.tracking_number,
              status: order.status,
              status_name: order.status_name,
              raw_data: order as any,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
        }

        // Find existing tracking link
        const { data: existingLink } = await supabase
          .from('shared_order_tracking_links')
          .select('*')
          .contains('order_ids', [order.order_id])
          .maybeSingle()

        let trackingLink = existingLink

        if (!trackingLink && !dryRun) {
          const token = crypto.randomBytes(32).toString('hex')
          const { data: newLink, error: linkError } = await supabase
            .from('shared_order_tracking_links')
            .insert({
              token,
              order_ids: [order.order_id],
              title: `Shipment for ${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Shipment',
              created_by: 'system@chinadivision-auto',
              primary_color: '#8217ff',
            })
            .select()
            .single()

          if (linkError) {
            throw linkError
          }
          trackingLink = newLink
          linksCreated++
        }

        if (!trackingLink) {
          skipped++
          results.push({ orderId, status: 'skipped', detail: 'dryRun_no_link' })
          continue
        }

        // Upsert notification preferences
        if (!dryRun) {
          await supabase
            .from('tracking_link_notification_preferences')
            .upsert({
              token: trackingLink.token,
              email_enabled: true,
              notification_email: order.ship_email,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'token' })
        }

        const emailOrders: TrackingEmailOrder[] = [
          {
            orderId: order.order_id,
            sysOrderId: order.sys_order_id,
            recipientName: `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Customer',
            status: order.status,
            statusName: order.status_name,
            trackStatus: order.track_status,
            trackStatusName: order.track_status_name,
            trackingNumber: order.tracking_number,
            shipCountry: order.ship_country,
          },
        ]

        if (!dryRun && order.ship_email) {
          const emailResult = await sendTrackingUpdateEmail({
            token: trackingLink.token,
            title: trackingLink.title || 'Order Tracking',
            orders: emailOrders,
            primaryColor: trackingLink.primary_color || '#8217ff',
            email: order.ship_email,
            baseUrl: process.env.NEXT_PUBLIC_APP_URL,
          })
          if (!emailResult.success) {
            throw new Error(emailResult.error || 'Failed to send email')
          }
          emailsSent++

          // Update last_notified_status
          const orderKey = order.order_id || order.sys_order_id
          const { data: prefs } = await supabase
            .from('tracking_link_notification_preferences')
            .select('last_notified_status')
            .eq('token', trackingLink.token)
            .maybeSingle()

          const lastNotified = (prefs?.last_notified_status as Record<string, any>) || {}
          if (orderKey) {
            lastNotified[orderKey] = {
              status: order.status,
              track_status: order.track_status,
            }
          }

          await supabase
            .from('tracking_link_notification_preferences')
            .update({
              last_notified_status: lastNotified,
              updated_at: new Date().toISOString(),
            })
            .eq('token', trackingLink.token)
        }

        // Create Shopify fulfillment
        if (!dryRun) {
          try {
            await createFulfillmentWithTracking({
              orderId: order.order_id,
              trackingNumber: order.tracking_number!,
              trackingUrl: order.last_mile_tracking || order.tracking_number || undefined,
              trackingCompany: order.carrier || 'ChinaDivision',
            })
            fulfillmentsCreated++
          } catch (fulfillmentError: any) {
            results.push({ orderId, status: 'partial', detail: `fulfillment_error:${fulfillmentError.message || fulfillmentError}` })
          }
        }

        // Update Supabase order + line items
        if (!dryRun) {
          const updatedAt = new Date().toISOString()
          const ownerEmail = order.ship_email?.toLowerCase()
          const ownerName = `${order.first_name || ''} ${order.last_name || ''}`.trim()
          const platformOrderId = order.order_id?.toString()

          // 1. Cross-reference with our 'orders' table to find the Shopify Customer ID
          // We search by both the long Shopify ID and the 'Order Name' (e.g. #1174)
          // We also try to match warehouse order IDs that might have an extra suffix (like 1188A)
          const cleanWhName = order.order_id?.toString().replace('#', '').trim();
          const numericPart = cleanWhName?.match(/^\d+/)?.[0];

          let { data: dbOrder } = await supabase
            .from('orders')
            .select('id, customer_id, customer_email, order_name')
            .or(`id.eq.${platformOrderId},order_name.eq.${platformOrderId},order_name.eq.#${cleanWhName},order_name.eq.#${numericPart || 'null'}`)
            .maybeSingle()

          // If order doesn't exist in our DB, it might be a manual warehouse order
          if (!dbOrder && !dryRun) {
            console.log(`[auto-fulfill] Order ${platformOrderId} not found in DB. Ingesting as manual warehouse order.`);
            
            const manualOrderId = `WH-${order.sys_order_id || order.order_id}`;
            const { error: insertError } = await supabase.from('orders').insert({
              id: manualOrderId,
              order_number: 900000 + (order.sys_order_id ? parseInt(order.sys_order_id.toString().slice(-6)) : Math.floor(Math.random() * 100000)),
              order_name: order.order_id,
              processed_at: order.created_at || new Date().toISOString(),
              financial_status: 'paid',
              fulfillment_status: 'fulfilled',
              total_price: parseFloat(order.raw_data?.freight || '0'),
              currency_code: 'USD',
              customer_email: ownerEmail,
              updated_at: new Date().toISOString(),
              created_at: order.created_at || new Date().toISOString(),
              raw_shopify_order_data: {
                source: 'manual_warehouse',
                warehouse_id: order.sys_order_id,
                original_order_id: order.order_id,
              },
            });

            if (!insertError) {
              dbOrder = { id: manualOrderId, customer_id: null, customer_email: ownerEmail, order_name: order.order_id };
              
              // Only ingest line items for manual orders that don't exist in Shopify
              if (order.raw_data?.info && Array.isArray(order.raw_data.info)) {
                // Pre-fetch product data for SKU matching
                const skus = order.raw_data.info.map((item: any) => item.sku).filter(Boolean);
                let productMap = new Map();
                if (skus.length > 0) {
                  const { data: matchedProducts } = await supabase
                    .from('products')
                    .select('sku, product_id, img_url, name')
                    .in('sku', skus);
                  matchedProducts?.forEach(p => productMap.set(p.sku.toLowerCase().trim(), p));
                }

                const lineItems = order.raw_data.info.map((item: any) => {
                  const match = productMap.get(item.sku?.toLowerCase().trim());
                  const itemId = `${manualOrderId}-${item.sku || Math.random().toString(36).substring(7)}`;
                  
                  return {
                    id: itemId,
                    order_id: manualOrderId,
                    order_name: order.order_id,
                    line_item_id: itemId,
                    name: match?.name || item.product_name || item.sku || 'Manual Item',
                    description: item.product_name || item.sku || 'Manual Item',
                    price: parseFloat(item.price || '0'),
                    quantity: parseInt(item.quantity || '1', 10),
                    vendor_name: item.supplier || 'Manual',
                    fulfillment_status: 'fulfilled',
                    status: 'active',
                    created_at: order.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    owner_email: ownerEmail,
                    owner_name: ownerName,
                    sku: item.sku || null,
                    product_id: match?.product_id || null,
                    img_url: match?.img_url || null,
                  };
                });

                await supabase.from('order_line_items_v2').upsert(lineItems, { onConflict: 'line_item_id' });
              }
            }
          }

          const targetOrderId = dbOrder?.id || platformOrderId
          let customerId = dbOrder?.customer_id

          // ... rest of the linkage logic ...

          // 2. If we found a customer ID, try to find their Supabase User UUID
          let ownerId: string | null = null
          if (customerId) {
            const { data: shopifyCustomer } = await supabase
              .from('shopify_customers')
              .select('user_id')
              .eq('shopify_customer_id', customerId)
              .maybeSingle()
            
            if (shopifyCustomer) {
              ownerId = shopifyCustomer.user_id
            }
          }

          // 3. Fallback: Try to find user by email if no Shopify Customer ID link found
          if (!ownerId && ownerEmail) {
            const { data: userData } = await supabase
              .from('users')
              .select('id')
              .eq('email', ownerEmail)
              .maybeSingle()
            
            if (userData) {
              ownerId = userData.id
            }
          }

          // 4. Update the order record with the warehouse email
          await supabase
            .from('orders')
            .update({
              fulfillment_status: 'fulfilled',
              customer_email: ownerEmail || dbOrder?.customer_email,
              updated_at: updatedAt,
            })
            .eq('id', targetOrderId)

          // 5. Update v2 line items with the complete linked profile
          await supabase
            .from('order_line_items_v2')
            .update({
              fulfillment_status: 'fulfilled',
              owner_name: ownerName || null,
              owner_email: ownerEmail || null,
              owner_id: ownerId, // This is the Supabase User UUID
              customer_id: customerId || null, // This is the Shopify Customer ID
              updated_at: updatedAt,
            })
            .eq('order_id', targetOrderId)

          // 6. Update legacy line items for compatibility
          await supabase
            .from('order_line_items')
            .update({
              fulfillment_status: 'fulfilled',
              tracking_number: order.tracking_number,
              tracking_url: order.last_mile_tracking || order.tracking_number || null,
              tracking_company: order.carrier || 'ChinaDivision',
              owner_name: ownerName || null,
              owner_email: ownerEmail || null,
              updated_at: updatedAt,
            })
            .eq('order_id', targetOrderId)
        }

        results.push({ orderId, status: dryRun ? 'dry-run' : 'processed' })
      } catch (error: any) {
        results.push({ orderId, status: 'error', detail: error.message || 'unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      window: { start: startStr, end: endStr },
      totalFetched: orders.length,
      eligible: eligible.length,
      linksCreated,
      emailsSent,
      fulfillmentsCreated,
      skipped,
      results,
    })
  } catch (error: any) {
    console.error('[auto-fulfill] error', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 },
    )
  }
}

