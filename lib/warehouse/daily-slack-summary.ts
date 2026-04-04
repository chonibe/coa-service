import type { ChinaDivisionClient, ChinaDivisionOrderInfo, OrderTrackListItem } from '@/lib/chinadivision/client'
import type { STONE3PLClient } from '@/lib/stone3pl/client'
import type { STONE3PLTrackingInfo } from '@/lib/stone3pl/client'
import { TRACK_STATUS_STAGES } from '@/lib/notifications/tracking-link'

const WAREHOUSE_CANCELED = 23
const WAREHOUSE_APPROVING = 0
const DEFAULT_OPEN_ORDER_CAP = 50
const MAX_MESSAGE_CHARS = 3500
/** Shown at end of digest; inferred time from tracking “delivered” events when possible. */
const DELIVERED_SECTION_MAX = 5
/** Max delivered rows (newest by `date_added`) to call `order-track-list` for before sorting by delivery time. */
const DELIVERED_TRACK_CANDIDATE_CAP = 50

export function getWarehouseSlackOpenOrderLimit(): number {
  const raw = process.env.WAREHOUSE_SLACK_OPEN_ORDER_LIMIT
  if (raw === undefined || raw === '') return DEFAULT_OPEN_ORDER_CAP
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1 || n > 100) return DEFAULT_OPEN_ORDER_CAP
  return n
}

/** Match quantity parsing in `app/api/warehouse/inventory/route.ts`. */
export function parseInventoryItemQuantity(item: Record<string, unknown>): number {
  const raw =
    item.available_quantity ??
    item.stock_quantity ??
    item.product_quantity ??
    item.quantity ??
    item.inventory ??
    item.inventory_quantity ??
    item.stock ??
    item.qty ??
    '0'
  const n = parseInt(String(raw), 10)
  return Number.isFinite(n) ? n : 0
}

export function getWarehouseSlackSummaryDays(): number {
  const raw = process.env.WAREHOUSE_SLACK_SUMMARY_DAYS
  if (raw === undefined || raw === '') return 90
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1 || n > 365) return 90
  return n
}

export function getSummaryDateRangeUtc(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime())
  start.setUTCDate(start.getUTCDate() - days)
  const toYmd = (d: Date) => d.toISOString().slice(0, 10)
  return { start: toYmd(start), end: toYmd(end) }
}

function toFiniteNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** CD sometimes returns track_status as string; track_status_name may carry "Delivered". */
export function isLikelyDelivered(order: ChinaDivisionOrderInfo): boolean {
  const ts = toFiniteNumber(order.track_status)
  if (ts === TRACK_STATUS_STAGES.DELIVERED) return true
  const name = String(order.track_status_name || '').toLowerCase()
  if (/\bdelivered\b/.test(name)) return true
  return false
}

export function isOpenNotDelivered(order: ChinaDivisionOrderInfo): boolean {
  if (order.status === WAREHOUSE_CANCELED) return false
  if (isLikelyDelivered(order)) return false
  return true
}

function buildEmptyOpenExplanation(
  allOrders: ChinaDivisionOrderInfo[],
  days: number
): string[] {
  const out: string[] = []
  if (allOrders.length === 0) {
    out.push(
      '_No rows from ChinaDivision `orders-info` for this window — widen `WAREHOUSE_SLACK_SUMMARY_DAYS` (e.g. `90`) or verify `CHINADIVISION_API_KEY` / date range._'
    )
    return out
  }
  const canceled = allOrders.filter((o) => o.status === WAREHOUSE_CANCELED).length
  const delivered = allOrders.filter((o) => isLikelyDelivered(o)).length
  const hist = new Map<string, number>()
  for (const o of allOrders) {
    const k = String(o.status ?? 'unknown')
    hist.set(k, (hist.get(k) ?? 0) + 1)
  }
  const top = [...hist.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => `status ${k}: ${v}`)
    .join(', ')
  out.push(
    `_0 open rows after filters, but API returned *${allOrders.length}* order line(s) in the last ${days}d window._`
  )
  out.push(`• Canceled (WH 23): ${canceled} — Delivered (track 121 / name): ${delivered}`)
  if (top) out.push(`• WH status histogram: ${top}`)
  out.push(
    `• If real open orders are *older* than this window, set \`WAREHOUSE_SLACK_SUMMARY_DAYS=90\` (or higher, max 365) in Vercel.`
  )
  return out
}

