"use client"

import { Box, NavLink, Stack, Text } from "@mantine/core"
import { IconDashboard, IconShoppingCart, IconFileCertificate, IconCurrencyDollar, IconUsers, IconSettings, IconTestPipe } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Dashboard", icon: IconDashboard, href: "/admin" },
  { label: "Orders", icon: IconShoppingCart, href: "/admin/orders" },
  { label: "Certificates", icon: IconFileCertificate, href: "/admin/certificates" },
  { label: "Payouts", icon: IconCurrencyDollar, href: "/admin/payouts" },
  { label: "Vendors", icon: IconUsers, href: "/admin/vendors" },
  { label: "Settings", icon: IconSettings, href: "/admin/settings" },
  { label: "Test Connection", icon: IconTestPipe, href: "/admin/test-connection" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <Box className="flex min-h-screen">
      <Box className="w-64 border-r p-4">
        <Stack>
          <Text size="xl" fw={700} mb="md">Admin Panel</Text>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={pathname === item.href}
            />
          ))}
        </Stack>
      </Box>
      <Box className="flex-1 p-4">
        {children}
      </Box>
    </Box>
  )
} 