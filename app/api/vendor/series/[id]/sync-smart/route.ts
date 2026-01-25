import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

interface SmartCondition {
  field: 'tag' | 'title' | 'type' | 'price' | 'created_at'
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'before' | 'after'
  value: string | number
}

function evaluateCondition(artwork: any, condition: SmartCondition): boolean {
  const { field, operator, value } = condition
  const productData = artwork.product_data as any

  switch (field) {
    case 'tag':
      const tags = productData?.tags || []
      switch (operator) {
        case 'equals':
          return tags.includes(value)
        case 'contains':
          return tags.some((tag: string) => tag.toLowerCase().includes((value as string).toLowerCase()))
        case 'starts_with':
          return tags.some((tag: string) => tag.toLowerCase().startsWith((value as string).toLowerCase()))
        default:
          return false
      }

    case 'title':
      const title = productData?.title || ''
      switch (operator) {
        case 'equals':
          return title.toLowerCase() === (value as string).toLowerCase()
        case 'contains':
          return title.toLowerCase().includes((value as string).toLowerCase())
        case 'starts_with':
          return title.toLowerCase().startsWith((value as string).toLowerCase())
        default:
          return false
      }

    case 'type':
      const type = productData?.product_type || ''
      return type.toLowerCase() === (value as string).toLowerCase()

    case 'price':
      const variants = productData?.variants || []
      if (variants.length === 0) return false
      const price = parseFloat(variants[0]?.price || '0')
      switch (operator) {
        case 'greater_than':
          return price > (value as number)
        case 'less_than':
          return price < (value as number)
        default:
          return false
      }

    case 'created_at':
      const createdAt = new Date(artwork.created_at)
      const compareDate = new Date(value as string)
      switch (operator) {
        case 'before':
          return createdAt < compareDate
        case 'after':
          return createdAt > compareDate
        default:
          return false
      }

    default:
      return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const seriesId = params.id

    // Get series and verify it belongs to vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("*")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Verify it's a smart collection
    if (series.collection_type !== 'smart') {
      return NextResponse.json(
        { error: "This endpoint is only for smart collections" },
        { status: 400 }
      )
    }

    const smartConditions = (series.smart_conditions as SmartCondition[]) || []
    if (smartConditions.length === 0) {
      return NextResponse.json(
        { error: "No smart conditions configured" },
        { status: 400 }
      )
    }

    // Fetch all vendor submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("vendor_id", vendor.id)
      .in("status", ["approved", "published"])

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return NextResponse.json({ error: "Failed to fetch artworks" }, { status: 500 })
    }

    // Evaluate conditions for each submission
    const matchingSubmissions = submissions.filter((submission) => {
      // For each condition, check if it matches
      const results = smartConditions.map((condition) =>
        evaluateCondition(submission, condition)
      )

      // Match all or any based on series config (default to 'all')
      const matchType = 'all' // Could be extended to support 'any'
      return matchType === 'all' ? results.every((r) => r) : results.some((r) => r)
    })

    // Get current members
    const { data: currentMembers } = await supabase
      .from("artwork_series_members")
      .select("submission_id")
      .eq("series_id", seriesId)

    const currentSubmissionIds = new Set(
      (currentMembers || []).map((m) => m.submission_id).filter(Boolean)
    )

    // Find new artworks to add
    const newSubmissionIds = matchingSubmissions
      .map((s) => s.id)
      .filter((id) => !currentSubmissionIds.has(id))

    // Find artworks to remove (no longer match conditions)
    const matchingSubmissionIds = new Set(matchingSubmissions.map((s) => s.id))
    const submissionIdsToRemove = Array.from(currentSubmissionIds).filter(
      (id) => !matchingSubmissionIds.has(id)
    )

    let addedCount = 0
    let removedCount = 0

    // Add new artworks
    if (newSubmissionIds.length > 0) {
      const { data: maxOrderData } = await supabase
        .from("artwork_series_members")
        .select("display_order")
        .eq("series_id", seriesId)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      const startingDisplayOrder = maxOrderData ? (maxOrderData.display_order || 0) + 1 : 0

      const membersToInsert = newSubmissionIds.map((submission_id, index) => ({
        series_id: seriesId,
        submission_id,
        shopify_product_id: null,
        is_locked: false,
        unlock_order: null,
        display_order: startingDisplayOrder + index,
      }))

      const { error: insertError } = await supabase
        .from("artwork_series_members")
        .insert(membersToInsert)

      if (insertError) {
        console.error("Error inserting members:", insertError)
      } else {
        addedCount = newSubmissionIds.length
      }
    }

    // Remove artworks that no longer match
    if (submissionIdsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("artwork_series_members")
        .delete()
        .eq("series_id", seriesId)
        .in("submission_id", submissionIdsToRemove)

      if (deleteError) {
        console.error("Error removing members:", deleteError)
      } else {
        removedCount = submissionIdsToRemove.length
      }
    }

    return NextResponse.json({
      message: "Smart collection synced successfully",
      added_count: addedCount,
      removed_count: removedCount,
      total_count: matchingSubmissions.length,
    })
  } catch (error: any) {
    console.error("Error syncing smart collection:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
