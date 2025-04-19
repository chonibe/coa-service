import type { ReactNode } from "react"
import Link from "next/link"
import { Layers, Settings, BarChart3, RefreshCw, Clock, AlertTriangle, Zap, BadgeIcon } from "lucide-react"
import { LogoutButton } from "./logout-button"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="flex items-center font-semibold">
            <Layers className="mr-2 h-5 w-5" />
            <span>Admin Dashboard</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          <Link
            href="/admin"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Edition Sync</span>
          </Link>
          <Link
            href="/admin/dashboard"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
          <Link
            href="/admin/shopify-sync"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Clock className="mr-2 h-4 w-4" />
            <span>Shopify Sync</span>
          </Link>
          <Link
            href="/admin/missing-orders"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Missing Orders</span>
          </Link>
          <Link
            href="/admin/test-connections"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Zap className="mr-2 h-4 w-4" />
            <span>Test Connections</span>
          </Link>
          <Link
            href="/admin/certificates"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <BadgeIcon className="mr-2 h-4 w-4" />
            <span>Certificates</span>
          </Link>
        </nav>
        <div className="p-2 border-t">
          <LogoutButton />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:pl-64 w-full">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
