"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface Drop {
  id: string
  title: string
  release_date: string
  image_url: string
}

interface UpcomingDropsProps {
  drops: Drop[]
}

export function UpcomingDrops({ drops }: UpcomingDropsProps) {
  if (!drops.length) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Upcoming Drops</h2>
        <Button variant="ghost" size="sm">Show all</Button>
      </div>
      <div className="space-y-3">
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent group cursor-pointer"
          >
            <img
              src={drop.image_url}
              alt={drop.title}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{drop.title}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(drop.release_date).toLocaleDateString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Notify me
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 