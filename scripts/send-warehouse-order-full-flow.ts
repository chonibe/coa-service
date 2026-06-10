import 'dotenv/config'

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { sendEmail } from '@/lib/email/client'
import { renderTemplate } from '@/lib/email/template-service'
import { sendOrderConfirmationWithTracking } from '@/lib/notifications/order-confirmation'
import {
  getArtistImageByHandle,
  getCollectionDescription,
  getCollectionInstagram,
} from '@/lib/shopify/artist-image'

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

function resolveRecipient(): string {
  const arg = process.argv.find((value) => value.startsWith('--email='))
  return arg ? arg.replace('--email=', '').trim() : 'chonibe@gmail.com'
}

function resolveOrderId(): string | undefined {
  const arg = process.argv.find((value) => value.startsWith('--orderId='))
  return arg ? arg.replace('--orderId=', '').trim() : undefined
}

function resolveTemplateKey(): string | undefined {
  const arg = process.argv.find((value) => value.startsWith('--template='))
  return arg ? arg.replace('--template=', '').trim() : undefined
}

function resolvePreviewOnly(): boolean {
  return process.argv.includes('--preview-only')
}

function resolvePreviewOutPath(): string | undefined {
  const arg = process.argv.find((value) => value.startsWith('--preview-out='))
  return arg ? arg.replace('--preview-out=', '').trim() : undefined
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

function normalizeName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const ARTIST_NAME_ALIASES: Record<string, string[]> = {
  'jack ac art': ['jake ac art'],
  'jake ac art': ['jack ac art'],
}

function isSameArtistName(a: string, b: string): boolean {
  const an = normalizeName(a)
  const bn = normalizeName(b)
  if (!an || !bn) return false
  if (an === bn) return true
  const aAliases = ARTIST_NAME_ALIASES[an] || []
  const bAliases = ARTIST_NAME_ALIASES[bn] || []
  return aAliases.includes(bn) || bAliases.includes(an)
}

function toHandle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseWikiArtistProfile(artistName: string): {
  bio?: string
  instagramUrl?: string
  aboutUrl?: string
} | null {
  try {
    const entitiesDir = path.join(process.cwd(), 'wiki', 'entities')
    const files = fs.readdirSync(entitiesDir).filter((name) => name.endsWith('.md'))
    const target = normalizeName(artistName)

    for (const file of files) {
      const fullPath = path.join(entitiesDir, file)
      const raw = fs.readFileSync(fullPath, 'utf8')
      const titleMatch = raw.match(/^title:\s*"?(.*?)"?$/m)
      const h1Match = raw.match(/^#\s+(.+)$/m)
      const title = titleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || ''
      if (!title || (!isSameArtistName(title, target) && normalizeName(title) !== target)) continue

      const overviewMatch = raw.match(/## Overview\s+([\s\S]*?)(?:\n## |\n---|$)/)
      const story = (overviewMatch?.[1] || '').replace(/\s+/g, ' ').trim()

      const igProfileMatch = raw.match(/\*\*Profile\*\*:\s*(https?:\/\/[^\s)]+)/i)
      const igHandleMatch = raw.match(/\*\*Instagram\*\*:\s*(@[A-Za-z0-9_.]+)/i)
      const aboutUrlMatch = raw.match(/\*\*Portfolio \/ About\*\*:\s*(https?:\/\/[^\s)]+)/i)

      const instagramUrl = igProfileMatch?.[1] || (
        igHandleMatch?.[1]
          ? `https://www.instagram.com/${igHandleMatch[1].replace('@', '').replace(/\/+$/, '')}/`
          : undefined
      )

      return {
        bio: story || undefined,
        instagramUrl,
        aboutUrl: aboutUrlMatch?.[1],
      }
    }
  } catch {
    // no-op: caller will use existing fallbacks
  }

  return null
}

function resolveArtistProfileImageFromPortfolioIndex(artistName: string): string | null {
  try {
    const filePath = path.join(process.cwd(), 'docs', 'dev', 'wiki-portfolio-images.json')
    const raw = fs.readFileSync(filePath, 'utf8')
    const index = JSON.parse(raw) as Record<
      string,
      { name?: string; ogImage?: string | null; workImages?: string[] }
    >
    const target = normalizeName(artistName)
    const entry = Object.values(index).find((row) => {
      const name = String(row.name || '')
      return isSameArtistName(name, target) || normalizeName(name) === target
    })
    if (!entry) return null

    if (entry.ogImage && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(entry.ogImage)) return entry.ogImage
    const firstUsableWorkImage = (entry.workImages || []).find((url) =>
      /^https?:\/\//i.test(url) &&
      /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) &&
      !/\.js(\?|$)/i.test(url)
    )
    return firstUsableWorkImage || null
  } catch {
    return null
  }
}

