import { Metadata } from "next"
import { BackupSettingsForm } from "./backup-settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentBackups } from "./recent-backups"

export const metadata: Metadata = {
  title: "Backup Settings",
  description: "Manage database backups and Google Sheets exports",
}

export default function BackupSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Backup Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure and manage your database backups and Google Sheets exports.
        </p>
      </div>
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="recent">Recent Backups</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>
                Configure your backup settings and schedules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
              <CardDescription>
                View and manage your recent backups and exports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentBackups />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 