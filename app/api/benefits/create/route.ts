import { NextResponse, NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Benefit creation endpoint temporarily disabled" 
  }, { status: 503 })
}
