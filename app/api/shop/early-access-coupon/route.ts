import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { setEarlyAccessCouponCookie } from '@/lib/early-access'
import { resolveRefToVendorId } from '@/lib/affiliate'
import { validateEarlyAccessToken } from '@/lib/early-access-token'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null

/**
 * GET /api/shop/early-access-coupon?artist=<slug>&token=<token>
 * 
 * Generates or retrieves a 10% off coupon for an artist's early access link.
 * Requires a valid HMAC-signed token to prevent unauthorized access.
 * Returns the promotion code and sets it in a cookie.
 */
export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const artistSlug = searchParams.get('artist')?.trim()
    const token = searchParams.get('token')?.trim()
    
    if (!artistSlug) {
      return NextResponse.json(
        { error: 'Artist slug is required' },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      )
    }

    // Validate token
    const tokenPayload = validateEarlyAccessToken(token)
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      )
    }

    // Verify token matches artist slug
    if (tokenPayload.artistSlug !== artistSlug) {
      return NextResponse.json(
        { error: 'Token does not match artist' },
        { status: 403 }
      )
    }

    const supabase = createClient()

    // Check if coupon already exists for this artist with matching token
    const { data: existingCoupon } = await supabase
      .from('early_access_coupons')
      .select('*')
      .eq('artist_slug', artistSlug)
      .eq('access_token', token)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle()

    if (existingCoupon) {
      // Verify coupon still exists in Stripe
      try {
        const stripeCoupon = await stripe.coupons.retrieve(existingCoupon.stripe_coupon_id)
        const stripePromo = await stripe.promotionCodes.retrieve(existingCoupon.stripe_promotion_code_id)
        
        if (stripeCoupon.valid && stripePromo.active) {
          // Set cookie
          setEarlyAccessCouponCookie(existingCoupon.promotion_code, artistSlug)
          
          return NextResponse.json({
            couponCode: existingCoupon.promotion_code,
            discountPercent: existingCoupon.discount_percent,
            expiresAt: existingCoupon.expires_at,
            artistSlug,
          })
        }
      } catch {
        // Coupon doesn't exist in Stripe, create new one
      }
    }

    // Create new coupon
    const discountPercent = 10
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Valid for 7 days

    // Generate promotion code: EARLY-<ARTIST-SLUG>-<RANDOM>
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const promoCode = `EARLY-${artistSlug.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-${randomSuffix}`.slice(0, 20)

    // Create Stripe coupon (10% off)
    const coupon = await stripe.coupons.create({
      percent_off: discountPercent,
      duration: 'once',
      max_redemptions: 1000, // Allow multiple uses
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      name: `Early Access - ${artistSlug}`,
      metadata: {
        artist_slug: artistSlug,
        type: 'early_access',
      },
    })

    // Create promotion code
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: promoCode,
      max_redemptions: 1000,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      metadata: {
        artist_slug: artistSlug,
        type: 'early_access',
      },
    })

    // Resolve vendor_id if possible
    const vendorId = await resolveRefToVendorId(artistSlug, supabase)

    // Store in database with access token
    const { data: newCoupon, error: dbError } = await supabase
      .from('early_access_coupons')
      .insert({
        artist_slug: artistSlug,
        vendor_id: vendorId,
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promotionCode.id,
        promotion_code: promoCode,
        discount_percent: discountPercent,
        expires_at: expiresAt.toISOString(),
        access_token: token,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[early-access-coupon] Database error:', dbError)
      // Continue anyway - coupon is created in Stripe
    }

    // Set cookie
    setEarlyAccessCouponCookie(promoCode, artistSlug)

    return NextResponse.json({
      couponCode: promoCode,
      discountPercent,
      expiresAt: expiresAt.toISOString(),
      artistSlug,
    })
  } catch (error) {
    console.error('[early-access-coupon] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create coupon'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
