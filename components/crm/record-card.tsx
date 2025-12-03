"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PlatformBadge } from "@/components/crm/platform-badge"
import { Mail, Phone, Building2 } from "lucide-react"

interface RecordCardProps {
  type: "person" | "company"
  id: string
  title: string
  subtitle?: string
  email?: string | null
  phone?: string | null
  company?: string | null
  tags?: string[] | null
  platforms?: Array<"email" | "instagram" | "facebook" | "whatsapp" | "shopify">
  metrics?: {
    orders?: number
    spent?: number
    people?: number
  }
  onClick?: () => void
}

export function RecordCard({
  type,
  id,
  title,
  subtitle,
  email,
  phone,
  company,
  tags,
  platforms,
  metrics,
  onClick,
}: RecordCardProps) {
  const initials = title
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${onClick ? "" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium truncate">{title}</h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="space-y-1 mb-3">
              {email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{phone}</span>
                </div>
              )}
              {company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{company}</span>
                </div>
              )}
            </div>

            {platforms && platforms.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {platforms.map((platform) => (
                  <PlatformBadge key={platform} platform={platform} variant="outline" className="text-xs" />
                ))}
              </div>
            )}

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {metrics && (
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                {metrics.orders !== undefined && (
                  <span>{metrics.orders} orders</span>
                )}
                {metrics.spent !== undefined && (
                  <span>${parseFloat(metrics.spent.toString()).toFixed(2)}</span>
                )}
                {metrics.people !== undefined && (
                  <span>{metrics.people} people</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

