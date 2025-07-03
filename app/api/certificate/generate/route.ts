import { NextResponse, NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Certificate generation endpoint temporarily disabled" 
  }, { status: 503 })
}
