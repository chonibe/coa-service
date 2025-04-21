import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { vendorName, password } = await request.json()

    if (!vendorName || !password) {
      return NextResponse.json({ message: "Vendor name and password are required" }, { status: 400 })
    }

    // Check if vendor already exists
    const { data: existingVendors, error: checkError } = await supabase
      .from("vendors")
      .select("id")
      .eq("vendor_name", vendorName)
      .limit(1)

    if (checkError) {
      console.error("Error checking if vendor exists:", checkError)
      return NextResponse.json({ message: "An error occurred" }, { status: 500 })
    }

    if (existingVendors && existingVendors.length > 0) {
      return NextResponse.json({ message: "Vendor name already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert new vendor
    const { error: insertError } = await supabase
      .from("vendors")
      .insert({
        vendor_name: vendorName,
        password_hash: passwordHash,
      })
      .select()

    if (insertError) {
      console.error("Error inserting vendor:", insertError)
      return NextResponse.json({ message: "An error occurred" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error signing up vendor:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
