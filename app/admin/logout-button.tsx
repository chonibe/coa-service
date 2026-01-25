"use client"

import { useRouter } from "next/navigation"

import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui"
interface LogoutButtonProps {
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}

export default function LogoutButton({
  className,
  variant = "outline",
  size = "default",
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })

      router.push("/admin/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("w-full justify-start text-sm font-medium", className)}
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Logout</span>
    </Button>
  )
}
