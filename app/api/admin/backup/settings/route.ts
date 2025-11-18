import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

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

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return unauthorized()
  }

  const supabase = createClient()
  
  try {
    console.log("API: Received POST request for backup settings")
    const body = await request.json()
    console.log("API: Request body:", body)
    
    console.log("API: Validating settings against schema...")
    const settings = backupSettingsSchema.parse(body)
    console.log("API: Validated settings:", settings)

    // First, check if settings exist
    const { data: existingSettings, error: checkError } = await supabase
      .from("backup_settings")
      .select("*")
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("API: Error checking existing settings:", checkError)
      throw checkError
    }

    // Convert empty string to null for google_drive_folder_id
    const settingsToSave = {
      ...settings,
      google_drive_folder_id: settings.google_drive_folder_id === "" ? null : settings.google_drive_folder_id,
    }

    console.log("API: Attempting to upsert settings to Supabase...")
    const { data, error } = await supabase
      .from("backup_settings")
      .upsert({
        id: 1,
        ...settingsToSave,
        updated_at: new Date().toISOString(),
        created_at: existingSettings?.created_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("API: Supabase error:", error)
      throw error
    }

    console.log("API: Successfully updated backup settings:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("API: Error updating backup settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update backup settings" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return unauthorized()
  }

  const supabase = createClient()
  
  try {
    console.log("API: Received GET request for backup settings")
    console.log("API: Fetching settings from Supabase...")
    const { data, error } = await supabase
      .from("backup_settings")
      .select("*")
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings exist, create default settings
        console.log("API: No settings found, creating default settings...")
        const { data: newSettings, error: insertError } = await supabase
          .from("backup_settings")
          .insert(defaultSettings)
          .select()
          .single()

        if (insertError) {
          console.error("API: Error creating default settings:", insertError)
          throw insertError
        }

        console.log("API: Successfully created default settings:", newSettings)
        return NextResponse.json(newSettings)
      }
      console.error("API: Supabase error:", error)
      throw error
    }

    console.log("API: Successfully fetched backup settings:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("API: Error fetching backup settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch backup settings" },
      { status: 500 }
    )
  }
} 