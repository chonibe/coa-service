import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Clear the vendor session cookie
    const cookieStore = cookies()
    cookieStore.delete("vendor_session")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in vendor logout:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
