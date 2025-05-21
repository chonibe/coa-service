import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  req: Request,
  { params }: { params: { type: string } }
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
      .eq("type", params.type)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching backup:", error)
      return NextResponse.json(
        { error: "Failed to fetch backup" },
        { status: 500 }
      )
    }

    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      )
    }

    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set("Content-Type", "application/json")
    headers.set("Content-Disposition", `attachment; filename="backup-${backup.type}.json.gz"`)

    return new NextResponse(backup.data, { headers })
  } catch (error) {
    console.error("Error downloading backup:", error)
    return NextResponse.json(
      { error: "Failed to download backup" },
      { status: 500 }
    )
  }
} 