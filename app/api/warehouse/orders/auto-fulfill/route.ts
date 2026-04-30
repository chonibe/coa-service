import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { sendEmail } from '@/lib/email/client'
import { 
  sendTrackingUpdateEmail, 
  type TrackingEmailOrder,
  TRACK_STATUS_STAGES,
  WAREHOUSE_STATUS,
  STAGE_MESSAGES,
  getStageForNotification,
  getStatusLabel,
  getTrackStatusLabel,
} from '@/lib/notifications/tracking-link'
import { createFulfillmentWithTracking } from '@/lib/shopify/fulfillment'
import { homeV2LandingContent } from '@/content/home-v2-landing'

const CRON_SECRET = process.env.CRON_SECRET

const PACKAGED_STATUS = 2
const IN_TRANSIT_TRACK_STATUS = 101

// Meaningful stages that should trigger notifications
const NOTIFICATION_STAGES = new Set([
  WAREHOUSE_STATUS.SHIPPED,        // 3 - Shipped
  TRACK_STATUS_STAGES.IN_TRANSIT,  // 101 - In Transit
  TRACK_STATUS_STAGES.OUT_FOR_DELIVERY, // 112 - Out for Delivery
  TRACK_STATUS_STAGES.DELIVERED,   // 121 - Delivered
  TRACK_STATUS_STAGES.ALERT,       // 131 - Alert
])

const BRAND_VENDOR_NAMES = new Set(['street collector', 'the street lamp', 'streetlamp'])

/**
 * Check if status has changed to a meaningful stage that warrants notification
 */
function shouldNotifyForStatusChange(
  currentStatus: number | undefined,
  currentTrackStatus: number | undefined,
  lastNotified: { status?: number; track_status?: number } | undefined
): { shouldNotify: boolean; stage: number | null; reason: string } {
  // Get the effective stage for the current status
  const currentStage = getStageForNotification(currentTrackStatus, currentStatus)
  
  if (!currentStage || !NOTIFICATION_STAGES.has(currentStage)) {
    return { shouldNotify: false, stage: null, reason: 'not_meaningful_stage' }
  }
  
  // If no previous notification, should notify
  if (!lastNotified) {
    return { shouldNotify: true, stage: currentStage, reason: 'first_notification' }
  }
  
  // Get the last notified stage
  const lastStage = getStageForNotification(lastNotified.track_status, lastNotified.status)
  
  // If the stage is the same, don't notify again
  if (currentStage === lastStage) {
    return { shouldNotify: false, stage: currentStage, reason: 'same_stage' }
  }
  
  // Stage has changed to a new meaningful stage
  return { shouldNotify: true, stage: currentStage, reason: 'stage_changed' }
}

/**
 * Generate a human-readable note for a status change
 */
function generateStatusNote(stage: number, trackingNumber?: string): string {
  const stageMessage = STAGE_MESSAGES[stage]
  if (!stageMessage) {
    return `Status updated${trackingNumber ? `. Tracking: ${trackingNumber}` : ''}`
  }
  return `${stageMessage.headline}${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`
}

function isNonBrandArtwork(vendorName?: string | null, artworkName?: string | null): boolean {
  const vendor = (vendorName || '').toLowerCase().trim()
  const artwork = (artworkName || '').toLowerCase().trim()
  if (!vendor || BRAND_VENDOR_NAMES.has(vendor)) return false
  if (artwork.includes('street lamp') || artwork.includes('artist kit')) return false
  return true
}

function getArtistStageEmailCopy(stage: 'packaged' | 'shipped_plus_5_days' | 'delivered' | 'delivered_feedback') {
  if (stage === 'packaged') {
    return {
      subjectPrefix: 'We are preparing your artwork:',
      headline: 'Your artwork is being carefully prepared',
      lead: 'Your piece is now in packaging and quality checks.',
    }
  }
  if (stage === 'shipped_plus_5_days') {
    return {
      subjectPrefix: 'Artist story:',
      headline: 'The story behind your artwork',
      lead: 'Now that your order is in transit, here is more context about the artist behind your piece.',
    }
  }
  if (stage === 'delivered_feedback') {
    return {
      subjectPrefix: 'How is your setup?',
      headline: 'We would love your feedback',
      lead: 'Now that you have had some time with your artwork, tell us how it feels in your space.',
    }
  }
  return {
    subjectPrefix: 'How is your artwork?',
    headline: 'Your artwork has arrived',
    lead: 'We would love your feedback now that you have had time with the piece.',
  }
}

