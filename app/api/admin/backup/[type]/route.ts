import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { backupDatabase } from "@/backup/scripts/backup-database"
import { exportToSheets } from "@/backup/scripts/export-to-sheets"
import { BackupConfig } from "@/backup/config/backup-config"
import { join } from "path"
import { tmpdir } from "os"
import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'

interface BackupResult {
  size?: string
  path?: string
  url?: string
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseKey('service')
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

    // Transform settings into BackupConfig format
    const backupConfig: BackupConfig = {
      storage: {
        local: {
          path: join(tmpdir(), 'backup-storage'),
          retention: {
            days: settings.retention_days,
            maxBackups: settings.max_backups
          }
        },
        googleDrive: {
          enabled: settings.google_drive_enabled,
          folderId: settings.google_drive_folder_id || undefined,
          clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
          privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
          retention: {
            days: settings.retention_days,
            maxBackups: settings.max_backups
          }
        }
      },
      schedule: {
        databaseBackup: settings.schedule_database,
        sheetsExport: settings.schedule_sheets,
        cleanup: '0 2 * * *' // Default cleanup schedule
      },
      database: {
        url: process.env.DATABASE_URL || '',
        ssl: true
      },
      logging: {
        level: 'info',
        file: join(tmpdir(), 'backup-logs', 'backup.log')
      }
    }

    let result: string | BackupResult
    if (params.type === "database") {
      result = await backupDatabase(backupConfig)
    } else if (params.type === "sheets") {
      const spreadsheetUrl = await exportToSheets(backupConfig)
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