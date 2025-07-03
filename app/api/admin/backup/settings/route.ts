import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const backupSettingsSchema = z.object({
  google_drive_enabled: z.boolean(),
  google_drive_folder_id: z.string().nullable().optional(),
  retention_days: z.number().min(1).max(365),
  max_backups: z.number().min(1).max(100),
  schedule_database: z.string(),
  schedule_sheets: z.string(),
})

const defaultSettings = {
  id: 1,
  google_drive_enabled: true,
  google_drive_folder_id: null,
  retention_days: 30,
  max_backups: 10,
  schedule_database: "0 0 * * *",
  schedule_sheets: "0 1 * * *",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Temporarily disabled due to deployment issues
export async function GET() {
  return NextResponse.json({ message: "Backup settings endpoint temporarily disabled" })
}

export async function POST() {
  return NextResponse.json({ message: "Backup settings endpoint temporarily disabled" })
} 