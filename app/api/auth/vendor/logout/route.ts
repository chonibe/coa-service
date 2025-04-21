import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Create a response that clears the vendor_token cookie
    const response = NextResponse.json({ success: true })

    // Clear the cookie
    response.cookies.delete("vendor_token")

    return response
  } catch (error: any) {
    console.error("Error in vendor logout:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
