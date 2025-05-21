"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const backupFormSchema = z.object({
  googleDriveEnabled: z.boolean(),
  googleDriveFolderId: z.string().optional(),
  retentionDays: z.number().min(1).max(365),
  maxBackups: z.number().min(1).max(100),
  scheduleDatabase: z.string(),
  scheduleSheets: z.string(),
})

type BackupFormValues = z.infer<typeof backupFormSchema>

export function BackupSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const form = useForm<BackupFormValues>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: {
      googleDriveEnabled: true,
      googleDriveFolderId: "",
      retentionDays: 30,
      maxBackups: 10,
      scheduleDatabase: "0 0 * * *",
      scheduleSheets: "0 1 * * *",
    },
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/backup/settings")
        if (!response.ok) {
          throw new Error("Failed to fetch backup settings")
        }
        const data = await response.json()
        
        // Update form with fetched settings
        form.reset({
          googleDriveEnabled: data.google_drive_enabled ?? true,
          googleDriveFolderId: data.google_drive_folder_id ?? "",
          retentionDays: data.retention_days ?? 30,
          maxBackups: data.max_backups ?? 10,
          scheduleDatabase: data.schedule_database ?? "0 0 * * *",
          scheduleSheets: data.schedule_sheets ?? "0 1 * * *",
        })
      } catch (error) {
        console.error("Error fetching backup settings:", error)
        toast.error("Failed to load backup settings")
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchSettings()
  }, [form])

  async function onSubmit(data: BackupFormValues) {
    setIsLoading(true)
    try {
      console.log("Submitting backup settings:", data)
      const response = await fetch("/api/admin/backup/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_drive_enabled: data.googleDriveEnabled,
          google_drive_folder_id: data.googleDriveFolderId,
          retention_days: data.retentionDays,
          max_backups: data.maxBackups,
          schedule_database: data.scheduleDatabase,
          schedule_sheets: data.scheduleSheets,
        }),
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update backup settings")
      }

      // Refresh the form data after successful save
      const refreshResponse = await fetch("/api/admin/backup/settings")
      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh settings")
      }
      const refreshData = await refreshResponse.json()
      
      form.reset({
        googleDriveEnabled: refreshData.google_drive_enabled ?? true,
        googleDriveFolderId: refreshData.google_drive_folder_id ?? "",
        retentionDays: refreshData.retention_days ?? 30,
        maxBackups: refreshData.max_backups ?? 10,
        scheduleDatabase: refreshData.schedule_database ?? "0 0 * * *",
        scheduleSheets: refreshData.schedule_sheets ?? "0 1 * * *",
      })

      toast.success("Backup settings updated successfully")
    } catch (error) {
      console.error("Error updating backup settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update backup settings")
    } finally {
      setIsLoading(false)
    }
  }

  async function triggerBackup(type: "database" | "sheets") {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/backup/${type}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to trigger ${type} backup`)
      }

      toast.success(`${type === "database" ? "Database" : "Google Sheets"} backup triggered successfully`)
    } catch (error) {
      toast.error(`Failed to trigger ${type} backup`)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {isInitialLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="googleDriveEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Google Drive Integration</FormLabel>
                    <FormDescription>
                      Enable or disable Google Drive integration for backups
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("googleDriveEnabled") && (
              <FormField
                control={form.control}
                name="googleDriveFolderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Drive Folder ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Google Drive folder ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      The ID of the Google Drive folder where backups will be stored
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="retentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retention Period (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days to keep backups
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxBackups"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Backups</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of backups to keep
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="scheduleDatabase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database Backup Schedule</FormLabel>
                    <FormControl>
                      <Input placeholder="0 0 * * *" {...field} />
                    </FormControl>
                    <FormDescription>
                      Cron expression for database backup schedule
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduleSheets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sheets Export Schedule</FormLabel>
                    <FormControl>
                      <Input placeholder="0 1 * * *" {...field} />
                    </FormControl>
                    <FormDescription>
                      Cron expression for Google Sheets export schedule
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => triggerBackup("database")}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Backup Database
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => triggerBackup("sheets")}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Export to Sheets
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
} 