"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Artwork, MarketplaceApiResponse } from "@/types/collector"
import { ArtworkCard } from "./components/artwork-card"
import { FilterSidebar } from "./components/filter-sidebar"

function DiscoverContent() {
  const searchParams = useSearchParams()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ total: 0, limit: 24, offset: 0 })
  const [availableFilters, setAvailableFilters] = useState({
    artists: [] as string[],
    series: [] as string[],
    minPrice: 0,
    maxPrice: 1000,
  })

  useEffect(() => {
    const fetchArtworks = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const qs = searchParams.toString()
        const res = await fetch(`/api/collector/marketplace?${qs}`)
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.message || "Failed to load marketplace")
        }
        const data: MarketplaceApiResponse = await res.json()
        setArtworks(data.artworks)
        setPagination(data.pagination)
        setAvailableFilters(data.availableFilters)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchArtworks()
  }, [searchParams])

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-500">
        <p>Unable to load marketplace: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Discover Artworks</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <FilterSidebar
            availableArtists={availableFilters.artists}
            availableSeries={availableFilters.series}
            minGlobalPrice={availableFilters.minPrice}
            maxGlobalPrice={availableFilters.maxPrice}
          />
        </div>

        <div className="md:col-span-3">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Dropping Now</h2>
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground">Featured new artworks will appear here.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: pagination.limit }).map((_, i) => (
                  <Skeleton key={i} className="h-[350px] w-full" />
                ))
              : artworks.length > 0
                ? artworks.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} />)
                : (
                  <p className="col-span-full text-center text-muted-foreground">
                    No artworks found matching your criteria.
                  </p>
                )}
          </div>

          {pagination.total > pagination.limit && (
            <div className="mt-8 text-center">
              <Button variant="outline" disabled>
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CollectorDiscoverPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading…</div>}>
      <DiscoverContent />
    </Suspense>
  )
}

