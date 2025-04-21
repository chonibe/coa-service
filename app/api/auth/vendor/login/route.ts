import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import * as jose from "jose"

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "secret" // Replace with a strong secret key

export async function POST(request: NextRequest) {
  try {
    const { vendorName, password } = await request.json()

    if (!vendorName || !password) {
      return NextResponse.json({ message: "Vendor name and password are required" }, { status: 400 })
    }

    // Retrieve vendor from database
    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("id, vendor_name, password_hash")
      .eq("vendor_name", vendorName)
      .limit(1)

    if (error) {
      console.error("Error retrieving vendor:", error)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const vendor = vendors?.[0]

    if (!vendor) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, vendor.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(JWT_SECRET_KEY)
    const alg = "HS256"

    const jwt = await new jose.SignJWT({ vendorId: vendor.id, vendorName: vendor.vendor_name })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret)

    // Update last login timestamp
    await supabase.from("vendors").update({ last_login: new Date().toISOString() }).eq("id", vendor.id)

    // Set JWT token as a cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("vendor_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("Error logging in vendor:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
