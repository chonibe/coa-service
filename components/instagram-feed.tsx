"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Instagram, Loader2, ExternalLink } from "lucide-react"
import Image from "next/image"

interface InstagramMedia {
  id: string
  media_type: string
  media_url: string
  thumbnail_url: string | null
  permalink: string
  caption: string | null
  timestamp: string
}

interface InstagramFeedProps {
  username: string
  limit?: number
  className?: string
}

export function InstagramFeed({ username, limit = 6, className = "" }: InstagramFeedProps) {
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return

    const fetchMedia = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/instagram/media?username=${username}&limit=${limit}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch Instagram media: ${response.statusText}`)
        }

        const data = await response.json()
        setMedia(data.media || [])
      } catch (err: any) {
        console.error("Error fetching Instagram media:", err)
        setError(err.message || "Failed to fetch Instagram media")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [username, limit])

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Instagram className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No Instagram posts found for @{username}</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {media.map((item) => (
        <Card key={item.id} className="overflow-hidden group">
          <CardContent className="p-0 relative">
            <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="block aspect-square relative">
              <Image
                src={item.media_url || "/placeholder.svg"}
                alt={item.caption || `Instagram post by ${username}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ExternalLink className="text-white h-6 w-6" />
              </div>
              {item.media_type === "VIDEO" && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  Video
                </div>
              )}
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
