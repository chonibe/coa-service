import { NextResponse } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { createSTONE3PLClient } from '@/lib/stone3pl/client'
import {
  buildWarehouseDailySlackSummary,
  getWarehouseSlackOpenOrderLimit,
  getWarehouseSlackSummaryDays,
} from '@/lib/warehouse/daily-slack-summary'
import { postSlackWebhook } from '@/lib/notifications/slack-webhook'

function parseBoundedInt(param: string | null, min: number, max: number): number | undefined {
  if (param === null || param === '') return undefined
  const n = parseInt(param, 10)
  if (!Number.isFinite(n) || n < min || n > max) return undefined
  return n
}

/**
 * Daily cron: warehouse open orders + Approving shortage view + core SKU counts → Slack.
 * Vercel Cron sends Authorization: Bearer CRON_SECRET (see other cron routes).
 *
 * Query:
 * - `dryRun=1` — build summary and return JSON without posting to Slack.
 * - `days=1-365` — lookback for ChinaDivision `orders-info` (overrides env for this request).
 * - `openLimit=1-100` — max open orders to list + track (overrides env for this request).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dryRun = searchParams.get('dryRun') === '1' || searchParams.get('dryRun') === 'true'

  if (!process.env.CHINADIVISION_API_KEY) {
    return NextResponse.json({ error: 'CHINADIVISION_API_KEY is not set' }, { status: 500 })
  }

  if (!dryRun && !process.env.SLACK_WEBHOOK_URL) {
    return NextResponse.json({ error: 'SLACK_WEBHOOK_URL is not set (use dryRun=1 to skip Slack)' }, { status: 500 })
  }

  try {
    const cd = createChinaDivisionClient()
    const stone3pl = createSTONE3PLClient()
    const days = parseBoundedInt(searchParams.get('days'), 1, 365) ?? getWarehouseSlackSummaryDays()
    const openOrderCap =
      parseBoundedInt(searchParams.get('openLimit'), 1, 100) ?? getWarehouseSlackOpenOrderLimit()

    const { text, meta } = await buildWarehouseDailySlackSummary({
      cd,
      stone3pl,
      days,
      openOrderCap,
    })

    let slackPosted = false
    if (!dryRun) {
      await postSlackWebhook({ text })
      slackPosted = true
      console.log('[cron/warehouse-daily-slack] Slack webhook OK', { slackCharCount: meta.slackCharCount })
    }

    console.log('[cron/warehouse-daily-slack]', { dryRun, slackPosted, ...meta })

    const previewMax = 4000
    const preview = text.length > previewMax ? `${text.slice(0, previewMax)}…` : text

    return NextResponse.json({
      ok: true,
      dryRun,
      slackPosted,
      meta,
      preview,
      previewWasTruncated: text.length > previewMax,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[cron/warehouse-daily-slack]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
