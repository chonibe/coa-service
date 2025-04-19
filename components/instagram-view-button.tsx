"use client"

import { Button } from "@/components/ui/button"
import { Instagram } from "lucide-react"

interface InstagramViewButtonProps {
  username: string
  type?: "stories" | "profile"
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function InstagramViewButton({
  username,
  type = "stories",
  variant = "default",
  size = "default",
  className,
}: InstagramViewButtonProps) {
  const handleClick = () => {
    // Determine the correct URL based on type
    const url =
      type === "stories" ? `https://www.instagram.com/stories/${username}/` : `https://www.instagram.com/${username}/`

    // Open in a new tab
    window.open(url, "_blank")
  }

  return (
    <Button variant={variant} size={size} onClick={handleClick} className={className}>
      <Instagram className="mr-2 h-4 w-4" />
      {type === "stories" ? "View Stories" : "View Profile"} on Instagram
    </Button>
  )
}
