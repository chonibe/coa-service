import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const backupSettingsSchema = z.object({
  googleDriveEnabled: z.boolean(),
  googleDriveFolderId: z.string().optional(),
  retentionDays: z.number().min(1).max(365),
  maxBackups: z.number().min(1).max(100),
  scheduleDatabase: z.string(),
  scheduleSheets: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const settings = backupSettingsSchema.parse(body)

    // Update settings in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase
      .from("backup_settings")
      .upsert({
        id: 1, // Use a single row for settings
        ...settings,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating backup settings:", error)
    return NextResponse.json(
      { error: "Failed to update backup settings" },
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
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching backup settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch backup settings" },
      { status: 500 }
    )
  }
} 