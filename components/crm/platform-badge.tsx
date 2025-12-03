"use client"

import { Badge } from "@/components/ui/badge"
import { Mail, Instagram, Facebook, MessageCircle, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlatformBadgeProps {
  platform: "email" | "instagram" | "facebook" | "whatsapp" | "shopify"
  variant?: "default" | "secondary" | "outline"
  className?: string
}

const platformConfig = {
  email: {
    icon: Mail,
    label: "Email",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  instagram: {
    icon: Instagram,
    label: "Instagram",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  },
  facebook: {
    icon: Facebook,
    label: "Facebook",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  whatsapp: {
    icon: MessageCircle,
    label: "WhatsApp",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  shopify: {
    icon: ShoppingBag,
    label: "Shopify",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
}

export function PlatformBadge({ platform, variant = "outline", className }: PlatformBadgeProps) {
  const config = platformConfig[platform]
  if (!config) return null

  const Icon = config.icon

  return (
    <Badge
      variant={variant}
      className={cn("flex items-center gap-1", className)}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  )
}

