"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { ShieldCheck, Clock, FileText, ExternalLink, Scan } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CollectorLineItem } from "./artwork-grid"

interface PurchasesSectionProps {
  items: CollectorLineItem[]
  purchasesByArtist?: Record<string, CollectorLineItem[]>
  purchasesBySeries?: Record<string, { series: any; items: CollectorLineItem[] }>
}

type GroupBy = "artist" | "series" | "date" | "auth"
type SortBy = "date" | "name" | "artist" | "price"

export function PurchasesSection({ items, purchasesByArtist, purchasesBySeries }: PurchasesSectionProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("artist")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [selectedArtist, setSelectedArtist] = useState<string>("all")
  const [selectedSeries, setSelectedSeries] = useState<string>("all")

  const artists = useMemo(() => {
    const artistSet = new Set(items.map((item) => item.vendorName).filter(Boolean))
    return Array.from(artistSet).sort()
  }, [items])

  const series = useMemo(() => {
    const seriesSet = new Set(
      items
        .map((item) => item.series?.id)
        .filter(Boolean)
        .map((s) => s as string),
    )
    return Array.from(seriesSet)
  }, [items])

  const groupedItems = useMemo(() => {
    let filtered = [...items]

    // Filter by artist
    if (selectedArtist !== "all") {
      filtered = filtered.filter((item) => item.vendorName === selectedArtist)
    }

    // Filter by series
    if (selectedSeries !== "all") {
      filtered = filtered.filter((item) => item.series?.id === selectedSeries)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          const dateA = (a as any).purchaseDate || (a as any).created_at || 0
          const dateB = (b as any).purchaseDate || (b as any).created_at || 0
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "artist":
          return (a.vendorName || "").localeCompare(b.vendorName || "")
        case "price":
          return (b.price || 0) - (a.price || 0)
        default:
          return 0
      }
    })

    // Group
    switch (groupBy) {
      case "artist":
        return Object.entries(
          filtered.reduce((acc, item) => {
            const key = item.vendorName || "Unknown Artist"
            if (!acc[key]) acc[key] = []
            acc[key].push(item)
            return acc
          }, {} as Record<string, CollectorLineItem[]>),
        )
      case "series":
        return Object.entries(
          filtered.reduce((acc, item) => {
            const key = item.series?.name || "No Series"
            if (!acc[key]) acc[key] = []
            acc[key].push(item)
            return acc
          }, {} as Record<string, CollectorLineItem[]>),
        )
      case "date":
        return Object.entries(
          filtered.reduce((acc, item) => {
            const purchaseDate = (item as any).purchaseDate || (item as any).created_at
            const date = purchaseDate
              ? new Date(purchaseDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })
              : "Unknown Date"
            if (!acc[date]) acc[date] = []
            acc[date].push(item)
            return acc
          }, {} as Record<string, CollectorLineItem[]>),
        ).sort((a, b) => {
          try {
            return new Date(b[0]).getTime() - new Date(a[0]).getTime()
          } catch {
            return 0
          }
        })
      case "auth":
        return [
          [
            "Authenticated",
            filtered.filter((item) => item.nfcTagId && item.nfcClaimedAt),
          ],
          [
            "Pending Authentication",
            filtered.filter((item) => item.nfcTagId && !item.nfcClaimedAt),
          ],
          [
            "No NFC Tag",
            filtered.filter((item) => !item.nfcTagId),
          ],
        ]
      default:
        return [["All", filtered]]
    }
  }, [items, groupBy, sortBy, selectedArtist, selectedSeries])

  const getStatusBadge = (item: CollectorLineItem) => {
    if (item.nfcTagId && item.nfcClaimedAt) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Authenticated
        </Badge>
      )
    }
    if (item.nfcTagId && !item.nfcClaimedAt) {
      return (
        <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
    if (item.certificateUrl) {
      return (
        <Badge variant="secondary" className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-3 w-3 mr-1" />
          Certificate Available
        </Badge>
      )
    }
    return null
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No purchases yet</CardTitle>
          <CardDescription>When you purchase art, it will appear here.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Group by:</label>
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="series">Series</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="auth">Auth Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {groupBy !== "artist" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Artist:</label>
            <Select value={selectedArtist} onValueChange={setSelectedArtist}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Artists</SelectItem>
                {artists.map((artist) => (
                  <SelectItem key={artist} value={artist}>
                    {artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {groupBy !== "series" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Series:</label>
            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Series</SelectItem>
                {series.map((seriesId) => {
                  const seriesItem = items.find((item) => item.series?.id === seriesId)
                  return (
                    <SelectItem key={seriesId} value={seriesId}>
                      {seriesItem?.series?.name || "Unknown Series"}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {groupedItems.map(([groupName, groupItems]) => (
          <div key={groupName} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{groupName}</h3>
              <Badge variant="secondary">{groupItems.length} items</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupItems.map((item) => {
                const isAuthenticated = !!(item.nfcTagId && item.nfcClaimedAt)
                const needsAuth = item.nfcTagId && !item.nfcClaimedAt

                return (
                  <Card key={item.id} className="h-full flex flex-col">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base leading-tight line-clamp-2">{item.name}</CardTitle>
                        {getStatusBadge(item)}
                      </div>
                      {item.series && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="capitalize">
                            {item.series.name}
                          </Badge>
                          <span>Series</span>
                        </div>
                      )}
                      {item.editionNumber !== undefined && item.editionNumber !== null && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            #{item.editionNumber}
                            {item.editionTotal ? ` of ${item.editionTotal}` : ""}
                          </Badge>
                          {item.editionTotal && (
                            <span className="text-xs text-muted-foreground">Limited Edition</span>
                          )}
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
                          className="object-cover rounded-none"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}

                    <CardContent className="flex-1 space-y-3 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {item.vendorName && (
                          <Badge variant="outline" className="capitalize">
                            {item.vendorName}
                          </Badge>
                        )}
                      </div>
                    </CardContent>

                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0">
                      {item.certificateUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.certificateUrl!, "_blank")}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Certificate
                        </Button>
                      )}
                      <Button
                        variant={needsAuth ? "default" : "outline"}
                        size="sm"
                        className={cn("w-full", needsAuth ? "" : "sm:col-span-1")}
                        onClick={() => (window.location.href = "/pages/authenticate")}
                      >
                        {needsAuth ? (
                          <>
                            <Scan className="h-4 w-4 mr-2" />
                            Authenticate
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            {isAuthenticated ? "View Auth" : "Authenticate"}
                          </>
                        )}
                      </Button>
                      {item.productUrl && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(item.productUrl!, "_blank")}
                          className="sm:col-span-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Shopify
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {groupedItems.length > 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}

