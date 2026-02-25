"use client"

import { useState, useEffect, useCallback } from "react"
import { Link2, Copy, Check, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Button, Input } from "@/components/ui"

interface Artist {
  name: string
  slug: string
  productCount: number
  image?: string
  instagramUrl?: string
}

export default function ExperienceLinksPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://streetcollector.com"

  const fetchArtists = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/shop/artists", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch artists")
      const data = await res.json()
      setArtists(data.artists || [])
    } catch (err: any) {
      setError(err.message || "Failed to load artists")
      setArtists([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArtists()
  }, [fetchArtists])

  const fullUrl = (slug: string) => `${baseUrl}/shop/experience?artist=${encodeURIComponent(slug)}`
  const shortUrl = (slug: string) => `${baseUrl}/e/${slug}`

  const copyToClipboard = async (text: string, slug: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      setCopiedSlug(null)
    }
  }

  const filteredArtists = artists.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artist Experience Links</h1>
          <p className="text-muted-foreground mt-1">
            Share these links so visitors from artist Instagram pages land on the experience with that artist&apos;s artworks pre-selected.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Experience Links
            </CardTitle>
            <CardDescription>
              Each link opens the lamp builder with the artist&apos;s works filtered first. Copy the full URL or the short link for Instagram bios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search by artist name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <p className="text-destructive py-4">{error}</p>
              ) : filteredArtists.length === 0 ? (
                <p className="text-muted-foreground py-4">
                  {searchQuery ? "No artists match your search." : "No artists found."}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredArtists.map((artist) => {
                    const full = fullUrl(artist.slug)
                    const short = shortUrl(artist.slug)
                    const isCopied = copiedSlug === artist.slug
                    return (
                      <div
                        key={artist.slug}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{artist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {artist.productCount} artwork{artist.productCount !== 1 ? "s" : ""} · slug: <code className="text-xs">{artist.slug}</code>
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(full, artist.slug)}
                              className="shrink-0"
                            >
                              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              <span className="ml-1.5">{isCopied ? "Copied" : "Full link"}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(short, artist.slug)}
                              className="shrink-0"
                            >
                              <Copy className="h-4 w-4" />
                              <span className="ml-1.5">Short</span>
                            </Button>
                          </div>
                          <a
                            href={full}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          <strong>Full link:</strong> <code>/shop/experience?artist=artist-slug</code> — use in Instagram bio or link in bio services.
          <br />
          <strong>Short link:</strong> <code>/e/artist-slug</code> — redirects to the same experience. Ideal when character count matters.
        </p>
      </div>
    </div>
  )
}