export function dedupeOrdersByPlatformId(orders: ChinaDivisionOrderInfo[]): ChinaDivisionOrderInfo[] {
  const map = new Map<string, ChinaDivisionOrderInfo>()
  for (const o of orders) {
    const id = (o.order_id || '').trim()
    if (!id) continue
    const prev = map.get(id)
    if (!prev) {
      map.set(id, o)
      continue
    }
    const prevT = new Date(prev.date_added || 0).getTime()
    const nextT = new Date(o.date_added || 0).getTime()
    if (nextT >= prevT) map.set(id, o)
  }
  return [...map.values()]
}

function lineSkuKey(line: { sku?: string; sku_code?: string }): string {
  const s = (line.sku || line.sku_code || '').trim()
  return s.toLowerCase()
}

/** Aggregate required qty per SKU (lowercase key) for Approving orders. */
export function aggregateApprovingDemand(orders: ChinaDivisionOrderInfo[]): Map<string, number> {
  const demand = new Map<string, number>()
  for (const o of orders) {
    if (o.status !== WAREHOUSE_APPROVING) continue
    const lines = Array.isArray(o.info) ? o.info : []
    for (const line of lines) {
      const key = lineSkuKey(line)
      if (!key) continue
      const q = parseInt(String(line.quantity ?? '0'), 10) || 0
      demand.set(key, (demand.get(key) ?? 0) + q)
    }
  }
  return demand
}

/** Sum available quantity per SKU (lowercase key) from CD inventory payload. */
export function buildAvailabilityBySkuLower(inventoryRows: Record<string, unknown>[]): Map<string, number> {
  const avail = new Map<string, number>()
  for (const item of inventoryRows) {
    const sku = String(item.sku || item.sku_code || '').trim()
    if (!sku) continue
    const key = sku.toLowerCase()
    const q = parseInventoryItemQuantity(item)
    avail.set(key, (avail.get(key) ?? 0) + q)
  }
  return avail
}

export type ApprovingShortageLine =
  | { sku: string; required: number; available: number; shortage: number }
  | { sku: string; required: number; unknownAvailability: true }

export function computeApprovingShortages(
  demand: Map<string, number>,
  availability: Map<string, number>
): ApprovingShortageLine[] {
  const lines: ApprovingShortageLine[] = []
  const keys = [...demand.keys()].sort()
  for (const key of keys) {
    const required = demand.get(key) ?? 0
    if (required <= 0) continue
    if (!availability.has(key)) {
      lines.push({ sku: key, required, unknownAvailability: true })
      continue
    }
    const available = availability.get(key) ?? 0
    const shortage = Math.max(0, required - available)
    lines.push({ sku: key, required, available, shortage })
  }
  return lines
}

export function extractStreetLampCounts(inventoryRows: Record<string, unknown>[]): {
  streetlamp001: number
  streetlamp002: number
} {
  let streetlamp001 = 0
  let streetlamp002 = 0
  for (const item of inventoryRows) {
    const sku = String(item.sku || item.sku_code || '').trim()
    const lower = sku.toLowerCase()
    const q = parseInventoryItemQuantity(item)
    if (lower === 'streetlamp001') streetlamp001 += q
    else if (lower === 'streetlamp002') streetlamp002 += q
  }
  return { streetlamp001, streetlamp002 }
}

