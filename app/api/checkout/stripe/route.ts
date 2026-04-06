import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getProduct, extractVariantId } from '@/lib/shopify/storefront-client'
import { createClient } from '@/lib/supabase/server'
import { fetchStreetLadderUsdByNumericProductIds } from '@/lib/shop/resolve-street-ladder-prices-server'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { getShopDiscountSettings } from '@/lib/shop/get-shop-discount-flags'
import { buildStripeCheckoutShippingOptions } from '@/lib/shop/stripe-checkout-shipping'

/**
 * Stripe Checkout API
 * 
 * Creates a Stripe Checkout session for product purchases.
 * Stores Shopify variant ID in metadata for order sync.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
})

// =============================================================================
// TYPES
// =============================================================================

interface CheckoutLineItem {
  variantId: string // Shopify variant GID
  quantity: number
  /** Numeric id or Product GID — when present, unit_amount may be overridden from Street ladder */
  shopifyProductId?: string
  productHandle?: string
  productTitle?: string
  variantTitle?: string
  price: number // Price in cents
  compareAtPrice?: number // Compare at price in cents
  imageUrl?: string
}

interface CreateCheckoutRequest {
  lineItems: CheckoutLineItem[]
  customerEmail?: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
  allowPromotionCodes?: boolean
  mode?: 'payment' | 'subscription'
  shippingAddressCollection?: boolean
  billingAddressCollection?: 'required' | 'auto'
}

