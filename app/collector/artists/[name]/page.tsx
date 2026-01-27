"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"


import { Separator } from "@/components/ui"
import { Skeleton } from "@/components/ui"
import { ArtistApiResponse, ArtistArtwork, ArtistSeries } from "@/types/collector"
import { ArtworkCard } from "@/app/collector/discover/components/artwork-card"

import { Badge, Button, Card, CardContent } from "@/components/ui"
export default function ArtistProfilePage({ params }: { params: { name: string } }) {
  const { name } = params
  const [data, setData] = useState<ArtistApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/collector/artists/${name}`)
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.message || "Failed to load artist")
        }
        const payload: ArtistApiResponse = await res.json()
        setData(payload)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [name])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">Error: {error}</div>
  }

  if (!data?.artist) {
    notFound()
  }

  const { artist, artworks, series } = data
  const hiddenSeries = series.filter((s) => s.isPrivate)
  const publicSeries = series.filter((s) => !s.isPrivate)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        {artist.profileImageUrl ? (
          <Image
            src={artist.profileImageUrl}
            alt={artist.name}
            width={128}
            height={128}
            className="rounded-full object-cover aspect-square border-4 border-primary shadow-lg"
          />
        ) : (
          <Skeleton className="w-32 h-32 rounded-full" />
        )}
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-2">{artist.name}</h1>
          <p className="text-lg text-muted-foreground">{artist.bio || "No bio available."}</p>
          <div className="flex gap-4 mt-4">
            {artist.websiteUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              </Button>
            )}
            {artist.instagramHandle && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://instagram.com/${artist.instagramHandle}`} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {artworks.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Published Artworks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((art: ArtistArtwork) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        </div>
      )}

      {publicSeries.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Series Collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicSeries.map((s: ArtistSeries) => (
              <Card key={s.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href={`/collector/series/${s.id}`}>
                  <div className="relative w-full aspect-[4/5] bg-muted">
                    {s.thumbnailUrl && (
                      <Image src={s.thumbnailUrl} alt={s.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold line-clamp-2">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">{s.totalPieces} Pieces</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {hiddenSeries.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Hidden Gems</h2>
          <p className="text-muted-foreground mb-6">
            Exclusive or VIP series. Learn how to access these collections.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hiddenSeries.map((s: ArtistSeries) => (
              <Card key={s.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="relative w-full aspect-[4/5] bg-muted">
                  {s.teaserImageUrl && (
                    <Image src={s.teaserImageUrl} alt={s.name} fill className="object-cover blur-sm" sizes="(max-width: 768px) 100vw, 50vw" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Badge className="bg-yellow-500 text-white">Hidden Series</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold line-clamp-2">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">Exclusive content. Contact the artist to unlock.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!artworks.length && !series.length && <p className="text-center text-muted-foreground">No published artworks or series yet.</p>}
    </div>
  )
}


