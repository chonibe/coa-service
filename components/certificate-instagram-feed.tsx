"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Instagram } from "lucide-react"

interface InstagramPost {
  id: string
  media_url: string
  permalink: string
  caption?: string
  timestamp: string
}

export default function CertificateInstagramFeed({ vendor }: { vendor: string }) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [instagramUrl, setInstagramUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchInstagramData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First, fetch the vendor's Instagram URL
        const urlResponse = await fetch(`/api/instagram/vendor-url?vendor=${encodeURIComponent(vendor)}`)

        if (!urlResponse.ok) {
          throw new Error("Failed to fetch Instagram URL")
        }

        const urlData = await urlResponse.json()
        setInstagramUrl(urlData.instagram_url)

        // If there's an Instagram URL, fetch posts
        if (urlData.instagram_url) {
          // For demonstration, we'll use placeholder posts
          // In a real implementation, you would fetch actual Instagram posts
          setPosts([
            {
              id: "1",
              media_url: `/placeholder.svg?height=400&width=400&query=Instagram post by ${vendor}`,
              permalink: urlData.instagram_url,
              caption: "Follow us on Instagram for more updates",
              timestamp: new Date().toISOString(),
            },
            {
              id: "2",
              media_url: `/placeholder.svg?height=400&width=400&query=Another Instagram post by ${vendor}`,
              permalink: urlData.instagram_url,
              caption: "Check out our latest products",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: "3",
              media_url: `/placeholder.svg?height=400&width=400&query=Third Instagram post by ${vendor}`,
              permalink: urlData.instagram_url,
              caption: "Behind the scenes",
              timestamp: new Date(Date.now() - 172800000).toISOString(),
            },
          ])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (vendor) {
      fetchInstagramData()
    }
  }, [vendor])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error || !instagramUrl || posts.length === 0) {
    return null // Don't show anything if there's an error or no Instagram URL
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Instagram className="h-4 w-4 mr-2" />
          <h3 className="text-sm font-medium">Follow us on Instagram</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {posts.slice(0, 6).map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden rounded-md"
            >
              <img
                src={post.media_url || "/placeholder.svg"}
                alt={post.caption || "Instagram post"}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
