import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardAdminRequest } from '@/lib/auth-guards'

const IMPORTANT_WEBHOOK_TYPES = ['checkout.session.completed', 'charge.refunded']
const EMQ_FIELDS = ['em', 'ph', 'fn', 'ln', 'fbp', 'fbc', 'external_id', 'ip', 'ua'] as const
type EmqField = typeof EMQ_FIELDS[number]

interface FieldCompleteness {
  field: EmqField
  present: number
  total: number
  percentage: number
}

interface EventTypeMetrics {
  total: number
  processed: number
  failed: number
  fieldCompleteness: FieldCompleteness[]
}

export async function GET(request: Request) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== 'ok') return guard.response

  const supabase = createClient()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: data7d, error } = await supabase
    .from('webhook_events')
    .select('event_type, processed, error, created_at, payload')
    .in('event_type', IMPORTANT_WEBHOOK_TYPES)
    .gte('created_at', since7d)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: 'Failed to load diagnostics', details: error.message }, { status: 500 })
  }

  const data24h = (data7d || []).filter((row) => row.created_at >= since24h)

  // Calculate field completeness for Purchase events (checkout.session.completed)
  const purchaseEvents = (data7d || []).filter((row) => row.event_type === 'checkout.session.completed' && row.processed)
  const purchaseFieldCompleteness = calculateFieldCompleteness(purchaseEvents, 'Purchase')

  // Calculate field completeness for Refund events
  const refundEvents = (data7d || []).filter((row) => row.event_type === 'charge.refunded' && row.processed)
  const refundFieldCompleteness = calculateFieldCompleteness(refundEvents, 'Refund')

  // Aggregate counts for 7d and 24h periods
  const counts7d = calculateCounts(data7d || [])
  const counts24h = calculateCounts(data24h)

  return NextResponse.json({
    metaConfig: {
      hasDatasetKey: !!process.env.META_DATASET_API_KEY,
      hasDatasetId: !!(process.env.META_DATASET_ID || process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
      hasPixelId: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,
      hasTestCode: !!process.env.META_TEST_EVENT_CODE,
    },
    periods: {
      last7d: { start: since7d, webhookCounts: counts7d },
      last24h: { start: since24h, webhookCounts: counts24h },
    },
    fieldCompleteness: {
      Purchase: purchaseFieldCompleteness,
      Refund: refundFieldCompleteness,
    },
    recentEvents: (data7d || []).slice(0, 25),
  })
}

function calculateCounts(events: any[]): Record<string, { total: number; processed: number; failed: number }> {
  const counts = IMPORTANT_WEBHOOK_TYPES.reduce<Record<string, { total: number; processed: number; failed: number }>>(
    (acc, type) => {
      acc[type] = { total: 0, processed: 0, failed: 0 }
      return acc
    },
    {}
  )

  for (const row of events) {
    const type = row.event_type as string
    if (!counts[type]) continue
    counts[type].total += 1
    if (row.processed) counts[type].processed += 1
    if (row.error) counts[type].failed += 1
  }

  return counts
}

function calculateFieldCompleteness(events: any[], eventType: 'Purchase' | 'Refund'): FieldCompleteness[] {
  const total = events.length
  if (total === 0) {
    return EMQ_FIELDS.map((field) => ({ field, present: 0, total: 0, percentage: 0 }))
  }

  const fieldCounts = EMQ_FIELDS.reduce<Record<EmqField, number>>(
    (acc, field) => {
      acc[field] = 0
      return acc
    },
    {} as Record<EmqField, number>
  )

  for (const event of events) {
    const payload = event.payload || {}
    const metadata = payload.metadata || {}

    // Check field presence based on event type and available data
    if (eventType === 'Purchase') {
      // Purchase events: check session metadata and customer_details
      const customer = payload.customer_details || {}
      if (customer.email || metadata.collector_email || metadata.collector_identifier) fieldCounts.em += 1
      if (customer.phone) fieldCounts.ph += 1
      if (customer.name) {
        const nameParts = (customer.name || '').split(/\s+/)
        if (nameParts[0]) fieldCounts.fn += 1
        if (nameParts.slice(1).join(' ')) fieldCounts.ln += 1
      }
      if (metadata.meta_fbp) fieldCounts.fbp += 1
      if (metadata.meta_fbc) fieldCounts.fbc += 1
      if (customer.email || metadata.collector_email || metadata.collector_identifier) fieldCounts.external_id += 1
      // IP and UA are added server-side, assume present if event was processed
      if (event.processed) {
        fieldCounts.ip += 1
        fieldCounts.ua += 1
      }
    } else if (eventType === 'Refund') {
      // Refund events: check charge billing_details and metadata
      const billing = payload.billing_details || {}
      const metadata = payload.metadata || {}
      if (billing.email || metadata.collector_email || metadata.collector_identifier) fieldCounts.em += 1
      if (billing.phone) fieldCounts.ph += 1
      if (billing.name) {
        const nameParts = (billing.name || '').split(/\s+/)
        if (nameParts[0]) fieldCounts.fn += 1
        if (nameParts.slice(1).join(' ')) fieldCounts.ln += 1
      }
      if (metadata.meta_fbp) fieldCounts.fbp += 1
      if (metadata.meta_fbc) fieldCounts.fbc += 1
      if (billing.email || metadata.collector_email || metadata.collector_identifier) fieldCounts.external_id += 1
      // IP and UA are added server-side
      if (event.processed) {
        fieldCounts.ip += 1
        fieldCounts.ua += 1
      }
    }
  }

  return EMQ_FIELDS.map((field) => ({
    field,
    present: fieldCounts[field],
    total,
    percentage: total > 0 ? Math.round((fieldCounts[field] / total) * 100) : 0,
  }))
}
