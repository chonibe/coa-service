/**
 * Resolves ChinaDivision + STONE3PL detail for a shop account order (session email must own the order).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createChinaDivisionClient, type ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'
import { createSTONE3PLClient } from '@/lib/stone3pl/client'

function normalizeOrderId(val: string | null | undefined): string {
  if (!val) return ''
  return String(val).replace(/^#/, '').trim().toLowerCase()
}

function addDaysIsoDate(isoDate: string, days: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

type WarehouseOrderRow = {
  id: string
  order_id: string
  shopify_order_id: string | null
  tracking_number: string | null
  raw_data: Record<string, unknown> | null
}

export type FormattedShopTracking = {
  tracking_number?: string
  track_list?: Array<[string, string]>
  track_status?: number
  track_status_name?: string
  error_code?: number
  error_msg?: string
  carrier?: string
  last_mile_tracking?: string
  timeline?: ReturnType<ReturnType<typeof createSTONE3PLClient>['getTrackingTimeline']>
  parsed_events?: ReturnType<ReturnType<typeof createSTONE3PLClient>['parseTrackingEvents']>
  status_info?: ReturnType<ReturnType<typeof createSTONE3PLClient>['getStatusInfo']>
  [key: string]: unknown
}

export type ShopAccountWarehouseDetailPayload = {
  success: true
  chinaDivisionOrder: ChinaDivisionOrderInfo | null
  tracking: FormattedShopTracking | null
  warehouseRow: WarehouseOrderRow | null
}

async function findWarehouseRows(
  serviceClient: SupabaseClient,
  order: {
    shopify_id: string | null
    order_name: string | null
    order_number: number | null
  },
): Promise<WarehouseOrderRow[]> {
  const rows: WarehouseOrderRow[] = []

  if (order.shopify_id) {
    const { data } = await serviceClient
      .from('warehouse_orders')
      .select('id, order_id, shopify_order_id, tracking_number, raw_data')
      .eq('shopify_order_id', String(order.shopify_id))
    if (data?.length) rows.push(...(data as WarehouseOrderRow[]))
  }

  if (rows.length === 0 && order.order_name) {
    const { data } = await serviceClient
      .from('warehouse_orders')
      .select('id, order_id, shopify_order_id, tracking_number, raw_data')
      .eq('order_id', order.order_name)
    if (data?.length) rows.push(...(data as WarehouseOrderRow[]))
  }

  if (rows.length === 0 && order.order_number != null) {
    const num = String(order.order_number)
    const variants = [num, `#${num}`]
    const { data } = await serviceClient
      .from('warehouse_orders')
      .select('id, order_id, shopify_order_id, tracking_number, raw_data')
      .in('order_id', variants)
    if (data?.length) rows.push(...(data as WarehouseOrderRow[]))
  }

  // Deduplicate by id
  const seen = new Set<string>()
  return rows.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}

async function fetchLiveChinaDivisionOrder(
  chinaClient: ReturnType<typeof createChinaDivisionClient>,
  warehouseRow: WarehouseOrderRow | null,
  order: {
    shopify_id: string | null
    order_name: string | null
    order_number: number | null
    processed_at: string | null
    created_at: string | null
  },
): Promise<ChinaDivisionOrderInfo | null> {
  const tryIds: string[] = []
  if (warehouseRow?.order_id) tryIds.push(warehouseRow.order_id)
  if (warehouseRow?.id) tryIds.push(warehouseRow.id)
  if (order.order_name) tryIds.push(order.order_name)
  if (order.order_number != null) {
    tryIds.push(String(order.order_number))
    tryIds.push(`#${order.order_number}`)
  }

  const uniqueTry = [...new Set(tryIds.filter(Boolean))]
  for (const oid of uniqueTry) {
    try {
      const info = await chinaClient.getOrderInfo(oid)
      if (info) return info
    } catch {
      // try next
    }
  }

  const anchor = order.processed_at || order.created_at
  if (!anchor) return null

  try {
    const start = addDaysIsoDate(anchor, -120)
    const end = addDaysIsoDate(anchor, 14)
    const all = await chinaClient.getOrdersInfo(start, end)
    const normName = normalizeOrderId(order.order_name)
    const normNum = normalizeOrderId(String(order.order_number ?? ''))
    const sid = order.shopify_id ? String(order.shopify_id) : ''

    const found = all.find((o) => {
      if (warehouseRow && (o.sys_order_id === warehouseRow.id || o.order_id === warehouseRow.order_id)) return true
      if (sid && String((o as { shopify_order_id?: string }).shopify_order_id || '') === sid) return true
      if (normName && normalizeOrderId(o.order_id) === normName) return true
      if (normNum && normalizeOrderId(o.order_id) === normNum) return true
      return false
    })
    return found || null
  } catch {
    return null
  }
}

function enrichOrderWithProductNames(
  order: ChinaDivisionOrderInfo | null,
  productNameMap: Map<string, string>,
): ChinaDivisionOrderInfo | null {
  if (!order?.info?.length) return order
  return {
    ...order,
    info: order.info.map((pkg) => ({
      ...pkg,
      product_name:
        productNameMap.get(pkg.sku || '') ||
        productNameMap.get(pkg.sku_code || '') ||
        pkg.product_name ||
        pkg.sku ||
        'Unknown Product',
    })),
  }
}

/**
 * Returns null if the order is not found or not owned by sessionEmail.
 */
