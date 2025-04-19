import Link from "next/link"
import { Instagram } from "lucide-react"

export function InstagramSidebarItem() {
  return (
    <li>
      <Link
        href="/admin/instagram-dashboard"
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md"
      >
        <Instagram size={18} />
        <span>Instagram URLs</span>
      </Link>
    </li>
  )
}
