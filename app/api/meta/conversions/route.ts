import { NextRequest, NextResponse } from "next/server"
import { sendMetaServerEvent } from "@/lib/meta-conversions-server"
import { getClientIpAddress, enhanceFbp, enhanceFbc } from "@/lib/meta-parameter-builder-server"

type MetaConversionRequest = {
  eventName?: string
  eventSourceUrl?: string
  fbp?: string
  fbc?: string
  customData?: Record<string, unknown>
  userData?: {
    em?: string
    ph?: string
    fn?: string
    ln?: string
    ct?: string
    st?: string
    zp?: string
    country?: string
    external_id?: string
  }
  eventId?: string
  eventTime?: number
  actionSource?: "website" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "email" | "other"
  testEventCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MetaConversionRequest

    if (!body?.eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 })
    }

    // Use Parameter Builder Library for IP extraction (preferring IPv6) and fbp/fbc enhancement
    const clientIp = getClientIpAddress(request)
    const userAgent = request.headers.get("user-agent") || undefined
    const sent = await sendMetaServerEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      eventTime: body.eventTime,
      eventSourceUrl: body.eventSourceUrl,
      actionSource: body.actionSource || "website",
      customData: body.customData || {},
      testEventCode: body.testEventCode,
      userData: {
        ...(body.userData || {}),
        fbp: enhanceFbp(body.fbp),
        fbc: enhanceFbc(body.fbc),
        client_ip_address: clientIp,
        client_user_agent: userAgent,
      },
    })

    if (!sent.success) {
      console.error("[meta/conversions] Failed to send event", sent.error)
      if (sent.skipped) {
        return NextResponse.json({
          success: false,
          skipped: true,
          error: "Meta Conversions API skipped",
          details: sent.error,
        })
      }
      return NextResponse.json(
        {
          success: false,
          error: "Meta Conversions API request failed",
          details: sent.error,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, result: sent.result })
  } catch (error) {
    console.error("[meta/conversions] Unexpected error", error)
    return NextResponse.json({ success: false, error: "Unexpected server error" }, { status: 500 })
  }
}
