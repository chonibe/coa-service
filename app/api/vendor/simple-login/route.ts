import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { vendorName } = await request.json()

    console.log("Simple login attempt for vendor:", vendorName)

    if (!vendorName) {
      return NextResponse.json({ message: "Vendor name is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find vendor by name
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (error || !vendor) {
      console.log("Vendor not found:", error?.message)
      return NextResponse.json({ message: "Vendor not found" }, { status: 401 })
    }

    console.log("Vendor found, creating token")

    // Create JWT token (skipping password verification)
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

    console.log("Simple login successful for vendor:", vendor.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}
