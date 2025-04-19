import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Fetch all vendors from the database
    const { data: vendors, error } = await supabase.from("instagram_vendors").select("*")

    if (error) {
      console.error("Error fetching vendors:", error)
      return NextResponse.json({ message: "Error fetching vendors" }, { status: 500 })
    }

    return NextResponse.json({ vendors })
  } catch (error: any) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json({ message: "Error fetching vendors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendorId, instagramUsername } = body

    if (!vendorId || !instagramUsername === undefined) {
      return NextResponse.json({ message: "Vendor ID and Instagram Username are required" }, { status: 400 })
    }

    // Update or insert the vendor in the database
    const { error } = await supabase
      .from("instagram_vendors")
      .upsert({ vendor_id: vendorId, instagram_username: instagramUsername }, { onConflict: "vendor_id" })

    if (error) {
      console.error("Error upserting vendor:", error)
      return NextResponse.json({ message: "Error upserting vendor" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error upserting vendor:", error)
    return NextResponse.json({ message: "Error upserting vendor" }, { status: 500 })
  }
}
