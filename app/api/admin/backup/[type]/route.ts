import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { backupDatabase } from "@/backup/scripts/backup-database"
import { exportToSheets } from "@/backup/scripts/export-to-sheets"

interface BackupResult {
  size?: string
  path?: string
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
    console.log(`API: Received POST request for ${params.type} backup`)
    
    // Get backup settings
    const { data: settings, error: settingsError } = await supabase
      .from("backup_settings")
      .select("*")
      .single()

    if (settingsError) {
      console.error("API: Error fetching backup settings:", settingsError)
      throw settingsError
    }

    console.log("API: Backup settings:", settings)

    let result: string | BackupResult
    if (params.type === "database") {
      console.log("API: Starting database backup...")
      result = await backupDatabase(settings)
      console.log("API: Database backup completed:", result)
    } else if (params.type === "sheets") {
      console.log("API: Starting sheets export...")
      result = await exportToSheets(settings)
      console.log("API: Sheets export completed:", result)
    } else {
      console.error("API: Invalid backup type:", params.type)
      return NextResponse.json(
        { error: "Invalid backup type" },
        { status: 400 }
      )
    }

    // Record the backup in the database
    console.log("API: Recording backup in database...")
    const { error: backupError } = await supabase.from("backups").insert({
      type: params.type,
      status: "success",
      url: typeof result === "string" ? result : undefined,
      size: typeof result === "string" ? undefined : result.size,
      created_at: new Date().toISOString(),
    })

    if (backupError) {
      console.error("API: Error recording backup:", backupError)
      throw backupError
    }

    console.log("API: Backup recorded successfully")
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error(`API: Error triggering ${params.type} backup:`, error)

    // Record the failed backup
    try {
      await supabase.from("backups").insert({
        type: params.type,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        created_at: new Date().toISOString(),
      })
    } catch (recordError) {
      console.error("API: Error recording failed backup:", recordError)
    }

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
    console.log(`API: Received DELETE request for backup ${params.type}`)
    
    const { error } = await supabase
      .from("backups")
      .delete()
      .eq("id", params.type)

    if (error) {
      console.error("API: Error deleting backup:", error)
      throw error
    }

    console.log("API: Backup deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API: Error deleting backup:", error)
    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    )
  }
} 