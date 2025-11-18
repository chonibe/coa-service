import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"

type VendorRow = Database["public"]["Tables"]["vendors"]["Row"]

interface VendorRecord {
  id: number
  vendor_name: string
  status: Database["public"]["Enums"]["vendor_status"] | null
  onboarding_completed: boolean | null
  last_login_at: string | null
  contact_email: string | null
  onboarded_at: string | null
  created_at: string | null
}

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const { searchParams } = request.nextUrl
  const search = searchParams.get("search")?.trim() || ""
  const statusFilter = searchParams.get("status")?.trim() || ""
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "100", 10), 250)

  const serviceClient = createServiceClient()

  try {
    let query = serviceClient
      .from("vendors")
      .select("id, vendor_name, status, onboarding_completed, last_login_at, contact_email, onboarded_at, created_at")
      .order("vendor_name", { ascending: true })
      .limit(limit)

    // Apply search filter
    if (search) {
      query = query.or(`vendor_name.ilike.%${search}%,contact_email.ilike.%${search}%`)
    }

    // Apply status filter
    if (statusFilter) {
      query = query.eq("status", statusFilter)
    }

    const { data: vendors, error } = await query

    if (error) {
      console.error("Failed to load vendor explorer data", error)
      return NextResponse.json(
        { error: "Failed to load vendors", message: error.message },
        { status: 500 }
      )
    }

    const vendorRecords: VendorRecord[] = (vendors || []).map((vendor) => ({
      id: vendor.id,
      vendor_name: vendor.vendor_name,
      status: vendor.status,
      onboarding_completed: vendor.onboarding_completed ?? false,
      last_login_at: vendor.last_login_at,
      contact_email: vendor.contact_email,
      onboarded_at: vendor.onboarded_at,
      created_at: vendor.created_at,
    }))

    return NextResponse.json({ vendors: vendorRecords })
  } catch (error) {
    console.error("Error in /api/admin/vendors/list:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

