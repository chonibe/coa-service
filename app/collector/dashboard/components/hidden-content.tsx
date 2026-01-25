"use client"




import Image from "next/image"
import { Lock, Sparkles, ExternalLink, Calendar, Gift } from "lucide-react"
import { format } from "date-fns"
import type { HiddenContent } from "@/types/collector"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from "@/components/ui"
interface HiddenContentProps {
  hiddenContent: HiddenContent
}

export function HiddenContentComponent({ hiddenContent }: HiddenContentProps) {
  const { hiddenSeries, bonusContent } = hiddenContent

  if (hiddenSeries.length === 0 && bonusContent.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hidden content yet</CardTitle>
          <CardDescription>
            Hidden series and bonus content unlocked through your purchases will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hidden Series */}
      {hiddenSeries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-2xl font-bold">Hidden Series</h2>
            <Badge variant="secondary">{hiddenSeries.length}</Badge>
          </div>
          <p className="text-muted-foreground">
            Exclusive series unlocked through your purchases. These are only available to collectors who own specific
            artworks.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {hiddenSeries.map((series) => (
              <Card key={series.id} className="overflow-hidden">
                <div className="relative w-full h-48">
                  {series.thumbnailUrl ? (
                    <Image
                      src={series.thumbnailUrl}
                      alt={series.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : series.teaserImageUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={series.teaserImageUrl}
                        alt={series.name}
                        fill
                        className="object-cover blur-sm"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Lock className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{series.name}</CardTitle>
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  </div>
                  {series.description && (
                    <CardDescription className="line-clamp-2">{series.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Unlocked: {format(new Date(series.unlockedAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="font-medium mb-1">Unlocked via:</div>
                    <div className="text-muted-foreground">{series.unlockedVia.artworkName}</div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => (window.location.href = `/collector/series/${series.id}`)}
                  >
                    View Series
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bonus Content */}
      {bonusContent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            <h2 className="text-2xl font-bold">Bonus Content</h2>
            <Badge variant="secondary">{bonusContent.length}</Badge>
          </div>
          <p className="text-muted-foreground">
            Exclusive bonus content, digital files, and special access unlocked through your purchases.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bonusContent.map((content) => (
              <Card key={content.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {content.benefitType}
                    </Badge>
                  </div>
                  {content.description && (
                    <CardDescription className="line-clamp-2">{content.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Unlocked: {format(new Date(content.unlockedAt), "MMM d, yyyy")}
                    </div>
                    {content.expiresAt && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Calendar className="h-4 w-4" />
                        Expires: {format(new Date(content.expiresAt), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="font-medium mb-1">Unlocked via:</div>
                    <div className="text-muted-foreground">{content.unlockedVia.artworkName}</div>
                    <div className="text-xs text-muted-foreground mt-1">by {content.unlockedVia.vendorName}</div>
                  </div>
                  {content.contentUrl && (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => window.open(content.contentUrl!, "_blank")}
                    >
                      Access Content
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {content.accessCode && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <div className="text-xs font-medium mb-1">Access Code:</div>
                      <code className="text-sm font-mono">{content.accessCode}</code>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



