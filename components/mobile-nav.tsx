"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Heart, User } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2 px-4 sm:px-6 md:hidden">
      <ul className="flex justify-around">
        <li>
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center ${
              pathname.includes("/admin")
                ? "text-primary"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
        </li>
        <li>
          <Link
            href="/explore"
            className={`flex flex-col items-center justify-center ${
              pathname === "/explore"
                ? "text-primary"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Compass className="h-5 w-5 mb-1" />
            <span className="text-xs">Explore</span>
          </Link>
        </li>
        <li>
          <Link
            href="/collection"
            className={`flex flex-col items-center justify-center ${
              pathname === "/collection"
                ? "text-primary"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Heart className="h-5 w-5 mb-1" />
            <span className="text-xs">Collection</span>
          </Link>
        </li>
        <li>
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center ${
              pathname === "/profile"
                ? "text-primary"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