function lookupArtistResearchSnippet(artistName: string): string {
  try {
    const filePath = path.join(process.cwd(), 'content', 'artist-research-data.json')
    const raw = fs.readFileSync(filePath, 'utf8')
    const rows = JSON.parse(raw) as Array<Record<string, unknown>>
    const target = artistName.toLowerCase().trim()
    const match = rows.find((row) => String(row.name || '').toLowerCase().trim() === target)
    const text = String(match?.summary || match?.bio || match?.artistBio || '')
    return text.replace(/\s+/g, ' ').trim().slice(0, 320)
  } catch {
    return ''
  }
}

async function getShopifySecondaryImageByHandle(handle?: string | null): Promise<string | null> {
  if (!handle || !process.env.SHOPIFY_SHOP || !process.env.SHOPIFY_ACCESS_TOKEN) return null
  const response = await fetch(
    `https://${process.env.SHOPIFY_SHOP}/admin/api/2024-01/products.json?handle=${encodeURIComponent(handle)}&fields=id,images`,
    {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  )
  if (!response.ok) return null
  const json = await response.json()
  const product = json?.products?.[0]
  const images = (product?.images || []) as Array<{ position?: number; src?: string }>
  if (!images.length) return null
  const sorted = [...images].sort((a, b) => (a.position || 0) - (b.position || 0))
  const second = sorted[1]?.src
  return second || null
}

async function sendArtistIntroMilestoneEmails(params: {
  supabase: ReturnType<typeof createClient>
  order: any
  trackingToken: string
}) {
  const { supabase, order, trackingToken } = params
  const orderName = order.order_id || order.sys_order_id || ''
  const recipientEmail = order.ship_email?.toLowerCase()
  if (!orderName || !recipientEmail) return 0

  const { data: lineItems } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, sku, img_url')
    .eq('order_name', orderName)

    const allLineItems = lineItems || []
    const artworks = allLineItems.filter((li) => isNonBrandArtwork(li.vendor_name, li.name))
    const lampLineItem =
      allLineItems.find((li) => li.vendor_name && BRAND_VENDOR_NAMES.has(li.vendor_name.toLowerCase().trim())) || null
  if (!artworks.length) return 0

  const now = new Date()

  const { data: shippedNote } = await supabase
    .from('order_status_notes')
    .select('created_at')
    .eq('order_name', orderName)
    .eq('source', 'auto')
    .eq('status_code', 3)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const shippedAt = shippedNote?.created_at ? new Date(shippedNote.created_at) : null
  const shippedPlusFiveDaysDue = !!(shippedAt && (now.getTime() - shippedAt.getTime()) >= 5 * 24 * 60 * 60 * 1000)

  const stagesToSend: Array<'packaged' | 'shipped_plus_5_days' | 'delivered' | 'delivered_feedback'> = []
  if (order.status === PACKAGED_STATUS) stagesToSend.push('packaged')
  if (shippedPlusFiveDaysDue) stagesToSend.push('shipped_plus_5_days')
  if (Number(order.track_status) === TRACK_STATUS_STAGES.DELIVERED) {
    stagesToSend.push('delivered')
    if (shippedAt && (now.getTime() - shippedAt.getTime()) >= 8 * 24 * 60 * 60 * 1000) {
      stagesToSend.push('delivered_feedback')
    }
  }
  if (!stagesToSend.length) return 0

  let sentCount = 0
  for (const artwork of artworks) {
    const vendorName = artwork.vendor_name || 'Featured Artist'
    const artworkName = artwork.name || artwork.sku || 'Artwork'
    const sku = artwork.sku || artworkName

    const { data: vendor } = await supabase
      .from('vendors')
      .select('vendor_name, artist_bio, bio, artist_history')
      .ilike('vendor_name', vendorName)
      .limit(1)
      .maybeSingle()

    const artistDisplayName = vendor?.vendor_name || vendorName
    const artistBioRaw = vendor?.artist_bio || vendor?.bio || vendor?.artist_history || ''
    const artistBio = artistBioRaw.replace(/\s+/g, ' ').trim().slice(0, 420) ||
      lookupArtistResearchSnippet(artistDisplayName) ||
      `${artistDisplayName} is an artist featured in the collection with a distinctive visual language.`
    const artistPress = (vendor?.artist_history || '').replace(/\s+/g, ' ').trim().slice(0, 260)
    const instagramUrl = vendor?.instagram_url || 'https://instagram.com/streetcollector'

    const { data: artistProducts } = await supabase
      .from('products')
      .select('image_url, img_url, handle')
      .ilike('vendor_name', artistDisplayName)
      .limit(8)
    const shopifySecondCandidates = await Promise.all(
      (artistProducts || []).map((p) => getShopifySecondaryImageByHandle(p.handle))
    )
    const firstShopifySecond = shopifySecondCandidates.find(Boolean)
    const artistImages = (artistProducts || []).map((p) => p.image_url || p.img_url || '').filter(Boolean)
    let secondArtworkImage = firstShopifySecond || (artistImages.length > 1 ? artistImages[1] : '')

    const { data: artworkHistoryImages } = await supabase
      .from('order_line_items_v2')
      .select('img_url, created_at')
      .eq('sku', sku)
      .not('img_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)
    const uniqueHistoryImages = Array.from(
      new Set((artworkHistoryImages || []).map((row) => row.img_url).filter(Boolean))
    )
    if (uniqueHistoryImages.length > 1) {
      secondArtworkImage = uniqueHistoryImages[1] as string
    } else if (!secondArtworkImage && uniqueHistoryImages.length === 1) {
      const alternateOrderArtwork = artworks
        .filter((li) => li.sku !== sku)
        .map((li) => li.img_url)
        .find(Boolean)
      if (alternateOrderArtwork) secondArtworkImage = alternateOrderArtwork
    }

    for (const stage of stagesToSend) {
      const marker = `[artist_intro][stage:${stage}][sku:${sku}]`
      const { data: existingStageNote } = await supabase
        .from('order_status_notes')
        .select('id')
        .eq('order_name', orderName)
        .eq('source', 'artist_intro')
        .like('note', `%${marker}%`)
        .limit(1)
        .maybeSingle()

      if (existingStageNote) continue

      const copy = getArtistStageEmailCopy(stage)
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'}/track/${trackingToken}`
      const videoUrl = homeV2LandingContent.hero.videoUrl
      const videoPosterUrl = homeV2LandingContent.hero.videoPosterUrl

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f4f4f2;margin:0;padding:24px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e7e5df;border-radius:12px;padding:28px;">
            <p style="margin:0 0 8px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b;font-size:11px;">Artist Intro</p>
            <h1 style="margin:0 0 12px;color:#111;font-size:26px;">${copy.headline}</h1>
            <p style="color:#2a2a2a;">Hi ${(order.first_name || '') + ' ' + (order.last_name || '')},</p>
            <p style="color:#2a2a2a;">${copy.lead}</p>
            <div style="background:#f7f7f5;border:1px solid #eceae5;border-radius:10px;padding:14px;margin:14px 0;">
              <p style="margin:0;color:#1f1f1f;"><strong>Artwork:</strong> ${artworkName}</p>
              <p style="margin:6px 0 0;color:#1f1f1f;"><strong>Artist:</strong> ${artistDisplayName}</p>
            </div>
            ${(secondArtworkImage || lampLineItem?.img_url || artwork.img_url) ? `<img src="${secondArtworkImage || lampLineItem?.img_url || artwork.img_url}" alt="Lamp with ${artworkName}" style="max-width:100%;border-radius:10px;border:1px solid #eceae5;margin-bottom:10px;" /><p style="color:#7a7a7a;font-size:12px;margin:0 0 12px;">Artwork preview</p>` : ''}
            <p style="color:#2a2a2a;">${artistBio}</p>
            ${artistPress ? `<p style="color:#2a2a2a;">${artistPress}</p>` : ''}
            <p style="color:#2a2a2a;">See more from ${artistDisplayName}: <a href="${instagramUrl}" style="color:#111;">${instagramUrl}</a></p>
            ${stage === 'delivered_feedback' ? `
              <h3 style="margin:16px 0 8px;color:#111;">How is your lamp and artwork setup?</h3>
              <p style="color:#2a2a2a;">Reply directly to this email with your feedback, or share a photo of your setup.</p>
              <video controls autoplay muted loop playsinline poster="${videoPosterUrl}" style="width:100%;max-width:100%;border-radius:10px;border:1px solid #eceae5;background:#000;">
                <source src="${videoUrl}" type="video/mp4" />
              </video>
              <p style="margin:8px 0 0;color:#2a2a2a;font-size:13px;">If video does not play in your inbox, watch it here: <a href="${videoUrl}" style="color:#111;">Street Lamp video</a></p>
            ` : ''}
            <a href="${trackingUrl}" style="background:#111;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;display:inline-block;margin-top:14px;">Track order ${orderName}</a>
          </div>
        </div>
      `

      const emailResult = await sendEmail({
        to: recipientEmail,
        subject: `${copy.subjectPrefix} ${artworkName} (${orderName})`,
        html,
      })

      if (!emailResult.success) {
        await supabase.from('order_status_notes').insert({
          order_id: orderName.replace('#', ''),
          order_name: orderName,
          status_code: order.status,
          status_name: order.status_name,
          track_status_code: order.track_status,
          track_status_name: order.track_status_name,
          tracking_number: order.tracking_number,
          source: 'artist_intro',
          note: `${marker} failed: ${emailResult.error || 'unknown error'}`,
        })
        continue
      }

      sentCount++
      await supabase.from('order_status_notes').insert({
        order_id: orderName.replace('#', ''),
        order_name: orderName,
        status_code: order.status,
        status_name: order.status_name,
        track_status_code: order.track_status,
        track_status_name: order.track_status_name,
        tracking_number: order.tracking_number,
        source: 'artist_intro',
        note: `${marker} sent messageId=${emailResult.messageId || 'n/a'}`,
      })
    }
  }

  return sentCount
}

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
      const packaged = order.status === PACKAGED_STATUS
      return (hasTracking && (inTransit || shipped)) || packaged
    })

    const results: Array<{ orderId: string; status: string; detail?: string }> = []
    let linksCreated = 0
    let emailsSent = 0
    let fulfillmentsCreated = 0
    let notesCreated = 0
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

        // Check if we should send a notification for this status change
        const orderKey = order.order_id || order.sys_order_id
        const { data: prefs } = await supabase
          .from('tracking_link_notification_preferences')
          .select('last_notified_status')
          .eq('token', trackingLink.token)
          .maybeSingle()

        const lastNotifiedStatus = (prefs?.last_notified_status as Record<string, any>) || {}
        const lastNotifiedForOrder = orderKey ? lastNotifiedStatus[orderKey] : undefined

        const { shouldNotify, stage, reason } = shouldNotifyForStatusChange(
          order.status,
          order.track_status,
          lastNotifiedForOrder
        )

        if (!dryRun && order.ship_email && shouldNotify && stage) {
          // Send stage-specific email notification
          const emailResult = await sendTrackingUpdateEmail({
            token: trackingLink.token,
            title: trackingLink.title || 'Order Tracking',
            orders: emailOrders,
            primaryColor: trackingLink.primary_color || '#8217ff',
            email: order.ship_email,
            baseUrl: process.env.NEXT_PUBLIC_APP_URL,
            stage, // Pass the stage for stage-specific messaging
          })
          
          if (!emailResult.success) {
            console.error(`[auto-fulfill] Failed to send email for ${orderId}: ${emailResult.error}`)
          } else {
            emailsSent++
            console.log(`[auto-fulfill] Sent ${STAGE_MESSAGES[stage]?.headline || 'status update'} email for ${orderId}`)
          }

          // Update last_notified_status
          if (orderKey) {
            lastNotifiedStatus[orderKey] = {
              status: order.status,
              track_status: order.track_status,
            }
          }

          await supabase
            .from('tracking_link_notification_preferences')
            .update({
              last_notified_status: lastNotifiedStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('token', trackingLink.token)

          // Insert order status note for this stage change
          const targetOrderId = order.order_id?.toString().replace('#', '').trim()
          const { error: noteError } = await supabase.from('order_status_notes').insert({
            order_id: targetOrderId || orderId,
            order_name: order.order_id,
            status_code: order.status,
            status_name: getStatusLabel(order.status, order.status_name),
            track_status_code: order.track_status,
            track_status_name: getTrackStatusLabel(order.track_status, order.track_status_name),
            tracking_number: order.tracking_number,
            note: generateStatusNote(stage, order.tracking_number),
            source: 'auto',
          })
          if (!noteError) {
            notesCreated++
          }
        } else if (!dryRun && !shouldNotify) {
          // Log why we're not sending
          console.log(`[auto-fulfill] Skipping notification for ${orderId}: ${reason}`)
        }

        // Send artist intro emails per artwork on milestone triggers:
        // - packaged (now)
        // - shipped + 5 days
        // - delivered (now)
        if (!dryRun) {
          const artistIntroSent = await sendArtistIntroMilestoneEmails({
            supabase,
            order,
            trackingToken: trackingLink.token,
          })
          if (artistIntroSent > 0) {
            emailsSent += artistIntroSent
            console.log(`[auto-fulfill] Sent ${artistIntroSent} artist-intro milestone emails for ${orderId}`)
          }
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
                const productMap = new Map();
                if (skus.length > 0) {
                  const { data: matchedProducts } = await supabase
                    .from('products')
                    .select('sku, product_id, img_url, name')
                    .in('sku', skus);
                  matchedProducts?.forEach(p => productMap.set(p.sku.toLowerCase().trim(), p));
                }

                const lineItems = order.raw_data.info.map((item: any, index: number) => {
                  const match = productMap.get(item.sku?.toLowerCase().trim());
                  // Ensure uniqueness even with duplicate SKUs by including index
                  const itemId = `${manualOrderId}-${item.sku || 'no-sku'}-${index}`;
                  
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
          const customerId = dbOrder?.customer_id

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
            .from('order_line_items_v2')
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
      notesCreated,
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

