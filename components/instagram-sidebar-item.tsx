import Link from "next/link"
import { Instagram } from "lucide-react"

export function InstagramSidebarItem({ className }: { className?: string }) {
  return (
    <Link
      href="/admin/instagram-dashboard"
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
    >
      <Instagram className="h-4 w-4" />
      <span>Instagram URLs</span>
    </Link>
  )
}