function parseAllArtistBiosEntry(artistName: string): {
  hook?: string
  story?: string
  instagramUrl?: string
} | null {
  try {
    const biosPath = path.join(process.cwd(), 'docs', 'features', 'street-collector', 'all-artist-bios.md')
    const raw = fs.readFileSync(biosPath, 'utf8')
    const sections = raw.split(/\n---\n/g)
    const target = normalizeName(artistName)

    for (const section of sections) {
      const heading = section.match(/^##\s+\d+\.\s+(.+)$/m)?.[1]?.trim()
      if (!heading) continue
      if (!isSameArtistName(heading, target) && normalizeName(heading) !== target) continue

      const hook = section.match(/\*\*Hook:\*\*\s*([\s\S]*?)(?:\n\n|\n\*\*Location:|\n###|$)/)?.[1]?.trim()
      const story = section.match(/### Story\s+([\s\S]*?)$/m)?.[1]?.trim()
      const igHandle = hook?.match(/\(@([A-Za-z0-9_.]+)\)/)?.[1]
      const instagramUrl = igHandle ? `https://www.instagram.com/${igHandle}/` : undefined

      return {
        hook: hook?.replace(/\s+/g, ' '),
        story: story?.replace(/\s+/g, ' '),
        instagramUrl,
      }
    }
  } catch {
    // no-op; caller handles fallback
  }

  return null
}

function isNonBrandArtwork(vendorName?: string | null, artworkName?: string | null): boolean {
  const brandVendors = new Set(['street collector', 'the street lamp', 'streetlamp'])
  const vendor = (vendorName || '').toLowerCase().trim()
  const artwork = (artworkName || '').toLowerCase().trim()
  if (!vendor || brandVendors.has(vendor)) return false
  if (artwork.includes('street lamp') || artwork.includes('artist kit')) return false
  return true
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

async function getShopifySecondaryImageByProductId(productId?: string | number | null): Promise<string | null> {
  if (!productId || !process.env.SHOPIFY_SHOP || !process.env.SHOPIFY_ACCESS_TOKEN) return null
  const response = await fetch(
    `https://${process.env.SHOPIFY_SHOP}/admin/api/2024-01/products/${encodeURIComponent(String(productId))}.json?fields=id,images`,
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
  const product = json?.product
  const images = (product?.images || []) as Array<{ position?: number; src?: string }>
  if (!images.length) return null
  const sorted = [...images].sort((a, b) => (a.position || 0) - (b.position || 0))
  const second = sorted[1]?.src
  return second || null
}

async function sendTemplateEmail(
  key: string,
  to: string,
  variables: Record<string, string>,
  subjectPrefix?: string
) {
  const rendered = await renderTemplate(key, variables)
  if (!rendered.subject || !rendered.html) {
    throw new Error(`Template "${key}" did not render`)
  }
  const result = await sendEmail({
    to,
    subject: subjectPrefix ? `${subjectPrefix}${rendered.subject}` : rendered.subject,
    html: rendered.html,
  })
  if (!result.success) {
    throw new Error(`Failed sending ${key}: ${result.error || 'unknown error'}`)
  }
  console.log(`[full-flow] sent ${key} (${result.messageId || 'no-message-id'})`)
}

async function main() {
  const recipient = resolveRecipient()
  const requestedOrderId = resolveOrderId()
  const requestedTemplate = resolveTemplateKey()
  const client = createChinaDivisionClient()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const start = getDateDaysAgo(45)
  const end = new Date().toISOString().split('T')[0]
  const orders = await client.getOrdersInfo(start, end, false)
  if (!orders.length) throw new Error('No warehouse orders found')

  const selectedOrder = requestedOrderId
    ? orders.find((order) => order.order_id === requestedOrderId || order.sys_order_id === requestedOrderId)
    : orders.find((order) => order.ship_email?.toLowerCase() === recipient.toLowerCase()) || orders[0]

  if (!selectedOrder) {
    throw new Error(`Could not find warehouse order for --orderId=${requestedOrderId}`)
  }

  const customerName = `${selectedOrder.first_name || ''} ${selectedOrder.last_name || ''}`.trim() || 'Collector'
  const orderName = selectedOrder.order_id || selectedOrder.sys_order_id || `WH-${Date.now()}`
  const trackingToken =
    selectedOrder.sys_order_id ||
    selectedOrder.order_id ||
    selectedOrder.tracking_number ||
    `warehouse-${Date.now()}`
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'}/track/${trackingToken}`

  const brandVendors = new Set(['street collector', 'the street lamp', 'streetlamp'])
  const orderItems = selectedOrder.info || []
  const allSkus = orderItems.map((item) => item.sku || item.sku_code).filter(Boolean) as string[]
  const firstItem = orderItems[0]
  const firstSku = firstItem?.sku || firstItem?.sku_code || ''
  const fallbackArtworkTitle = firstItem?.product_name || firstSku || 'Selected Artwork'

  let artworkTitle = fallbackArtworkTitle
  let artworkImageUrl = firstItem?.product_url || ''
  let artistName = ''
  let artistStorySnippet = ''

  const { data: orderLineItems } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, sku, img_url, quantity, product_id, product_id_text')
    .eq('order_name', orderName)

  const artworkLineItem =
    orderLineItems?.find(
      (li) => li.vendor_name && !brandVendors.has(li.vendor_name.toLowerCase().trim())
    ) || null
  const lampLineItem =
    orderLineItems?.find((li) => li.vendor_name && brandVendors.has(li.vendor_name.toLowerCase().trim())) || null

  if (artworkLineItem) {
    artworkTitle = artworkLineItem.name || artworkTitle
    artistName = artworkLineItem.vendor_name || artistName
    artworkImageUrl = artworkLineItem.img_url || artworkImageUrl
  }

  let secondArtworkImageUrl = ''

  if (artworkLineItem) {
    secondArtworkImageUrl = await getShopifySecondaryImageByProductId(
      artworkLineItem.product_id || artworkLineItem.product_id_text
    )
  }

  if (allSkus.length > 0 && (!artworkLineItem || !artistName)) {
    const { data: products } = await supabase
      .from('products')
      .select('name, image_url, img_url, vendor_name, handle')
      .in('sku', allSkus)

    const preferredProduct =
      products?.find((p) => p.vendor_name && !brandVendors.has(p.vendor_name.toLowerCase().trim())) ||
      products?.[0]

    if (preferredProduct?.name) artworkTitle = preferredProduct.name
    if (!artworkImageUrl) artworkImageUrl = preferredProduct?.image_url || preferredProduct?.img_url || ''
    if (preferredProduct?.vendor_name) artistName = preferredProduct.vendor_name

    if (artistName && !brandVendors.has(artistName.toLowerCase().trim())) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('vendor_name, artist_bio, bio, artist_history, profile_picture_url, profile_image')
        .ilike('vendor_name', artistName)
        .limit(1)
        .maybeSingle()

      if (vendor?.vendor_name) artistName = vendor.vendor_name
      const longBio = vendor?.artist_bio || vendor?.bio || vendor?.artist_history || ''
      if (longBio) {
        artistStorySnippet = longBio.replace(/\s+/g, ' ').trim().slice(0, 320)
      }
      if (!artworkImageUrl) {
        artworkImageUrl = vendor?.profile_picture_url || vendor?.profile_image || ''
      }

      const { data: artistProducts } = await supabase
        .from('products')
        .select('image_url, img_url, handle')
        .ilike('vendor_name', artistName)
        .limit(8)

      const shopifySecondCandidates = await Promise.all(
        (artistProducts || []).map((p) => getShopifySecondaryImageByHandle(p.handle))
      )
      const firstShopifySecond = shopifySecondCandidates.find(Boolean)
      if (firstShopifySecond) secondArtworkImageUrl = firstShopifySecond

      const images = (artistProducts || [])
        .map((p) => p.image_url || p.img_url || '')
        .filter(Boolean)
      if (!secondArtworkImageUrl && images.length > 1) secondArtworkImageUrl = images[1]
    }
  }

  if (!secondArtworkImageUrl && artworkLineItem?.sku) {
    const { data: artworkHistoryImages } = await supabase
      .from('order_line_items_v2')
      .select('img_url, created_at')
      .eq('sku', artworkLineItem.sku)
      .not('img_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    const uniqueImages = Array.from(
      new Set((artworkHistoryImages || []).map((row) => row.img_url).filter(Boolean))
    )
    if (uniqueImages.length > 1) {
      // Never use first image by rule: force second
      secondArtworkImageUrl = uniqueImages[1] as string
    } else if (uniqueImages.length === 1) {
      // If only one historical image exists for this SKU, avoid first image by using another
      // non-brand artwork image from this order when available.
      const alternateOrderArtwork = (orderLineItems || [])
        .filter((li) => isNonBrandArtwork(li.vendor_name, li.name) && li.sku !== artworkLineItem.sku)
        .map((li) => li.img_url)
        .find(Boolean)
      if (alternateOrderArtwork) secondArtworkImageUrl = alternateOrderArtwork
    }
  }

  if (!artistName || brandVendors.has(artistName.toLowerCase().trim())) {
    artistName = 'Featured Street Artist'
  }
  if (!artistStorySnippet) {
    artistStorySnippet = lookupArtistResearchSnippet(artistName) ||
      `${artistName} is an artist featured in the collection with a distinctive visual language.`
  }
  if (!artworkImageUrl) {
    artworkImageUrl = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200'
  }

  const qty = (selectedOrder.info || []).reduce((acc, item) => {
    const n = Number(item.quantity || '0')
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
  const total = selectedOrder.freight && selectedOrder.freight !== '0'
    ? selectedOrder.freight
    : qty > 0 ? `${qty} item${qty > 1 ? 's' : ''}` : 'N/A'
  const orderDate = selectedOrder.date_added || new Date().toISOString().slice(0, 10)

  if (!requestedTemplate) {
    await sendOrderConfirmationWithTracking({
      orderName,
      customerName,
      customerEmail: recipient,
      trackingToken,
      totalPrice: total,
      orderDate,
      currency: '$',
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com',
    })
  }

  const shared = {
    orderName,
    customerName,
    recipientName: customerName,
    trackingUrl,
    trackingNumber: selectedOrder.tracking_number || selectedOrder.last_mile_tracking || 'Pending',
    warehouseStage: selectedOrder.status_name || 'Warehouse Processing',
    nextUpdateWindow: '24-48 hours',
    artworkTitle,
    artistName,
    artistStorySnippet,
    artistPressSnippet: '',
    artworkNarrative: `${artworkTitle} sits inside the ${artistName} collection and reflects the style and themes the artist is known for.`,
    artworkImageUrl,
    lampArtImageUrl: secondArtworkImageUrl || lampLineItem?.img_url || artworkImageUrl,
    collectionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'}/collector/dashboard`,
    instagramUrl: 'https://www.instagram.com/streetcollector_/',
    shippingWindow: 'Soon',
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'}/collector/dashboard`,
    lampVideoUrl: homeV2LandingContent.hero.videoUrl,
    lampVideoPosterUrl: homeV2LandingContent.hero.videoPosterUrl,
  }

  if (artistName && artistName !== 'Featured Street Artist') {
    const artistHandle = toHandle(artistName)
    const collectionDescription = await getCollectionDescription(artistHandle)
    const collectionInstagramHandle = await getCollectionInstagram(artistHandle)
    const collectionArtistImage = await getArtistImageByHandle(artistHandle)

    if (collectionDescription) {
      const normalized = collectionDescription.replace(/\s+/g, ' ').trim()
      shared.artistStorySnippet = normalized.slice(0, 320)
      const overflow = normalized.slice(320, 580).trim()
      if (overflow) shared.artistPressSnippet = overflow
    }
    if (collectionInstagramHandle) {
      shared.instagramUrl = `https://www.instagram.com/${collectionInstagramHandle.replace(/^@/, '').replace(/\/+$/, '')}/`
    }
    if (collectionArtistImage) {
      // Preferred source per user request: vendor collection image.
      shared.lampArtImageUrl = collectionArtistImage
    }

    const biosEntry = parseAllArtistBiosEntry(artistName)
    if (biosEntry?.story && !collectionDescription) {
      artistStorySnippet = biosEntry.story.slice(0, 320)
      shared.artistStorySnippet = artistStorySnippet
    }
    if (biosEntry?.hook && !shared.artistPressSnippet) {
      shared.artistPressSnippet = biosEntry.hook.slice(0, 260)
    }

    const wikiProfile = parseWikiArtistProfile(artistName)
    if (wikiProfile?.bio && !collectionDescription) {
      artistStorySnippet = wikiProfile.bio.slice(0, 320)
      shared.artistStorySnippet = artistStorySnippet
    }

    const { data: vendorDetails } = await supabase
      .from('vendors')
      .select('instagram_url, artist_history')
      .ilike('vendor_name', artistName)
      .limit(1)
      .maybeSingle()

    if (vendorDetails?.instagram_url && !collectionInstagramHandle) {
      shared.instagramUrl = vendorDetails.instagram_url
    }
    if (wikiProfile?.instagramUrl && !collectionInstagramHandle) {
      shared.instagramUrl = wikiProfile.instagramUrl
    }
    if (vendorDetails?.artist_history && !shared.artistPressSnippet) {
      shared.artistPressSnippet = vendorDetails.artist_history.replace(/\s+/g, ' ').trim().slice(0, 260)
    } else if (!shared.artistPressSnippet) {
      shared.artistPressSnippet = `${artistName} has been featured in collector/editorial circles for expressive, culture-led visual work.`
    }

    const artistProfileImage = resolveArtistProfileImageFromPortfolioIndex(artistName)
    if (artistProfileImage && !collectionArtistImage) {
      // For artist-story email, use artist profile/source image from wiki portfolio index.
      shared.lampArtImageUrl = artistProfileImage
    }
  } else {
    shared.artistPressSnippet = 'This artist has been featured by collectors and art communities for distinctive visual storytelling.'
  }

  // Fallback only when no artist-specific handle exists.
  if (!shared.instagramUrl || !/^https?:\/\/www\.instagram\.com\/[A-Za-z0-9_.]+\/?$/i.test(shared.instagramUrl)) {
    shared.instagramUrl = 'https://www.instagram.com/streetcollector_/'
  }

  if (requestedTemplate) {
    const stringShared = Object.fromEntries(
      Object.entries(shared).map(([k, v]) => [k, String(v ?? '')])
    ) as Record<string, string>

    if (resolvePreviewOnly()) {
      const defaultName = `${requestedTemplate}-${String(orderName).replace(/#/g, '')}-${Date.now()}.html`
      const outRel = resolvePreviewOutPath() || path.join(process.cwd(), '.tmp', 'email-previews', defaultName)
      const outAbs = path.isAbsolute(outRel) ? outRel : path.join(process.cwd(), outRel)
      fs.mkdirSync(path.dirname(outAbs), { recursive: true })
      const rendered = await renderTemplate(requestedTemplate, stringShared)
      if (!rendered.html) {
        throw new Error(`Template "${requestedTemplate}" produced no HTML`)
      }
      fs.writeFileSync(outAbs, rendered.html, 'utf8')
      console.log(`[full-flow] preview-only: wrote ${outAbs}`)
      console.log(`[full-flow] subject: ${rendered.subject}`)
      console.log('[full-flow] open the file in a browser (no email sent)')
      return
    }

    await sendTemplateEmail(requestedTemplate, recipient, shared)
    console.log(`[full-flow] completed single template ${requestedTemplate} for ${orderName} to ${recipient}`)
    return
  }

  await sendTemplateEmail('post_purchase_preparing_day2', recipient, shared)
  await sendTemplateEmail('post_purchase_artist_story_day5', recipient, shared)
  await sendTemplateEmail('post_purchase_almost_ready', recipient, shared)
  await sendTemplateEmail('shipping_shipped', recipient, shared)
  await sendTemplateEmail('post_purchase_post_delivery_activation', recipient, shared)
  await sendTemplateEmail('post_purchase_feedback_followup', recipient, shared)

  console.log(`[full-flow] completed for real warehouse order ${orderName} to ${recipient}`)
}

main().catch((error) => {
  console.error('[full-flow] failed:', error)
  process.exit(1)
})

