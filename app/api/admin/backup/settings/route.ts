import { NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase"

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

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error("Supabase client not initialized")
    }

    // Fetch backup settings
    const { data, error } = await supabaseAdmin
      .from("backup_settings")
      .select("*")
      .single()

    if (error) {
      console.error("Error fetching backup settings:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch backup settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data || null,
    })
  } catch (error: any) {
    console.error("Error in backup settings API:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "An error occurred" 
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error("Supabase client not initialized")
    }

    // Parse request body
    const body = await request.json()

    // Update backup settings
    const { data, error } = await supabaseAdmin
      .from("backup_settings")
      .upsert(body, { onConflict: "id" })
      .select()

    if (error) {
      console.error("Error updating backup settings:", error)
      return NextResponse.json(
        { success: false, message: "Failed to update backup settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data ? data[0] : null,
    })
  } catch (error: any) {
    console.error("Error in backup settings update API:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "An error occurred" 
      }, 
      { status: 500 }
    )
  }
} 