import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const backupSettingsSchema = z.object({
  google_drive_enabled: z.boolean(),
  google_drive_folder_id: z.string().optional(),
  retention_days: z.number().min(1).max(365),
  max_backups: z.number().min(1).max(100),
  schedule_database: z.string(),
  schedule_sheets: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Received backup settings:", body)
    
    const settings = backupSettingsSchema.parse(body)
    console.log("Validated backup settings:", settings)

    // Update settings in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from("backup_settings")
      .upsert({
        id: 1, // Use a single row for settings
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    console.log("Successfully updated backup settings:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating backup settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update backup settings" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from("backup_settings")
      .select("*")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    console.log("Fetched backup settings:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching backup settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch backup settings" },
      { status: 500 }
    )
  }
} 