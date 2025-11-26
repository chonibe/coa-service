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
import { DatabaseIcon, UsersIcon, BellIcon, ShieldCheckIcon, HardDriveIcon } from "@heroicons/react/24/outline"

const settingsConfig = [
  {
    title: "General",
    items: [
      {
        title: "Database",
        href: "/admin/settings/database",
        icon: DatabaseIcon,
      },
      {
        title: "Users",
        href: "/admin/settings/users",
        icon: UsersIcon,
      },
      {
        title: "Notifications",
        href: "/admin/settings/notifications",
        icon: BellIcon,
      },
      {
        title: "Security",
        href: "/admin/settings/security",
        icon: ShieldCheckIcon,
      },
      {
        title: "Backup",
        href: "/admin/settings/backup",
        icon: HardDriveIcon,
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
