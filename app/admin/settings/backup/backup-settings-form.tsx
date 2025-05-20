import { useState } from "react"
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

  const form = useForm<BackupFormValues>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: {
      googleDriveEnabled: true,
      retentionDays: 30,
      maxBackups: 10,
      scheduleDatabase: "0 0 * * *",
      scheduleSheets: "0 1 * * *",
    },
  })

  async function onSubmit(data: BackupFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/backup/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update backup settings")
      }

      toast.success("Backup settings updated successfully")
    } catch (error) {
      toast.error("Failed to update backup settings")
      console.error(error)
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

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </form>
      </Form>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => triggerBackup("database")}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Trigger Database Backup
        </Button>
        <Button
          variant="outline"
          onClick={() => triggerBackup("sheets")}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Trigger Sheets Export
        </Button>
      </div>
    </div>
  )
} 