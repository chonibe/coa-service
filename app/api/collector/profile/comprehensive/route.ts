import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/collector/profile/comprehensive
 * Get a holistic view of the collector's profile including all editions, orders, PII, and activity history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 1. Get authoritative comprehensive profile from view
    const { data: comprehensiveView, error: viewError } = await supabase
      .from('collector_profile_comprehensive')
      .select('*')
      .or(`user_id.eq.${user.id},user_email.eq.${user.email?.toLowerCase()}`)
      .maybeSingle()

    if (viewError) {
      console.error('Comprehensive view fetch error:', viewError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch comprehensive profile' },
        { status: 500 }
      )
    }

    const authoritativeEmail = comprehensiveView?.user_email || user.email?.toLowerCase()

    // 2. Get all editions owned by this user (linked by ID or authoritative email)
    const { data: editions, error: editionsError } = await supabase
      .from('order_line_items_v2')
      .select(`
        id,
        line_item_id,
        order_id,
        name,
        edition_number,
        edition_total,
        status,
        fulfillment_status,
        owner_name,
        owner_email,
        created_at,
        nfc_tag_id,
        nfc_claimed_at,
        certificate_url,
        certificate_generated_at,
        product_id,
        vendor_name,
        orders (
          order_number,
          processed_at,
          financial_status,
          fulfillment_status
        )
      `)
      .or(`owner_id.eq.${user.id},owner_email.eq.${authoritativeEmail}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (editionsError) {
      console.error('Editions fetch error:', editionsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch editions' },
        { status: 500 }
      )
    }

    // 3. Get all orders (both linked and unlinked to profile)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_name,
        processed_at,
        financial_status,
        fulfillment_status,
        total_price,
        currency_code,
        customer_email,
        customer_id,
        created_at,
        cancelled_at,
        archived,
        raw_shopify_order_data,
        order_line_items_v2 (
          id,
          name,
          edition_number,
          edition_total,
          status,
          owner_id,
          products (
            img_url,
            vendor_name
          )
        )
      `)
      .or(`customer_id.eq."${user.id}",customer_email.eq."${authoritativeEmail}"`)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // 4. Get warehouse data for this collector
    const { data: warehouseData, error: warehouseError } = await supabase
      .from('warehouse_orders')
      .select('*')
      .or(`ship_email.eq."${authoritativeEmail}",shopify_order_id.eq."${user.id}"`)
      .order('created_at', { ascending: false })

    if (warehouseError) {
      console.error('Warehouse data fetch error:', warehouseError)
      // Don't fail the whole request for warehouse data
    }

    // 5. Get profile change history
    const { data: profileChanges, error: changesError } = await supabase
      .from('collector_profile_changes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (changesError) {
      console.error('Profile changes fetch error:', changesError)
      // Don't fail for this either
    }

    // 6. Get edition events for this user
    const { data: editionEvents, error: eventsError } = await supabase
      .from('edition_events')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50) // Limit for performance

    if (eventsError) {
      console.error('Edition events fetch error:', eventsError)
    }

    // 7. Calculate collector statistics (using view as primary source)
    const stats = {
      totalEditions: comprehensiveView?.total_editions ?? editions?.length ?? 0,
      authenticatedEditions: comprehensiveView?.authenticated_editions ?? editions?.filter(e => e.nfc_claimed_at).length ?? 0,
      totalOrders: comprehensiveView?.total_orders ?? orders?.length ?? 0,
      totalSpent: comprehensiveView?.total_spent ?? orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) ?? 0,
      firstPurchaseDate: comprehensiveView?.first_purchase_date ?? (orders?.length > 0 ? orders[orders.length - 1]?.created_at : null),
      lastPurchaseDate: comprehensiveView?.last_purchase_date ?? (orders?.length > 0 ? orders[0]?.created_at : null),
      profileChangesCount: comprehensiveView?.profile_changes_count ?? profileChanges?.length ?? 0,
      warehouseRecords: warehouseData?.length || 0
    }

    // 8. Group editions by artist/vendor
    const editionsByArtist = editions?.reduce((acc: any, edition) => {
      const artist = edition.vendor_name || 'Unknown Artist'
      if (!acc[artist]) {
        acc[artist] = []
      }
      acc[artist].push(edition)
      return acc
    }, {}) || {}

    // 9. Extract PII from view or fallback
    const piiSources = comprehensiveView?.pii_sources || {
      profile: null,
      shopify: orders?.find(o => o.customer_id)?.raw_shopify_order_data?.customer ? {
        source: 'shopify_customer',
        first_name: orders.find(o => o.customer_id)?.raw_shopify_order_data.customer.first_name,
        last_name: orders.find(o => o.customer_id)?.raw_shopify_order_data.customer.last_name,
        email: orders.find(o => o.customer_id)?.raw_shopify_order_data.customer.email,
        phone: orders.find(o => o.customer_id)?.raw_shopify_order_data.customer.phone,
        address: orders.find(o => o.customer_id)?.raw_shopify_order_data.customer.default_address
      } : null,
      warehouse: warehouseData?.[0] ? {
        source: 'warehouse_order',
        first_name: warehouseData[0].first_name,
        last_name: warehouseData[0].last_name,
        email: warehouseData[0].ship_email,
        phone: warehouseData[0].ship_phone,
        address: {
          address1: warehouseData[0].ship_address1,
          address2: warehouseData[0].ship_address2,
          city: warehouseData[0].ship_city,
          state: warehouseData[0].ship_state,
          zip: warehouseData[0].ship_zip,
          country: warehouseData[0].ship_country
        },
        tracking_number: warehouseData[0].tracking_number,
        status: warehouseData[0].status,
        status_name: warehouseData[0].status_name
      } : null
    }

    return NextResponse.json({
      success: true,
      profile: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        collectorProfile: comprehensiveView ? {
          first_name: comprehensiveView.first_name,
          last_name: comprehensiveView.last_name,
          email: comprehensiveView.profile_email || comprehensiveView.user_email,
          phone: comprehensiveView.profile_phone || comprehensiveView.display_phone,
          bio: comprehensiveView.bio,
          avatar_url: comprehensiveView.avatar_url,
          display_name: comprehensiveView.display_name,
        } : null,
        statistics: stats,
        piiSources,
        editions: {
          all: editions,
          byArtist: editionsByArtist,
          authenticated: editions?.filter(e => e.nfc_claimed_at) || [],
          pending: editions?.filter(e => !e.nfc_claimed_at) || []
        },
        orders,
        warehouseData: warehouseData || [],
        activityHistory: {
          profileChanges: profileChanges || [],
          editionEvents: editionEvents || []
        }
      }
    })
  } catch (error: any) {
    console.error('Comprehensive profile fetch error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
