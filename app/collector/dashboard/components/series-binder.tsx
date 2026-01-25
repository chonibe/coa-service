"use client"

import Image from "next/image"


import { Progress } from "@/components/ui"


import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from "@/components/ui"
export interface SeriesSummary {
  id: string
  name: string
  vendorName: string
  thumbnailUrl?: string | null
  completionProgress?: { percentage_complete?: number }
  ownedCount: number
}

interface SeriesBinderProps {
  series: SeriesSummary[]
}

export function SeriesBinder({ series }: SeriesBinderProps) {
  if (!series.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your series binder</CardTitle>
          <CardDescription>Series you buy into will show up here.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {series.map((s) => (
        <Card key={s.id} className="overflow-hidden">
          {s.thumbnailUrl && (
            <div className="relative h-32 w-full">
              <Image
                src={s.thumbnailUrl}
                alt={s.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          )}
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">{s.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {s.vendorName}
              </Badge>
              <Badge variant="outline">{s.ownedCount} owned</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Completion progress</p>
              <Progress value={s.completionProgress?.percentage_complete || 0} className="h-2" />
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = `/vendor/${encodeURIComponent(s.vendorName)}/series/${s.id}`)}
            >
              View series
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

