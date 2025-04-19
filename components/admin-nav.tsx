import Link from "next/link"
import { Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminNavigation() {
  return (
    <nav className="flex space-x-4 mb-8">
      {/* Other navigation links */}
      <Link href="/admin/instagram-dashboard">
        <Button variant="outline" className="flex items-center gap-2">
          <Instagram className="h-4 w-4" />
          <span>Instagram Dashboard</span>
        </Button>
      </Link>
    </nav>
  )
}
