import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
export async function GET(request: NextRequest) {
  try {
    // Get the vendor name from the cookie
    const cookieStore = await cookies()
    const vendorName = cookieStore.get("vendor_session")?.value
    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }
    // Create Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { "Content-Type": "application/json" },
        },
      }
    )
    // Fetch vendor data
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", vendorName)
      .single()
    if (error || !vendor) {
      console.error("Vendor not found:", vendorName)
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 })
    }
    return NextResponse.json({ vendor })
  } catch (error: any) {
    console.error("Error in vendor profile API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
