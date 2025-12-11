"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface PendingItem {
  id: number
  name: string
  vendorName?: string | null
  seriesName?: string | null
  nfcTagId?: string | null
  certificateUrl?: string | null
}

interface AuthenticationQueueProps {
  items: PendingItem[]
}

export function AuthenticationQueue({ items }: AuthenticationQueueProps) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication queue</CardTitle>
          <CardDescription>All your artworks are authenticated.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication queue</CardTitle>
        <CardDescription>Complete NFC authentication to finalize ownership.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <Badge variant="secondary" className="capitalize">
                  {item.vendorName || "Artist"}
                </Badge>
                {item.seriesName && <Badge variant="outline">{item.seriesName}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.nfcTagId ? "NFC tag detected" : "NFC tag missing"}
              </p>
            </div>
            <Button onClick={() => (window.location.href = "/pages/authenticate")}>Authenticate</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

