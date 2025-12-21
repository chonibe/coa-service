"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CollectorSeries, SeriesApiResponse } from "@/types/collector"

export default function SeriesDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [series, setSeries] = useState<CollectorSeries | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/collector/series/${id}`)
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.message || "Failed to load series")
        }
        const data: SeriesApiResponse = await res.json()
        setSeries(data.series)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="w-3/4 h-12" />
        <Skeleton className="w-full h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">Error: {error}</div>
  }

  if (!series) {
    notFound()
  }

  const totalArtworks = series.artworks.length
  const ownedArtworks = series.artworks.filter((a) => a.isOwned).length
  const progress = totalArtworks > 0 ? Math.round((ownedArtworks / totalArtworks) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative mb-8 h-64 md:h-96 w-full rounded-xl overflow-hidden bg-muted shadow-lg">
        {series.thumbnailUrl ? (
          <Image src={series.thumbnailUrl} alt={series.name} fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500 text-2xl font-semibold">
            No Series Thumbnail
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
          <h1 className="text-4xl font-bold leading-tight drop-shadow-lg">{series.name} Series</h1>
          <Link href={`/collector/artists/${series.vendor.name}`} className="text-lg text-muted-foreground hover:underline drop-shadow-md">
            By {series.vendor.name}
          </Link>
          <div className="flex items-center gap-2 text-sm mt-2">
            <Badge variant="outline" className="border-2 bg-background/20 text-white backdrop-blur-sm">
              {series.unlockType.replace(/_/g, " ")}
            </Badge>
            <span className="drop-shadow-sm">{totalArtworks} Artworks</span>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-8">{series.description}</p>

      <Separator className="my-8" />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Series Progress</CardTitle>
          <CardDescription>
            You own {ownedArtworks} of {totalArtworks} pieces ({progress}%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-6">Artworks in this Series</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {series.artworks.length > 0 ? (
          series.artworks.map((artwork) => (
            <Card key={artwork.id} className="overflow-hidden shadow-lg">
              <Link href={`/collector/products/${artwork.id}`}>
                <div className="relative w-full aspect-[4/5] bg-muted">
                  {artwork.image ? (
                    <Image
                      src={artwork.image}
                      alt={artwork.title}
                      fill
                      className={`object-cover ${artwork.isLocked && !artwork.isOwned ? "blur-sm grayscale" : ""}`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">No image</div>
                  )}
                  {artwork.isOwned && (
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white shadow-md">Owned</Badge>
                  )}
                  {artwork.isLocked && !artwork.isOwned && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 text-center">
                      <p className="font-semibold text-lg">Locked</p>
                      <p className="text-sm text-gray-200">Unlock to reveal this artwork.</p>
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold line-clamp-2">{artwork.title}</h3>
                {artwork.displayOrder !== undefined && (
                  <p className="text-sm text-muted-foreground">Piece #{artwork.displayOrder + 1}</p>
                )}
                {artwork.isOwned ? (
                  <p className="text-sm text-green-600 font-medium mt-1">You own this piece!</p>
                ) : (
                  !artwork.isLocked && (
                    <Button variant="secondary" size="sm" className="mt-2" asChild>
                      <Link href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "thestreetlamp-9103.myshopify.com"}/products/${artwork.handle || artwork.shopifyProductId}`} target="_blank" rel="noopener noreferrer">
                        View on Shopify
                      </Link>
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No artworks found in this series.</p>
        )}
      </div>
    </div>
  )
}


