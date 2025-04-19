"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Instagram, ExternalLink } from "lucide-react"

interface InstagramPost {
  id: string
  media_url: string
  permalink: string
  caption?: string
  timestamp: string
}

export default function VendorInstagramFeed({ vendor }: { vendor: string }) {
  const [instagramUrl, setInstagramUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Fetch the vendor's Instagram URL and posts
  useEffect(() => {
    const fetchInstagramData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch the vendor's Instagram URL
        const urlResponse = await fetch(`/api/instagram/vendor-url?vendor=${encodeURIComponent(vendor)}`)

        if (!urlResponse.ok) {
          throw new Error("Failed to fetch Instagram URL")
        }

        const urlData = await urlResponse.json()
        setInstagramUrl(urlData.instagram_url || "")

        // If there's an Instagram URL, fetch the posts
        if (urlData.instagram_url) {
          const postsResponse = await fetch(`/api/instagram/posts?vendor=${encodeURIComponent(vendor)}`)

          if (!postsResponse.ok) {
            throw new Error("Failed to fetch Instagram posts")
          }

          const postsData = await postsResponse.json()
          setPosts(postsData.posts || [])
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

  // Save the Instagram URL
  const saveInstagramUrl = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/instagram/vendor-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor,
          instagram_url: instagramUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save Instagram URL")
      }

      setIsEditing(false)

      // Refresh posts if URL was updated
      const postsResponse = await fetch(`/api/instagram/posts?vendor=${encodeURIComponent(vendor)}`)

      if (!postsResponse.ok) {
        throw new Error("Failed to fetch Instagram posts")
      }

      const postsData = await postsResponse.json()
      setPosts(postsData.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Instagram className="mr-2 h-5 w-5" />
          Instagram Feed
        </CardTitle>
        <CardDescription>Connect and display Instagram posts for {vendor}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="Enter Instagram URL"
                className="flex-1"
              />
              <Button onClick={saveInstagramUrl} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    {instagramUrl}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-gray-500">No Instagram URL configured</span>
                )}
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                {instagramUrl ? "Edit" : "Add"} URL
              </Button>
            </div>
          )}
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <img
                  src={post.media_url || "/placeholder.svg"}
                  alt={post.caption || "Instagram post"}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{post.caption || "No caption"}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(post.timestamp).toLocaleDateString()}</p>
                </div>
              </a>
            ))}
          </div>
        ) : instagramUrl ? (
          <div className="text-center py-8 text-gray-500">No Instagram posts found</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