export async function getShopAccountWarehouseDetail(
  serviceClient: SupabaseClient,
  sessionEmail: string,
  orderId: string,
): Promise<ShopAccountWarehouseDetailPayload | null> {
  const email = sessionEmail.trim().toLowerCase()

  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .select('id, shopify_id, order_number, order_name, customer_email, processed_at, created_at')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) return null

  const cust = order.customer_email?.trim().toLowerCase()
  if (!cust || cust !== email) return null

  const warehouseRows = await findWarehouseRows(serviceClient, {
    shopify_id: order.shopify_id,
    order_name: order.order_name,
    order_number: order.order_number,
  })
  const warehouseRow = warehouseRows[0] ?? null

  const chinaClient = createChinaDivisionClient()
  let chinaDivisionOrder = await fetchLiveChinaDivisionOrder(chinaClient, warehouseRow, {
    shopify_id: order.shopify_id,
    order_name: order.order_name,
    order_number: order.order_number,
    processed_at: order.processed_at,
    created_at: order.created_at,
  })

  const allSkus = new Set<string>()
  if (chinaDivisionOrder?.info) {
    for (const pkg of chinaDivisionOrder.info) {
      if (pkg.sku) allSkus.add(pkg.sku)
      if (pkg.sku_code) allSkus.add(pkg.sku_code)
    }
  }

  const productNameMap = new Map<string, string>()
  if (allSkus.size > 0) {
    const { data: products } = await serviceClient.from('products').select('sku, name').in('sku', Array.from(allSkus))
    for (const p of products || []) {
      if (p.sku && p.name) productNameMap.set(p.sku, p.name)
    }
  }

  chinaDivisionOrder = enrichOrderWithProductNames(chinaDivisionOrder, productNameMap)

  let tracking: FormattedShopTracking | null = null
  try {
    const stone = createSTONE3PLClient()
    const platformOrderId =
      chinaDivisionOrder?.sys_order_id ||
      chinaDivisionOrder?.order_id ||
      warehouseRow?.id ||
      warehouseRow?.order_id ||
      ''

    const trackingNumber =
      chinaDivisionOrder?.tracking_number ||
      warehouseRow?.tracking_number ||
      chinaDivisionOrder?.info?.find((p) => p.tracking_number)?.tracking_number ||
      undefined

    if (platformOrderId) {
      const raw = await stone.getTracking(platformOrderId, trackingNumber)
      const timeline = stone.getTrackingTimeline(raw)
      tracking = {
        ...raw,
        timeline,
        parsed_events: stone.parseTrackingEvents(raw.track_list),
        status_info: stone.getStatusInfo(raw.track_status),
      }
    }
  } catch {
    tracking = null
  }

  return {
    success: true,
    chinaDivisionOrder,
    tracking,
    warehouseRow,
  }
}
