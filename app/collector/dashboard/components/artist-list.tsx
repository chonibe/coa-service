"use client"

import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui"





export interface ArtistSummary {
  vendorName: string
  ownedArtworks: number
  seriesCount: number
}

interface ArtistListProps {
  artists: ArtistSummary[]
}

export function ArtistList({ artists }: ArtistListProps) {
  if (!artists.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Artists you follow</CardTitle>
          <CardDescription>Buy an artwork to start your collection.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {artists.map((artist) => (
        <Card key={artist.vendorName} className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{artist.vendorName}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{artist.ownedArtworks} artworks</Badge>
              <Badge variant="outline">{artist.seriesCount} series</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              (window.location.href = `/collector/journey/${encodeURIComponent(artist.vendorName)}`)
            }
          >
            View journey
          </Button>
        </Card>
      ))}
    </div>
  )
}

