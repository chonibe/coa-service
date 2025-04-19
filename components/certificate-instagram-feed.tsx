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

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/instagram/posts?vendor=${encodeURIComponent(vendor)}`)

        if (!response.ok) {
          throw new Error("Failed to fetch Instagram posts")
        }

        const data = await response.json()
        setPosts(data.posts || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (vendor) {
      fetchInstagramPosts()
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

  if (error || posts.length === 0) {
    return null // Don't show anything if there's an error or no posts
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
