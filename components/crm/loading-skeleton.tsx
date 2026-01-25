"use client"


import { Skeleton } from "@/components/ui/skeleton"

import { Card, CardContent, CardHeader } from "@/components/ui"
export function PersonListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 border rounded-lg animate-pulse"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PersonDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-6 w-48 rounded" />
      </div>
      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-l-2 pl-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

