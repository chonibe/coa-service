import { NextResponse } from "next/server"

export async function POST(request: Request) {
  return NextResponse.json({ 
    success: false, 
    message: "Edition number assignment endpoint temporarily disabled" 
  }, { status: 503 })
} 