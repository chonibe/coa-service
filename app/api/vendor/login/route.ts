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

    console.log("Login attempt for vendor:", vendorName)

    if (!vendorName || !password) {
      console.log("Missing credentials")
      return NextResponse.json({ message: "Vendor name and password are required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("Searching for vendor:", vendorName)

    // Find vendor by name
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("id, vendor_name, password_hash")
      .eq("vendor_name", vendorName)
      .single()

    if (error) {
      console.log("Supabase error:", error.message)
      return NextResponse.json({ message: "Invalid vendor name or password" }, { status: 401 })
    }

    if (!vendor) {
      console.log("Vendor not found")
      return NextResponse.json({ message: "Invalid vendor name or password" }, { status: 401 })
    }

    console.log("Vendor found:", vendor.id)

    if (!vendor.password_hash) {
      console.log("Vendor has no password hash")
      return NextResponse.json({ message: "Account not properly set up" }, { status: 401 })
    }

    // Verify password
    console.log("Verifying password")
    const passwordMatch = await bcrypt.compare(password, vendor.password_hash)

    if (!passwordMatch) {
      console.log("Password does not match")
      return NextResponse.json({ message: "Invalid vendor name or password" }, { status: 401 })
    }

    console.log("Password verified, creating token")

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

    console.log("Login successful for vendor:", vendor.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}
