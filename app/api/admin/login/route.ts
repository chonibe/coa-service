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

    // Validate password against environment variable
    if (password !== ADMIN_PASSWORD) {
      console.error("Invalid admin login attempt")
      return NextResponse.json({ message: "Invalid password" }, { status: 401 })
    }

    // Create response with success
    const response = NextResponse.json({ success: true })

    // Set secure cookie for admin session
    response.cookies.set("admin_session", "true", {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    return response
  } catch (error: any) {
    console.error("Error in admin login:", error)
    return NextResponse.json(
      { message: error.message || "An error occurred" },
      { status: 500 }
    )
  }
}
