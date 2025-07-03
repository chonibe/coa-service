import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  return NextResponse.json({ 
    success: false, 
    message: "Order details endpoint temporarily disabled" 
  }, { status: 503 })
} 