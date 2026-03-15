import { NextResponse } from "next/server"

type ProxyPayload = {
  eventName?: string
  pageLocation?: string
  pageTitle?: string
  pagePath?: string
  value?: number
  currency?: string
  clientId?: string
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GA_COLLECT_URL = "https://www.google-analytics.com/g/collect"

const sanitize = (value: unknown, max = 300): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, max)
}

const sanitizeNumber = (value: unknown): string | undefined => {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined
  return String(value)
}

const buildClientId = (provided?: string): string => {
  const valid = sanitize(provided, 80)
  if (valid) return valid
  return `${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 1_000_000_000)}`
}

export async function POST(request: Request) {
  if (!GA_MEASUREMENT_ID) {
    return NextResponse.json({ ok: false, error: "GA measurement ID is not configured" }, { status: 500 })
  }

  let body: ProxyPayload
  try {
    body = (await request.json()) as ProxyPayload
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 })
  }

  const eventName = sanitize(body.eventName, 100) || "page_view"
  const pageLocation = sanitize(body.pageLocation, 1000)
  const pageTitle = sanitize(body.pageTitle, 300)
  const pagePath = sanitize(body.pagePath, 600)
  const currency = sanitize(body.currency, 10)
  const value = sanitizeNumber(body.value)
  const clientId = buildClientId(body.clientId)

  const params = new URLSearchParams({
    v: "2",
    tid: GA_MEASUREMENT_ID,
    cid: clientId,
    en: eventName,
  })

  if (pageLocation) params.set("dl", pageLocation)
  if (pageTitle) params.set("dt", pageTitle)
  if (pagePath) params.set("dp", pagePath)
  if (currency) params.set("cu", currency)
  if (value) params.set("ev", value)

  try {
    const response = await fetch(`${GA_COLLECT_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": request.headers.get("user-agent") || "coa-service-ga-proxy",
      },
    })

    if (!response.ok && response.status !== 204) {
      return NextResponse.json(
        { ok: false, error: `GA collect failed with status ${response.status}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("GA proxy request failed:", error)
    return NextResponse.json({ ok: false, error: "Failed to send GA event" }, { status: 502 })
  }
}
