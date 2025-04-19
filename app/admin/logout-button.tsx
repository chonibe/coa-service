"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })

      // Redirect to login page
      router.push("/admin/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <Button variant="outline" className="w-full justify-start text-sm font-medium" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      <span>Logout</span>
    </Button>
  )
}
