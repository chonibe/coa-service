import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ 
    error: "Benefit tables initialization endpoint temporarily disabled" 
  }, { status: 503 })
}
