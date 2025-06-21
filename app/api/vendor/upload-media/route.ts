import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current vendor's ID
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor ID from vendors table
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("auth_id", session.user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll("media")

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const uploadPromises = files.map(async (file: any) => {
      const buffer = await file.arrayBuffer()
      const filename = `${vendor.id}/${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage
        .from("artwork-stories")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from("artwork-stories")
        .getPublicUrl(filename)

      return publicUrl
    })

    const urls = await Promise.all(uploadPromises)

    return NextResponse.json({ urls })
  } catch (error: any) {
    console.error("Error uploading media:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}