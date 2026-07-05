import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { preparePrintFulfillmentForShopifyOrderId } from "@/lib/print-fulfillment/orchestrator"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

  try {
    const { orderId } = await params
    const body = await request.json().catch(() => ({}))
    const result = await preparePrintFulfillmentForShopifyOrderId(orderId, {
      dryRun: typeof body.dryRun === "boolean" ? body.dryRun : undefined,
      whatsappEnabled: typeof body.whatsappEnabled === "boolean" ? body.whatsappEnabled : undefined,
      whatsappDryRun: typeof body.whatsappDryRun === "boolean" ? body.whatsappDryRun : undefined,
      heidiWhatsAppTo: typeof body.heidiWhatsAppTo === "string" ? body.heidiWhatsAppTo : undefined,
      telegramEnabled: typeof body.telegramEnabled === "boolean" ? body.telegramEnabled : undefined,
      telegramDryRun: typeof body.telegramDryRun === "boolean" ? body.telegramDryRun : undefined,
      telegramChatId: typeof body.telegramChatId === "string" ? body.telegramChatId : undefined,
      chinaDivisionEnabled: typeof body.chinaDivisionEnabled === "boolean" ? body.chinaDivisionEnabled : undefined,
      chinaDivisionCustomerId: typeof body.chinaDivisionCustomerId === "string" ? body.chinaDivisionCustomerId : undefined,
      chinaDivisionWarehouseId: typeof body.chinaDivisionWarehouseId === "string" ? body.chinaDivisionWarehouseId : undefined,
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare print fulfillment"
    console.error("[print-fulfillment] manual run failed:", error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
