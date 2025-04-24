"use client"

import { Sidebar, SidebarItem } from "@/components/ui/sidebar-mantine"
import { IconHome, IconCertificate, IconList, IconSettings } from "@tabler/icons-react"
import { Box } from "@mantine/core"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Sidebar>
      <Box className="flex flex-col gap-2 p-4">
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
      </Box>
      {children}
    </Sidebar>
  )
} 