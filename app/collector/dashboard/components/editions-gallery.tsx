"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { CheckCircle2, FileText, ExternalLink } from "lucide-react"
import type { CollectorEdition } from "@/types/collector"

interface EditionsGalleryProps {
  editions: CollectorEdition[]
}

type FilterBy = "all" | "limited" | "open"
type SortBy = "number" | "date" | "artist" | "series"

export function EditionsGallery({ editions }: EditionsGalleryProps) {
  const [filterBy, setFilterBy] = useState<FilterBy>("all")
  const [sortBy, setSortBy] = useState<SortBy>("number")
  const [selectedArtist, setSelectedArtist] = useState<string>("all")

  const artists = useMemo(() => {
    const artistSet = new Set(editions.map((e) => e.vendorName).filter(Boolean))
    return Array.from(artistSet).sort()
  }, [editions])

  const filteredAndSorted = useMemo(() => {
    let filtered = [...editions]

    // Filter by edition type
    if (filterBy === "limited") {
      filtered = filtered.filter((e) => e.editionType === "limited")
    } else if (filterBy === "open") {
      filtered = filtered.filter((e) => e.editionType === "open")
    }

    // Filter by artist
    if (selectedArtist !== "all") {
      filtered = filtered.filter((e) => e.vendorName === selectedArtist)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "number":
          if (a.editionNumber === null && b.editionNumber === null) return 0
          if (a.editionNumber === null) return 1
          if (b.editionNumber === null) return -1
          return a.editionNumber - b.editionNumber
        case "date":
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        case "artist":
          return (a.vendorName || "").localeCompare(b.vendorName || "")
        case "series":
          return (a.series?.name || "").localeCompare(b.series?.name || "")
        default:
          return 0
      }
    })

    return filtered
  }, [editions, filterBy, sortBy, selectedArtist])

  const getEditionBadge = (edition: CollectorEdition) => {
    if (edition.editionType === "limited" && edition.editionNumber && edition.editionTotal) {
      return (
        <Badge className="bg-purple-600 hover:bg-purple-700 font-mono">
          #{edition.editionNumber} of {edition.editionTotal}
        </Badge>
      )
    }
    if (edition.editionNumber) {
      return (
        <Badge variant="outline" className="font-mono">
          #{edition.editionNumber}
        </Badge>
      )
    }
    return null
  }

  const getVerificationBadge = (edition: CollectorEdition) => {
    if (edition.verificationSource === "supabase") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    }
    return null
  }

  if (!editions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No editions yet</CardTitle>
          <CardDescription>Editions from your purchases will appear here.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter:</label>
          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Editions</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
              <SelectItem value="open">Open</SelectItem>
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
              <SelectItem value="number">Edition Number</SelectItem>
              <SelectItem value="date">Purchase Date</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="series">Series</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAndSorted.map((edition) => (
          <Card key={edition.id} className="h-full flex flex-col">
            {edition.imgUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={edition.imgUrl}
                  alt={edition.name}
                  fill
                  className="object-cover rounded-t-lg"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            )}
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base leading-tight line-clamp-2 flex-1">{edition.name}</CardTitle>
                {getVerificationBadge(edition)}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {getEditionBadge(edition)}
                {edition.editionType === "limited" && (
                  <Badge variant="outline" className="text-xs">
                    Limited Edition
                  </Badge>
                )}
                {edition.editionType === "open" && (
                  <Badge variant="outline" className="text-xs">
                    Open Edition
                  </Badge>
                )}
              </div>
              {edition.series && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {edition.series.name}
                  </Badge>
                  <span>Series</span>
                </div>
              )}
              {edition.vendorName && (
                <CardDescription className="capitalize">{edition.vendorName}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="text-xs text-muted-foreground">
                Purchased: {new Date(edition.purchaseDate).toLocaleDateString()}
              </div>
              {edition.price && (
                <div className="text-sm font-medium">${edition.price.toFixed(2)}</div>
              )}
            </CardContent>
            <CardContent className="flex gap-2 pt-0">
              {edition.certificateUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(edition.certificateUrl!, "_blank")}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Certificate
                </Button>
              )}
              {edition.productId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(`/products/${edition.productId}`, "_blank")}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}