// =============================================================================
// POST - Create Checkout Session
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json()
    
    const {
      lineItems,
      customerEmail,
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop`,
      metadata = {},
      allowPromotionCodes = true,
      mode = 'payment',
      shippingAddressCollection = true,
      billingAddressCollection = 'auto',
    } = body
    
    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'No line items provided' },
        { status: 400 }
      )
    }

    let pricedLineItems = lineItems
    try {
      const supabase = createClient()
      const ladderIds = lineItems
        .map((li) => normalizeShopifyProductId(li.shopifyProductId))
        .filter((x): x is string => !!x)
      if (ladderIds.length > 0) {
        const ladder = await fetchStreetLadderUsdByNumericProductIds(supabase, ladderIds)
        pricedLineItems = lineItems.map((item) => {
          const key = normalizeShopifyProductId(item.shopifyProductId)
          const u = key ? ladder[key] : undefined
          if (u != null && u > 0) return { ...item, price: Math.round(u * 100) }
          return item
        })
      }
    } catch (e) {
      console.warn('[checkout/stripe] Street ladder reprice skipped:', e)
    }

    const subtotalCents = pricedLineItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shopDiscountSettings = await getShopDiscountSettings()
    
    // Build Stripe line items
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pricedLineItems.map((item) => ({
      price_data: {
        currency: 'usd',
        unit_amount: item.price,
        product_data: {
          name: item.productTitle || 'Product',
          description: item.variantTitle || undefined,
          images: item.imageUrl ? [item.imageUrl] : undefined,
          metadata: {
            shopify_variant_id: extractVariantId(item.variantId),
            shopify_variant_gid: item.variantId,
            product_handle: item.productHandle || '',
          },
        },
      },
      quantity: item.quantity,
    }))
    
    // Build metadata with all Shopify variant IDs for order sync (Stripe metadata values max 500 chars — use compact format)
    const shopifyVariantsCompact = pricedLineItems
      .map(item => `${extractVariantId(item.variantId)}:${item.quantity}`)
      .join(',')
    const sessionMetadata: Record<string, string> = {
      ...metadata,
      shopify_variant_ids: shopifyVariantsCompact,
      source: 'headless_storefront',
    }
    
    // Create Stripe Checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: sessionMetadata,
      allow_promotion_codes: allowPromotionCodes,
      billing_address_collection: billingAddressCollection,
      payment_method_types: ['card', 'paypal', 'link'],
      ...(customerEmail && { customer_email: customerEmail }),
      ...(shippingAddressCollection && {
        shipping_address_collection: {
          allowed_countries: [
            'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
            'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL',
            'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE',
            'LU', 'MT', 'CY', 'NZ', 'SG', 'HK', 'JP', 'KR', 'IL', 'AE',
          ],
        },
        shipping_options: buildStripeCheckoutShippingOptions(
          subtotalCents,
          shopDiscountSettings.flags.shippingFreeOver70
        ),
      }),
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams)
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET - Get Checkout Session (for success page)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const paymentIntentId = searchParams.get('payment_intent')

    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = createClient()
      const { data: purchase } = await supabase
        .from('stripe_purchases')
        .select('*')
        .eq('stripe_payment_intent', paymentIntentId)
        .maybeSingle()

      const metadata = pi.metadata || {}
      const variantsRaw = metadata.shopify_variant_ids || ''
      const variants = variantsRaw.split(',').map((part: string) => {
        const [variantId, qty] = part.split(':')
        return { variantId: variantId ?? '', quantity: parseInt(qty ?? '1', 10) }
      }).filter((v: { variantId: string }) => v.variantId)

      return NextResponse.json({
        session: {
          id: pi.id,
          status: 'complete',
          paymentStatus: 'paid',
          customerEmail: metadata.collector_identifier || metadata.collector_email || '',
          amountTotal: pi.amount_received || pi.amount,
          currency: pi.currency || 'usd',
          lineItems: (purchase?.metadata?.line_items || variants.map((v: { variantId: string; quantity: number }) => ({
            description: `Variant ${v.variantId}`,
            quantity: v.quantity,
            amount: Math.round((pi.amount_received || pi.amount || 0) / variants.reduce((s: number, x: { quantity: number }) => s + x.quantity, 0)) * (v.quantity || 1),
            imageUrl: undefined,
          }))).map((li: { description?: string; quantity?: number; amount?: number; imageUrl?: string }) => ({
            description: li.description ?? '',
            quantity: li.quantity ?? 1,
            amount: li.amount ?? 0,
            imageUrl: li.imageUrl,
          })),
          shippingDetails: null,
          metadata: metadata,
        },
        seriesProgress: [],
      })
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID or payment_intent is required' },
        { status: 400 }
      )
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price', 'customer', 'payment_intent'],
    })
    
    // Fetch series progress for purchased items (non-blocking)
    let seriesProgress: SeriesProgressItem[] = []
    try {
      const productHandles = extractProductHandles(session.metadata)
      if (productHandles.length > 0) {
        seriesProgress = await fetchSeriesProgressForProducts(
          productHandles,
          session.customer_details?.email || session.customer_email || undefined
        )
      }
    } catch (error) {
      console.debug('Could not fetch series progress:', error)
    }
    
    const sessionPaymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent)?.id ?? null

    return NextResponse.json({
      session: {
        id: session.id,
        paymentIntentId: sessionPaymentIntentId,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency,
        lineItems: session.line_items?.data.map(item => {
          const price = item.price as Stripe.Price & { product_data?: { images?: string[] } } | undefined
          const imageUrl = price?.product_data?.images?.[0] ?? undefined
          return {
            description: item.description,
            quantity: item.quantity,
            amount: item.amount_total,
            imageUrl,
          }
        }),
        shippingDetails: session.shipping_details,
        metadata: session.metadata,
      },
      seriesProgress,
    })
  } catch (error: any) {
    console.error('Error retrieving Stripe checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}

// =============================================================================
// SERIES PROGRESS HELPERS
// =============================================================================

interface SeriesProgressItem {
  seriesName: string
  seriesId: string
  totalArtworks: number
  ownedCount: number
  thumbnailUrl: string | null
}

/**
 * Extract product handles from Stripe session metadata
 * Supports headless_storefront (JSON array) and experience_checkout (items_json)
 */
function extractProductHandles(metadata: Stripe.Metadata | null): string[] {
  if (!metadata) return []
  try {
    if (metadata.items_json) {
      const items = JSON.parse(metadata.items_json)
      return (items || [])
        .map((v: any) => v.handle || v.productHandle)
        .filter((h: string) => h && h.length > 0)
    }
    if (metadata.shopify_variant_ids) {
      // Compact format: "variantId:qty,variantId:qty" — not JSON
      // Product handles are not available in compact format; return empty to avoid crash
      return []
    }
  } catch {
    // items_json may be truncated — ignore parse errors
  }
  return []
}

/**
 * Look up series progress for purchased products
 */
async function fetchSeriesProgressForProducts(
  productHandles: string[],
  customerEmail?: string
): Promise<SeriesProgressItem[]> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  
  // Find submissions matching these product handles
  const { data: submissions } = await supabase
    .from('vendor_product_submissions')
    .select('id, series_id, shopify_product_handle')
    .in('shopify_product_handle', productHandles)
    .not('series_id', 'is', null)

  if (!submissions || submissions.length === 0) return []

  // Get unique series IDs
  const seriesIds = [...new Set(submissions.map(s => s.series_id).filter(Boolean))] as string[]

  // Fetch series details in parallel
  const results = await Promise.all(
    seriesIds.map(async (seriesId) => {
      const [seriesResult, memberCount, ownedCount] = await Promise.all([
        supabase
          .from('artwork_series')
          .select('id, name, thumbnail_url')
          .eq('id', seriesId)
          .single(),
        supabase
          .from('artwork_series_members')
          .select('*', { count: 'exact', head: true })
          .eq('series_id', seriesId),
        customerEmail
          ? getOwnedCountInSeries(supabase, seriesId, customerEmail)
          : Promise.resolve(0),
      ])

      if (!seriesResult.data) return null

      return {
        seriesName: seriesResult.data.name,
        seriesId: seriesResult.data.id,
        totalArtworks: memberCount.count || 0,
        ownedCount: ownedCount,
        thumbnailUrl: seriesResult.data.thumbnail_url,
      }
    })
  )

  return results.filter((r): r is SeriesProgressItem => r !== null)
}

/**
 * Count how many artworks in a series a collector owns
 */
async function getOwnedCountInSeries(
  supabase: any,
  seriesId: string,
  email: string
): Promise<number> {
  const { data: members } = await supabase
    .from('artwork_series_members')
    .select('submission_id')
    .eq('series_id', seriesId)

  if (!members || members.length === 0) return 0

  const submissionIds = members.map((m: any) => m.submission_id).filter(Boolean)

  const { data: owned } = await supabase
    .from('line_items')
    .select('submission_id')
    .eq('owner_email', email)
    .in('submission_id', submissionIds)
    .eq('status', 'active')

  return new Set((owned || []).map((li: any) => li.submission_id)).size
}
