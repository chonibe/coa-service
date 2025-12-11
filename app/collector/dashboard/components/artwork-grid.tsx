"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CollectorLineItem {
  id: number
  lineItemId: string
  productId: string | null
  name: string
  description?: string | null
  price?: number
  quantity?: number
  imgUrl?: string | null
  vendorName?: string | null
  nfcTagId?: string | null
  nfcClaimedAt?: string | null
  certificateUrl?: string | null
  certificateToken?: string | null
  editionNumber?: number | null
  status?: string | null
  series?: {
    id: string
    name: string
    vendorName: string
    thumbnailUrl?: string | null
    completionProgress?: any
  } | null
  productUrl?: string | null
}

interface ArtworkGridProps {
  items: CollectorLineItem[]
}

export function ArtworkGrid({ items }: ArtworkGridProps) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No artworks yet</CardTitle>
          <CardDescription>When you purchase art, it will appear here.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => {
        const isAuthenticated = !!(item.nfcTagId && item.nfcClaimedAt)
        const needsAuth = item.nfcTagId && !item.nfcClaimedAt

        return (
          <Card key={item.id} className="h-full flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base leading-tight line-clamp-2">{item.name}</CardTitle>
                <Badge variant="outline" className="capitalize">
                  {item.vendorName || "Artist"}
                </Badge>
              </div>
              {item.series && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {item.series.name}
                  </Badge>
                  <span>Series</span>
                </div>
              )}
              {item.price !== undefined && (
                <CardDescription>
                  ${item.price?.toFixed(2)} · Qty {item.quantity ?? 1}
                </CardDescription>
              )}
            </CardHeader>

            {item.imgUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={item.imgUrl}
                  alt={item.name}
                  fill
                  className="object-cover rounded-none rounded-b-lg"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            )}

            <CardContent className="flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                {item.certificateUrl && <Badge className="bg-emerald-600">Certificate</Badge>}
                {isAuthenticated && <Badge className="bg-blue-600">Authenticated</Badge>}
                {needsAuth && (
                  <Badge variant="destructive" className="bg-amber-500 text-black hover:bg-amber-600">
                    Pending Authentication
                  </Badge>
                )}
              </div>
              {item.editionNumber !== undefined && item.editionNumber !== null && (
                <p className="text-sm text-muted-foreground">Edition #{item.editionNumber}</p>
              )}
            </CardContent>

            <CardFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {item.certificateUrl && (
                <Button variant="outline" onClick={() => window.open(item.certificateUrl!, "_blank")}>
                  View certificate
                </Button>
              )}
              <Button
                variant={needsAuth ? "default" : "outline"}
                className={cn("w-full", needsAuth ? "" : "sm:col-span-1")}
                onClick={() => (window.location.href = "/pages/authenticate")}
              >
                {needsAuth ? "Authenticate" : "Authenticate again"}
              </Button>
              {item.productUrl && (
                <Button variant="secondary" onClick={() => window.open(item.productUrl!, "_blank")}>
                  View on Shopify
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

