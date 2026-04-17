import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { vendorApiError } from "@/lib/vendor-api/observability"

// Bulk artwork creation — Phase 2.8
//
// Accepts a small, intentionally-narrow payload per row so we can ship a
// CSV-style importer without forcing artists through the wizard. Every
// row lands as a **draft** submission so admin moderation never sees an
// unreviewed flood; the artist is expected to open each draft and add
// imagery + production files before submitting for approval.
//
// Limits:
// - Up to 25 rows per request. Anything larger should be paginated client-
//   side to keep Postgres inserts fast and the error model simple.
// - Title + price are required. Everything else is optional and will be
//   zero-filled where the schema expects a value.

const MAX_ROWS = 25

interface BulkRow {
  title: string
  description?: string
  edition_size?: number | string | null
  price: string
  sku?: string
  tags?: string[]
  product_type?: string
  series_id?: string | null
}

interface RowError {
  index: number
  title?: string
  error: string
}

function sanitizeHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 255)
}

function validateRow(row: any, index: number): string | null {
  if (!row || typeof row !== "object") return `Row ${index + 1}: invalid row`
  if (!row.title || typeof row.title !== "string" || !row.title.trim()) {
    return `Row ${index + 1}: title is required`
  }
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded linear pattern, no catastrophic backtracking
  if (!row.price || typeof row.price !== "string" || !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(row.price)) {
    return `Row ${index + 1}: price must be a positive number (e.g. "45.00")`
  }
  if (row.edition_size !== undefined && row.edition_size !== null && row.edition_size !== "") {
    const n = Number(row.edition_size)
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      return `Row ${index + 1}: edition_size must be a positive integer`
    }
  }
  return null
}

function buildProductData(row: BulkRow, vendorName: string) {
  const editionSize = row.edition_size && row.edition_size !== "" ? String(row.edition_size) : null
  const vendorPrefix = vendorName.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6) || "VENDOR"
  const productCode = row.title.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6) || "ART"
  const sku = row.sku?.trim() || `${vendorPrefix}-${productCode}`

  const metafields: { namespace: string; key: string; type: string; value: string }[] = []
  if (editionSize) {
    metafields.push({
      namespace: "custom",
      key: "edition_size",
      type: "number_integer",
      value: String(editionSize),
    })
  }

  return {
    title: row.title.trim(),
    description: row.description?.trim() || "",
    product_type: row.product_type?.trim() || "Art Prints",
    vendor: vendorName,
    handle: sanitizeHandle(row.title),
    tags: Array.isArray(row.tags) ? row.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    variants: [
      {
        price: row.price,
        sku,
        requires_shipping: true,
      },
    ],
    images: [],
    metafields,
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)
    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const rows = Array.isArray(body?.rows) ? (body.rows as BulkRow[]) : []

    if (rows.length === 0) {
      return NextResponse.json({ error: "At least one row is required" }, { status: 400 })
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (max ${MAX_ROWS} per request)` },
        { status: 400 },
      )
    }

    // Validate every row before any insert — we prefer all-or-nothing so
    // the artist never ends up with a half-imported batch they have to
    // reconcile manually.
    const validationErrors: RowError[] = []
    rows.forEach((row, i) => {
      const err = validateRow(row, i)
      if (err) validationErrors.push({ index: i, title: row?.title, error: err })
    })
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors: validationErrors },
        { status: 400 },
      )
    }

    const nowIso = new Date().toISOString()
    const inserts = rows.map((row) => {
      const productData = buildProductData(row, vendor.vendor_name)
      return {
        vendor_id: vendor.id,
        vendor_name: vendor.vendor_name,
        status: "draft",
        product_data: productData as any,
        series_id: row.series_id || null,
        submitted_at: null,
        created_at: nowIso,
        updated_at: nowIso,
      }
    })

    const { data: submissions, error: insertError } = await supabase
      .from("vendor_product_submissions")
      .insert(inserts)
      .select("id, status")

    if (insertError) {
      return vendorApiError("products.bulk.insert", insertError, {
        userMessage: "Failed to create drafts",
        context: { vendor: vendorName, rowCount: rows.length },
      })
    }

    return NextResponse.json({
      created: submissions?.length || 0,
      submissions: submissions || [],
    })
  } catch (error: any) {
    return vendorApiError("products.bulk", error, {
      context: { rowCount: Array.isArray((error as any)?.rows) ? (error as any).rows.length : undefined },
    })
  }
}
