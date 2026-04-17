import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { vendorApiError } from "@/lib/vendor-api/observability"

// Signed-URL endpoint for the artist's own tax documents. We keep the
// bucket private (it holds PII) and hand out 5-minute signed URLs on
// demand instead of exposing a public path.

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)
    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const { data: doc, error: docError } = await supabase
      .from("vendor_tax_documents")
      .select("id, storage_bucket, storage_path, file_name")
      .eq("id", params.id)
      .eq("vendor_id", vendor.id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(doc.storage_bucket || "vendor-tax-documents")
      .createSignedUrl(doc.storage_path, 60 * 5)

    if (signError || !signed) {
      return vendorApiError("tax-documents.sign", signError || new Error("no signed url"), {
        userMessage: "Could not open file. Please retry.",
        context: { vendor: vendorName, docId: params.id },
      })
    }

    return NextResponse.json({ url: signed.signedUrl, fileName: doc.file_name })
  } catch (error: any) {
    return vendorApiError("tax-documents.download", error, {
      context: { docId: params.id },
    })
  }
}
