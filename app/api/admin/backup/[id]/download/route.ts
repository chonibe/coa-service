import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the backup data
    const { data: backup, error } = await supabase
      .from("backups")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      throw error
    }

    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      )
    }

    // Return the backup data as a downloadable file
    const headers = new Headers()
    headers.set("Content-Type", "application/json")
    headers.set("Content-Disposition", `attachment; filename="backup-${backup.id}.json.gz"`)

    return new NextResponse(backup.url, {
      headers,
    })
  } catch (error) {
    console.error("Error downloading backup:", error)
    return NextResponse.json(
      { error: "Failed to download backup" },
      { status: 500 }
    )
  }
} 