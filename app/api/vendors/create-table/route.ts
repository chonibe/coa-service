import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Fetch vendors from the existing vendors table
    const { data: vendors, error: vendorsError } = await supabase
      .from("vendors")
      .select("*")

    if (vendorsError) {
      console.error("Error fetching vendors:", vendorsError)
      return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
    }

    // Fetch products for each vendor
    const vendorsWithProducts = await Promise.all(
      vendors.map(async (vendor) => {
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("vendor", vendor.id)

        if (productsError) {
          console.error(`Error fetching products for vendor ${vendor.id}:`, productsError)
          return { ...vendor, products: [] }
        }

        return { ...vendor, products }
      })
    )

    return NextResponse.json({ vendors: vendorsWithProducts })
  } catch (error) {
    console.error("Error fetching vendors and products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
