import Link from "next/link"
import { Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

export function InstagramDashboardLink() {
  return (
    <Link href="/admin/instagram-dashboard">
      <Button variant="outline" className="flex items-center gap-2">
        <Instagram className="h-4 w-4" />
        <span>Instagram Dashboard</span>
      </Button>
    </Link>
  )
}
