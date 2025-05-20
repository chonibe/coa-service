"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { SettingsLayout } from "@/components/settings-layout"
import { Database, Users, Bell, Shield, HardDrive } from "lucide-react"

const settingsConfig = [
  {
    title: "General",
    items: [
      {
        title: "Database",
        href: "/admin/settings/database",
        icon: Database,
      },
      {
        title: "Users",
        href: "/admin/settings/users",
        icon: Users,
      },
      {
        title: "Notifications",
        href: "/admin/settings/notifications",
        icon: Bell,
      },
      {
        title: "Security",
        href: "/admin/settings/security",
        icon: Shield,
      },
      {
        title: "Backup",
        href: "/admin/settings/backup",
        icon: HardDrive,
      },
    ],
  },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoAssignEditions: true,
    editionFormat: "number",
    updateShopify: true,
    syncOnWebhook: true,
  })

  const handleSaveSettings = () => {
    // In a real app, this would save to your backend
    console.log("Saving settings:", settings)
    // Show a toast or notification
  }

  return <SettingsLayout config={settingsConfig} />
}
