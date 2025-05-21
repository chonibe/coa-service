import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { backupDatabase } from "@/backup/scripts/backup-database"
import { exportToSheets } from "@/backup/scripts/export-to-sheets"

interface BackupResult {
  size?: string
  path?: string
  url?: string
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: Request,
  { params }: { params: { type: string } }
) {
  try {
    // Get backup settings
    const { data: settings, error: settingsError } = await supabase
      .from("backup_settings")
      .select("*")
      .single()

    if (settingsError) {
      throw settingsError
    }

    let result: string | BackupResult
    if (params.type === "database") {
      result = await backupDatabase(settings)
    } else if (params.type === "sheets") {
      const spreadsheetUrl = await exportToSheets(settings)
      result = { url: spreadsheetUrl }
    } else {
      return NextResponse.json(
        { error: "Invalid backup type" },
        { status: 400 }
      )
    }

    // Record the backup in the database
    const { error: backupError } = await supabase.from("backups").insert({
      type: params.type,
      status: "success",
      url: typeof result === "string" ? result : result.url,
      size: typeof result === "string" ? undefined : result.size,
      created_at: new Date().toISOString(),
    })

    if (backupError) {
      throw backupError
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error(`Error triggering ${params.type} backup:`, error)

    // Record the failed backup
    await supabase.from("backups").insert({
      type: params.type,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: `Failed to trigger ${params.type} backup` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { error } = await supabase
      .from("backups")
      .delete()
      .eq("id", params.type)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting backup:", error)
    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    )
  }
} 