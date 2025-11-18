import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { join } from "path"
import { tmpdir } from "os"
import { backupDatabase } from "@/backup/scripts/backup-database"
import { exportToSheets } from "@/backup/scripts/export-to-sheets"
import type { BackupConfig } from "@/backup/config/backup-config"
import { guardAdminRequest } from "@/lib/auth-guards"

interface BackupResult {
  size?: string
  path?: string
  url?: string
}

const buildBackupConfig = (settings: any): BackupConfig => ({
  storage: {
    local: {
      path: join(tmpdir(), "backup-storage"),
      retention: {
        days: settings.retention_days,
        maxBackups: settings.max_backups,
      },
    },
    googleDrive: {
      enabled: settings.google_drive_enabled,
      folderId: settings.google_drive_folder_id || undefined,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL || "",
      privateKey: process.env.GOOGLE_PRIVATE_KEY || "",
      retention: {
        days: settings.retention_days,
        maxBackups: settings.max_backups,
      },
    },
  },
  schedule: {
    databaseBackup: settings.schedule_database,
    sheetsExport: settings.schedule_sheets,
    cleanup: "0 2 * * *",
  },
  database: {
    url: process.env.DATABASE_URL || "",
    ssl: true,
  },
  logging: {
    level: "info",
    file: join(tmpdir(), "backup-logs", "backup.log"),
  },
})

const ensureAdmin = (request: NextRequest) => {
  const guard = guardAdminRequest(request)
  if (guard.kind === "ok") {
    return null
  }
  return guard.response
}

export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  const denial = ensureAdmin(request)
  if (denial) {
    return denial
  }

  const supabase = createClient()
  const { type } = params

  try {
    const { data: settings, error: settingsError } = await supabase.from("backup_settings").select("*").single()

    if (settingsError || !settings) {
      throw settingsError || new Error("Missing backup settings")
    }

    const backupConfig = buildBackupConfig(settings)

    let result: string | BackupResult
    if (type === "database") {
      result = await backupDatabase(backupConfig)
    } else if (type === "sheets") {
      const spreadsheetUrl = await exportToSheets(backupConfig)
      result = { url: spreadsheetUrl }
    } else {
      return NextResponse.json({ error: "Invalid backup type" }, { status: 400 })
    }

    const { error: backupError } = await supabase.from("backups").insert({
      type,
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
    console.error(`Error triggering ${type} backup:`, error)

    try {
      await supabase.from("backups").insert({
        type,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        created_at: new Date().toISOString(),
      })
    } catch (recordError) {
      console.error("Failed to record backup failure:", recordError)
    }

    return NextResponse.json({ error: `Failed to trigger ${type} backup` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { type: string } }) {
  const denial = ensureAdmin(request)
  if (denial) {
    return denial
  }

  const supabase = createClient()
  try {
    const { error } = await supabase.from("backups").delete().eq("id", params.type)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting backup:", error)
    return NextResponse.json({ error: "Failed to delete backup" }, { status: 500 })
  }
} 