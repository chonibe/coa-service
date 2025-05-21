import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { backupDatabase } from "@/backup/scripts/backup-database"
import { exportToSheets } from "@/backup/scripts/export-to-sheets"
import { defaultConfig } from "@/backup/config/backup-config"

interface BackupResult {
  url?: string
  error?: string
}

export async function POST(
  req: Request,
  { params }: { params: { type: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get backup settings
    const { data: settings, error: settingsError } = await supabase
      .from("backup_settings")
      .select("*")
      .single()

    if (settingsError) {
      console.error("Error fetching backup settings:", settingsError)
      return NextResponse.json(
        { error: "Failed to fetch backup settings" },
        { status: 500 }
      )
    }

    let result: BackupResult

    if (params.type === "database") {
      result = await backupDatabase(defaultConfig) as BackupResult
    } else if (params.type === "sheets") {
      result = await exportToSheets(defaultConfig) as BackupResult
    } else {
      return NextResponse.json(
        { error: "Invalid backup type" },
        { status: 400 }
      )
    }

    // Record the backup
    const { error: backupError } = await supabase.from("backups").insert({
      type: params.type,
      status: result.error ? "failed" : "success",
      url: result.url,
      error: result.error,
    })

    if (backupError) {
      console.error("Error recording backup:", backupError)
      return NextResponse.json(
        { error: "Failed to record backup" },
        { status: 500 }
      )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error("Error during backup:", error)
    return NextResponse.json(
      { error: "Failed to perform backup" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { type: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("backups")
      .delete()
      .eq("type", params.type)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting backups:", error)
    return NextResponse.json(
      { error: "Failed to delete backups" },
      { status: 500 }
    )
  }
} 