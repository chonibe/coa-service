import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_PASSWORD } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 })
    }

    // Check if the password matches
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 })
    }

    // Password is correct
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in admin login:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
