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

const defaultSettings = {
  id: 1,
  google_drive_enabled: true,
  google_drive_folder_id: "",
  retention_days: 30,
  max_backups: 10,
  schedule_database: "0 0 * * *",
  schedule_sheets: "0 1 * * *",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export async function POST(req: Request) {
  try {
    console.log("API: Received POST request for backup settings")
    const body = await req.json()
    console.log("API: Request body:", body)
    
    console.log("API: Validating settings against schema...")
    const settings = backupSettingsSchema.parse(body)
    console.log("API: Validated settings:", settings)

    // Update settings in Supabase
    console.log("API: Initializing Supabase client...")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // First, check if settings exist
    const { data: existingSettings, error: checkError } = await supabase
      .from("backup_settings")
      .select("*")
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("API: Error checking existing settings:", checkError)
      throw checkError
    }

    console.log("API: Attempting to upsert settings to Supabase...")
    const { data, error } = await supabase
      .from("backup_settings")
      .upsert({
        id: 1,
        ...settings,
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

export async function GET() {
  try {
    console.log("API: Received GET request for backup settings")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

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