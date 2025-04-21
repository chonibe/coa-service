import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { vendorName, password } = await request.json()

    if (!vendorName || !password) {
      return NextResponse.json({ message: "Vendor name and password are required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find vendor by name
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("id, vendor_name, password_hash")
      .eq("vendor_name", vendorName)
      .single()

    if (error || !vendor) {
      return NextResponse.json({ message: "Invalid vendor name or password" }, { status: 401 })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, vendor.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid vendor name or password" }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      {
        vendorId: vendor.id,
        vendorName: vendor.vendor_name,
        role: "vendor",
      },
      jwtSecret,
      { expiresIn: "7d" },
    )

    // Set cookie
    cookies().set({
      name: "vendor_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}
