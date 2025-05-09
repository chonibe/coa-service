import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_PASSWORD } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    console.log("Admin login attempt - Accepting any password")

    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 })
    }

    // Accept any password
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in admin login:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
