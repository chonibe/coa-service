"use client"

import Image from "next/image"
import { useState } from "react"
import Link from "next/link"



import { cn } from "@/lib/utils"
import { ShieldCheck, Clock, FileText, ExternalLink } from "lucide-react"
import { NFCAuthSheet } from "@/components/nfc/nfc-auth-sheet"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge, Button } from "@/components/ui"
export interface CollectorLineItem {
  id: number
  lineItemId: string
  orderId: string
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
  editionTotal?: number | null
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
  const [selectedItem, setSelectedItem] = useState<CollectorLineItem | null>(null)
  const [isNfcSheetOpen, setIsNfcSheetOpen] = useState(false)

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

  const handleAuthenticate = (item: CollectorLineItem) => {
    setSelectedItem(item)
    setIsNfcSheetOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => {
          const isAuthenticated = !!(item.nfcTagId && item.nfcClaimedAt)
          const needsAuth = item.nfcTagId && !item.nfcClaimedAt

          return (
            <Card key={item.id} className="h-full flex flex-col group hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Link href={`/collector/artwork/${item.lineItemId}`} className="flex-1">
                    <CardTitle className="text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </CardTitle>
                  </Link>
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
                <Link href={`/collector/artwork/${item.lineItemId}`} className="relative w-full h-48 block">
                  <Image
                    src={item.imgUrl}
                    alt={item.name}
                    fill
                    className="object-cover rounded-none rounded-b-lg group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </Link>
              )}

              <CardContent className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {item.certificateUrl && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700">
                      <FileText className="h-3 w-3 mr-1" />
                      Certificate
                    </Badge>
                  )}
                  {isAuthenticated && (
                    <Badge className="bg-green-600 hover:bg-green-700">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Authenticated
                    </Badge>
                  )}
                  {needsAuth && (
                    <Badge variant="destructive" className="bg-amber-500 text-black hover:bg-amber-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Authentication
                    </Badge>
                  )}
                </div>
                {item.editionNumber !== undefined && item.editionNumber !== null && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      #{item.editionNumber}{item.editionTotal ? `/${item.editionTotal}` : ''}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Limited Edition</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  asChild
                  variant="default"
                  className="w-full"
                >
                  <Link href={`/collector/artwork/${item.lineItemId}`}>
                    View Details
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                {item.certificateUrl && (
                  <Button variant="outline" onClick={() => window.open(item.certificateUrl!, "_blank")}>
                    Certificate
                  </Button>
                )}
                {needsAuth && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAuthenticate(item)
                    }}
                  >
                    Authenticate
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {selectedItem && (
        <NFCAuthSheet
          isOpen={isNfcSheetOpen}
          onClose={() => setIsNfcSheetOpen(false)}
          item={{
            line_item_id: selectedItem.lineItemId,
            order_id: selectedItem.orderId,
            name: selectedItem.name,
            edition_number: selectedItem.editionNumber,
            img_url: selectedItem.imgUrl
          }}
          onSuccess={() => {
            // Success logic
          }}
        />
      )}
    </>
  )
}