/** Ship-to recipient for Slack line; prefers `ship_name` when API sends it, else first + last. */
export function formatOrderRecipientName(order: ChinaDivisionOrderInfo): string {
  const extra = order as ChinaDivisionOrderInfo & { ship_name?: string }
  const ship = extra.ship_name?.trim()
  if (ship) return ship
  const fn = (order.first_name || '').trim()
  const ln = (order.last_name || '').trim()
  return `${fn} ${ln}`.trim() || '—'
}

function slackSafeOneLine(s: string, maxLen = 100): string {
  return s.replace(/\|/g, '·').replace(/\r?\n/g, ' ').trim().slice(0, maxLen)
}

/**
 * Single main + optional last-mile line: prefer `order-track-list` fields, else order-info (no duplicate when both match).
 */
export function formatTrackingNumbersForSlack(
  order: ChinaDivisionOrderInfo,
  trRow?: OrderTrackListItem
): string {
  const cdM = (order.tracking_number || '').trim()
  const cdL = (order.last_mile_tracking || '').trim()
  const stM = (trRow?.tracking_number || '').trim()
  const stL = (trRow?.last_mile_tracking || '').trim()

  const main = stM || cdM
  const lmRaw = (stL || cdL).trim()
  const lm = lmRaw && lmRaw !== main ? lmRaw : ''

  const bits: string[] = []
  if (main) bits.push(`main \`${slackSafeOneLine(main, 80)}\``)
  if (lm) bits.push(`LM \`${slackSafeOneLine(lm, 80)}\``)
  return bits.length ? bits.join(' · ') : '—'
}

function toStoneTrackingPayload(row: OrderTrackListItem): STONE3PLTrackingInfo {
  return {
    sys_order_id: row.sys_order_id,
    tracking_number: row.tracking_number || '',
    order_id: row.order_id,
    track_list: row.track_list,
    track_status: row.track_status,
    track_status_name: row.track_status_name,
    error_code: row.error_code,
    error_msg: row.error_msg,
  }
}

/**
 * Latest tracking scan: date/time, place line, parsed country, and order ship-to country when useful.
 * Uses the chronologically newest event (timeline is sorted newest-first).
 */
function formatLastTrackingSummary(
  stone3pl: STONE3PLClient,
  row: OrderTrackListItem,
  order: ChinaDivisionOrderInfo
): string {
  const timeline = stone3pl.getTrackingTimeline(toStoneTrackingPayload(row))
  const events = timeline.events
  const shipCountry = order.ship_country?.trim()

  if (!events.length) {
    if (row.track_status_name?.trim()) {
      const base = row.track_status_name.trim()
      return shipCountry ? `${base} · order ship-to: ${shipCountry}` : base
    }
    return shipCountry ? `No scan yet · order ship-to: ${shipCountry}` : 'No tracking events yet'
  }

  const e = events[0]
  const when = e.parsedTime?.full?.trim() || e.timestamp?.trim() || ''

  let where = ''
  if (e.location?.trim()) where = e.location.trim()
  else if (e.city || e.state) where = [e.city, e.state].filter(Boolean).join(', ').trim()
  else if (e.facility?.trim()) where = e.facility.trim()
  else where = e.description?.trim().slice(0, 140) || '—'

  const parts: string[] = []
  if (when) parts.push(when)
  if (where) parts.push(where)

  const geoCountry = e.country?.trim()
  if (geoCountry && !where.toLowerCase().includes(geoCountry.toLowerCase())) {
    parts.push(geoCountry)
  }

  if (shipCountry && !parts.some((p) => p.toLowerCase().includes(shipCountry.toLowerCase()))) {
    parts.push(`ship-to ${shipCountry}`)
  }

  return parts.join(' · ')
}

