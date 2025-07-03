import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ 
    error: "Benefit types endpoint temporarily disabled" 
  }, { status: 503 })
}
