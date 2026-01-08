"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { Calendar, DollarSign, TrendingUp, ExternalLink, Sparkles } from "lucide-react"
import { format } from "date-fns"
import type { ArtistCollectionStats } from "@/types/collector"

interface ArtistsCollectionProps {
  artists: ArtistCollectionStats[]
}

export function ArtistsCollection({ artists }: ArtistsCollectionProps) {
  if (!artists.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No artists yet</CardTitle>
          <CardDescription>Buy an artwork to start your collection.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {artists.map((artist) => (
        <Card key={artist.vendorName} className="overflow-hidden">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">{artist.vendorName}</CardTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary">
                    {artist.totalArtworksOwned} {artist.totalArtworksOwned === 1 ? "artwork" : "artworks"}
                  </Badge>
                  <Badge variant="outline">
                    {artist.totalSeriesCollected} {artist.totalSeriesCollected === 1 ? "series" : "series"}
                  </Badge>
                  {artist.hiddenSeriesUnlocked > 0 && (
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {artist.hiddenSeriesUnlocked} hidden {artist.hiddenSeriesUnlocked === 1 ? "series" : "series"}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  (window.location.href = `/collector/journey/${encodeURIComponent(artist.vendorName)}`)
                }
              >
                View Journey
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Series Progress */}
            {artist.seriesDetails.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Series Progress</h4>
                {artist.seriesDetails.map((series) => (
                  <div key={series.seriesId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{series.seriesName}</span>
                      <span className="text-muted-foreground">
                        {series.ownedCount} / {series.totalPieces}
                      </span>
                    </div>
                    <Progress value={series.completionPercentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {artist.firstPurchaseDate && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    First Purchase
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(artist.firstPurchaseDate), "MMM yyyy")}
                  </p>
                </div>
              )}
              {artist.totalSpent > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Total Spent
                  </div>
                  <p className="text-sm font-medium">${artist.totalSpent.toFixed(2)}</p>
                </div>
              )}
              {artist.completionRate > 0 && (
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Completion Rate
                  </div>
                  <Progress value={artist.completionRate} className="h-2" />
                </div>
              )}
            </div>

            {/* Recent Purchases */}
            {artist.recentPurchases.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-semibold">Recent Purchases</h4>
                <div className="space-y-2">
                  {artist.recentPurchases.slice(0, 3).map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                    >
                      <span className="line-clamp-1 flex-1">{purchase.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {format(new Date(purchase.purchaseDate), "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