/** Register tracking row under multiple key variants (#1001 vs 1001). */
function setTrackRow(map: Map<string, OrderTrackListItem>, row: OrderTrackListItem) {
  const raw = (row.order_id || '').trim()
  if (!raw) return
  const noHash = raw.replace(/^#/, '')
  const variants = new Set([raw, noHash, `#${noHash}`])
  for (const v of variants) {
    if (v) map.set(v, row)
  }
}

function lookupTrackRow(map: Map<string, OrderTrackListItem>, orderId: string): OrderTrackListItem | undefined {
  const oid = orderId.trim()
  if (!oid) return undefined
  const noHash = oid.replace(/^#/, '')
  return map.get(oid) || map.get(`#${noHash}`) || map.get(noHash)
}

/**
 * Sort key + Slack label for “when delivered”: newest tracking event whose description mentions delivered,
 * else newest event if status is Delivered, else `date_added`.
 */
export function resolveDeliveredWhenForSlack(
  stone3pl: STONE3PLClient,
  trRow: OrderTrackListItem | undefined,
  order: ChinaDivisionOrderInfo
): { atMs: number; whenLabel: string } {
  const fallbackMs = new Date(order.date_added || 0).getTime()
  const listed = order.date_added?.trim()
  const fallbackLabel = listed ? `listed ${listed}` : '—'

  if (!trRow) {
    return {
      atMs: Number.isFinite(fallbackMs) ? fallbackMs : 0,
      whenLabel: fallbackLabel,
    }
  }

  try {
    const tl = stone3pl.getTrackingTimeline(toStoneTrackingPayload(trRow))
    let bestEvent: (typeof tl.events)[0] | null = null
    let bestT = -1
    for (const e of tl.events) {
      if (/\bdelivered\b/i.test(e.description)) {
        const t = new Date(e.timestamp).getTime()
        if (Number.isFinite(t) && t > bestT) {
          bestT = t
          bestEvent = e
        }
      }
    }
    if (bestEvent) {
      const label =
        bestEvent.parsedTime?.full?.trim() ||
        bestEvent.timestamp?.trim() ||
        fallbackLabel
      return { atMs: bestT, whenLabel: label }
    }
    if (tl.currentStatus.isDelivered && tl.events.length > 0) {
      const e = tl.events[0]
      const t = new Date(e.timestamp).getTime()
      const label = e.parsedTime?.full?.trim() || e.timestamp?.trim() || fallbackLabel
      return {
        atMs: Number.isFinite(t) ? t : fallbackMs,
        whenLabel: label,
      }
    }
  } catch {
    /* fall through */
  }

  return {
    atMs: Number.isFinite(fallbackMs) ? fallbackMs : 0,
    whenLabel: fallbackLabel,
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

export type WarehouseDailySummaryMeta = {
  days: number
  start: string
  end: string
  totalOrdersInWindow: number
  openNotDeliveredCount: number
  openOrderCap: number
  openRowsShown: number
  openRowsOmitted: number
  approvingOrderCount: number
  deliveredInWindowCount: number
  deliveredSectionShown: number
  slackCharCount: number
}

function sortOpenOrdersNewestFirst(orders: ChinaDivisionOrderInfo[]): ChinaDivisionOrderInfo[] {
  return [...orders].sort((a, b) => {
    const ta = new Date(a.date_added || 0).getTime()
    const tb = new Date(b.date_added || 0).getTime()
    return tb - ta
  })
}

/**
 * Fetches orders + inventory from ChinaDivision, resolves tracking in batches, returns Slack `text` body.
 */
export async function buildWarehouseDailySlackSummary(options: {
  cd: ChinaDivisionClient
  stone3pl: STONE3PLClient
  days?: number
  /** Override env `WAREHOUSE_SLACK_OPEN_ORDER_LIMIT` (1–100). */
  openOrderCap?: number
}): Promise<{ text: string; meta: WarehouseDailySummaryMeta }> {
  const days = options.days ?? getWarehouseSlackSummaryDays()
  const { start, end } = getSummaryDateRangeUtc(days)

  const allOrders = await options.cd.getOrdersInfo(start, end, true)
  const inventoryRows = (await options.cd.getAllSkuInventory()) as Record<string, unknown>[]

  const openList = dedupeOrdersByPlatformId(allOrders.filter(isOpenNotDelivered))
  const openOrderCap = options.openOrderCap ?? getWarehouseSlackOpenOrderLimit()
  const openSorted = sortOpenOrdersNewestFirst(openList)
  const openForSummary = openSorted.slice(0, openOrderCap)

  const approvingOrders = allOrders.filter((o) => o.status === WAREHOUSE_APPROVING)
  const approvingUnique = dedupeOrdersByPlatformId(approvingOrders)

  const deliveredAll = dedupeOrdersByPlatformId(
    allOrders.filter((o) => o.status !== WAREHOUSE_CANCELED && isLikelyDelivered(o))
  )
  const deliveredSortedByAdded = [...deliveredAll].sort((a, b) => {
    const ta = new Date(a.date_added || 0).getTime()
    const tb = new Date(b.date_added || 0).getTime()
    return tb - ta
  })
  const deliveredCandidates = deliveredSortedByAdded.slice(0, DELIVERED_TRACK_CANDIDATE_CAP)

  const openIds = openForSummary.map((o) => (o.order_id || '').trim()).filter(Boolean)
  const deliveredIds = deliveredCandidates.map((o) => (o.order_id || '').trim()).filter(Boolean)
  const orderIdsForTrack = [...new Set([...openIds, ...deliveredIds])]

  const trackByOrderId = new Map<string, OrderTrackListItem>()
  for (const batch of chunk(orderIdsForTrack, 40)) {
    const csv = batch.join(',')
    try {
      const rows = await options.cd.getOrderTrackList(csv)
      for (const row of rows) {
        setTrackRow(trackByOrderId, row)
      }
    } catch (e) {
      console.warn('[warehouse-daily-slack] order-track-list batch failed:', csv.slice(0, 80), e)
    }
  }

  const deliveredScored = deliveredCandidates.map((o) => {
    const oid = (o.order_id || '').trim()
    const trRow = lookupTrackRow(trackByOrderId, oid)
    const { atMs, whenLabel } = resolveDeliveredWhenForSlack(options.stone3pl, trRow, o)
    return { order: o, atMs, whenLabel }
  })
  deliveredScored.sort((a, b) => {
    if (b.atMs !== a.atMs) return b.atMs - a.atMs
    return (a.order.order_id || '').localeCompare(b.order.order_id || '')
  })
  const topDelivered = deliveredScored.slice(0, DELIVERED_SECTION_MAX)

  const demand = aggregateApprovingDemand(allOrders)
  const availability = buildAvailabilityBySkuLower(inventoryRows)
  const shortageLines = computeApprovingShortages(demand, availability)
  const lamps = extractStreetLampCounts(inventoryRows)

  const lines: string[] = []
  lines.push(`*Warehouse daily summary* (${start} – ${end} UTC, last ${days} days)`)
  lines.push('')
  lines.push(
    `*1) Open orders (not canceled, not delivered)* — ${openList.length} total; *showing ${openForSummary.length}* (newest first; cap ${openOrderCap}; \`order-track-list\` batch includes these ids + up to ${DELIVERED_TRACK_CANDIDATE_CAP} newest delivered-by-\`date_added\` for section 4)`
  )

  const toShow = openForSummary
  const omitted = Math.max(0, openList.length - openForSummary.length)

  if (toShow.length === 0) {
    lines.push(...buildEmptyOpenExplanation(allOrders, days))
  }

  for (const o of toShow) {
    const oid = (o.order_id || '').trim() || '(no id)'
    const recipientRaw = formatOrderRecipientName(o)
    const recipient = slackSafeOneLine(recipientRaw)
    const recipientPart = recipient === '—' ? '—' : `*${recipient}*`
    const wh = o.status_name ?? String(o.status ?? '?')
    const tr = o.track_status_name ?? String(o.track_status ?? '—')
    let lastLoc = '—'
    const trRow = lookupTrackRow(trackByOrderId, oid)
    if (trRow) {
      try {
        lastLoc = formatLastTrackingSummary(options.stone3pl, trRow, o)
      } catch {
        lastLoc = trRow.track_status_name || 'Tracking parse error'
      }
    } else if (!o.tracking_number && (o.track_status === undefined || o.track_status === 0)) {
      const sc = o.ship_country?.trim()
      lastLoc = sc ? `No tracking yet · order ship-to: ${sc}` : 'No tracking yet'
    } else if (o.ship_country?.trim()) {
      lastLoc = `No scan in batch · order ship-to: ${o.ship_country.trim()}`
    }
    const trackNums = formatTrackingNumbersForSlack(o, trRow)
    lines.push(
      `• \`${oid}\` · ${recipientPart} | WH: ${wh} | Track: ${tr} | ${trackNums} | Last: ${lastLoc}`
    )
  }
  if (omitted > 0) {
    lines.push(`_+ ${omitted} other open order(s) not listed (over cap)_`)
  }

  lines.push('')
  lines.push(`*2) Approving inventory gap* (computed: line qty vs \`sku-inventory-all\`)`)
  lines.push(`_Approving orders (unique platform id): ${approvingUnique.length}_`)

  if (demand.size === 0) {
    lines.push('No line-item demand parsed for Approving orders.')
  } else {
    const unknowns = shortageLines.filter((l) => 'unknownAvailability' in l && l.unknownAvailability)
    const shorts = shortageLines.filter(
      (l): l is { sku: string; required: number; available: number; shortage: number } =>
        'shortage' in l && l.shortage > 0
    )
    const ok = shortageLines.filter((l) => 'shortage' in l && l.shortage === 0)

    for (const l of unknowns) {
      lines.push(`• \`${l.sku}\`: required ${l.required}, _availability unknown in CD inventory_`)
    }
    for (const l of shorts) {
      lines.push(
        `• \`${l.sku}\`: required ${l.required}, available ${l.available}, *short ${l.shortage}*`
      )
    }
    if (shorts.length === 0 && unknowns.length === 0 && ok.length > 0) {
      lines.push(`All ${ok.length} SKU(s) with demand have reported stock ≥ required (global view).`)
    }
  }

  lines.push('')
  lines.push('*3) Core warehouse SKUs*')
  lines.push(`• StreetLamp001: *${lamps.streetlamp001}*`)
  lines.push(`• Streetlamp002: *${lamps.streetlamp002}*`)

  lines.push('')
  lines.push(
    `*4) Last ${DELIVERED_SECTION_MAX} delivered* (${deliveredAll.length} in window; “when” = latest scan mentioning *delivered* when present, else Delivered status newest event, else \`date_added\`)`
  )
  if (topDelivered.length === 0) {
    lines.push('_No delivered orders in this date range._')
  } else {
    for (const { order: o, whenLabel } of topDelivered) {
      const oid = (o.order_id || '').trim() || '(no id)'
      const recipientRaw = formatOrderRecipientName(o)
      const recipient = slackSafeOneLine(recipientRaw)
      const recipientPart = recipient === '—' ? '—' : `*${recipient}*`
      const when = slackSafeOneLine(whenLabel, 140)
      lines.push(`• \`${slackSafeOneLine(oid, 36)}\` · ${recipientPart} · _${when}_`)
    }
  }

  let text = lines.join('\n')
  if (text.length > MAX_MESSAGE_CHARS) {
    text = text.slice(0, MAX_MESSAGE_CHARS - 40) + '\n…_(truncated for Slack length)_'
  }

  const meta: WarehouseDailySummaryMeta = {
    days,
    start,
    end,
    totalOrdersInWindow: allOrders.length,
    openNotDeliveredCount: openList.length,
    openOrderCap,
    openRowsShown: toShow.length,
    openRowsOmitted: omitted,
    approvingOrderCount: approvingUnique.length,
    deliveredInWindowCount: deliveredAll.length,
    deliveredSectionShown: topDelivered.length,
    slackCharCount: text.length,
  }

  return { text, meta }
}
