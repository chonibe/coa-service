import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { vendorApiError, vendorApiLog } from "@/lib/vendor-api/observability"

// Vendor tax documents — Phase 4 MVP
//
// GET  : list the vendor's uploaded tax documents (W-9 / W-8BEN / other)
// POST : record metadata for a freshly-uploaded file. The actual bytes
//        are pushed to Supabase storage by the browser via a signed
//        upload URL (see /sign route). This keeps large PDFs off our
//        API server.
//
// We swallow "table does not exist" gracefully so the UI doesn't break
// before the migration has been applied in prod.

export async function GET(_request: NextRequest) {
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

    const { data: docs, error: docsError } = await supabase
      .from("vendor_tax_documents")
      .select(
        "id, doc_type, tax_year, storage_bucket, storage_path, file_name, mime_type, status, admin_notes, uploaded_at, reviewed_at",
      )
      .eq("vendor_id", vendor.id)
      .order("uploaded_at", { ascending: false })

    if (docsError) {
      vendorApiLog("tax-documents.list.migration-pending", docsError.message, {
        vendor: vendorName,
      })
      return NextResponse.json({ documents: [], migrationPending: true })
    }

    return NextResponse.json({ documents: docs || [] })
  } catch (error: any) {
    return vendorApiError("tax-documents.list", error)
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

    // We accept multipart/form-data so the browser can push the PDF
    // through our cookie-authed API. Keeping it behind vendor session
    // means we never need public storage policies for these (PII-heavy)
    // files — the server uses the service role to write.
    const form = await request.formData()
    const file = form.get("file") as File | null
    const docType = String(form.get("doc_type") || "") as "w9" | "w8ben" | "other"
    const taxYearRaw = form.get("tax_year")
    const taxYear = taxYearRaw ? Number(taxYearRaw) : null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }
    if (!docType || !["w9", "w8ben", "other"].includes(docType)) {
      return NextResponse.json({ error: "doc_type must be w9, w8ben, or other" }, { status: 400 })
    }
    // Safety cap at 10MB — IRS forms should never be bigger.
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (10MB max)" }, { status: 400 })
    }

    const vendorSlug = vendor.vendor_name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const yearSegment = taxYear && Number.isFinite(taxYear) ? String(taxYear) : String(new Date().getFullYear())
    const safeName = (file.name || `${docType}.pdf`).replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${vendorSlug}/${yearSegment}/${Date.now()}_${safeName}`
    const bucket = "vendor-tax-documents"

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/pdf",
        upsert: false,
      })

    if (uploadError) {
      // If the bucket doesn't exist we fall back to a graceful error so
      // the admin can provision it. We don't auto-create buckets because
      // that interacts with RLS policies we'd rather set up deliberately.
      return vendorApiError("tax-documents.upload", uploadError, {
        userMessage: "Could not upload. Please contact support.",
        context: { vendor: vendorName, bucket, storagePath },
      })
    }

    const nowIso = new Date().toISOString()
    const { data: doc, error: insertError } = await supabase
      .from("vendor_tax_documents")
      .insert({
        vendor_id: vendor.id,
        doc_type: docType,
        tax_year: taxYear,
        storage_bucket: bucket,
        storage_path: storagePath,
        file_name: file.name || null,
        mime_type: file.type || null,
        status: "submitted",
        uploaded_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single()

    if (insertError) {
      // Best-effort cleanup — don't orphan storage if the row failed.
      await supabase.storage.from(bucket).remove([storagePath]).catch(() => null)
      return vendorApiError("tax-documents.insert", insertError, {
        userMessage: "Failed to record upload",
        context: { vendor: vendorName, storagePath },
      })
    }

    return NextResponse.json({ document: doc })
  } catch (error: any) {
    return vendorApiError("tax-documents.upload-handler", error)
  }
}
