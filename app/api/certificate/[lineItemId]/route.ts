import { NextResponse, NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { lineItemId: string } }) {
  return NextResponse.json({ 
    error: "Certificate endpoint temporarily disabled" 
  }, { status: 503 })
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  )
}
