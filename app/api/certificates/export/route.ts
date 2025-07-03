import { NextResponse, NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: "Certificates export endpoint temporarily disabled" 
  }, { status: 503 })
}
