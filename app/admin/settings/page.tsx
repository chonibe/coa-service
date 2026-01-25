"use client"

import { useState } from "react"





import { Separator } from "@/components/ui/separator"

import { Save } from "lucide-react"
import { SettingsLayout } from "@/components/settings-layout"
import { CircleStackIcon, UsersIcon, BellIcon, ShieldCheckIcon, ServerIcon } from "@heroicons/react/24/outline"

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
const settingsConfig = [
  {
    title: "General",
    items: [
      {
        title: "Database",
        href: "/admin/settings/database",
        icon: CircleStackIcon,
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
        icon: ServerIcon,
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
