"use client"

import { Sidebar, SidebarItem } from "@/components/ui/sidebar-mantine"
import { IconHome, IconCertificate, IconList, IconSettings } from "@tabler/icons-react"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Sidebar>
      <Stack p="md" gap="xs">
        <SidebarItem
          icon={<IconHome size={20} />}
          label="Dashboard"
          href="/admin"
        />
        <SidebarItem
          icon={<IconCertificate size={20} />}
          label="Certificates"
          href="/admin/certificates"
        />
        <SidebarItem
          icon={<IconList size={20} />}
          label="Access Logs"
          href="/admin/logs"
        />
        <SidebarItem
          icon={<IconSettings size={20} />}
          label="Settings"
          href="/admin/settings"
        />
      </Stack>
      {children}
    </Sidebar>
  )
} 