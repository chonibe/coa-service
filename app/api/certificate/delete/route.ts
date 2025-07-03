import { NextResponse, NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Certificate delete endpoint temporarily disabled" 
  }, { status: 503 })
}
