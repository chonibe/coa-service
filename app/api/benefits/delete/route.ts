import { NextResponse, NextRequest } from "next/server"

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "Benefit deletion endpoint temporarily disabled" 
  }, { status: 503 })
}
