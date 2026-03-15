"use client"

import { useState, useEffect, useCallback } from "react"
import { Link2, Copy, Check, Loader2, ExternalLink, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Button, Input, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Alert, AlertDescription } from "@/components/ui"

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
  const [earlyAccessDialogOpen, setEarlyAccessDialogOpen] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [earlyAccessLink, setEarlyAccessLink] = useState<string | null>(null)
  const [earlyAccessToken, setEarlyAccessToken] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [earlyAccessError, setEarlyAccessError] = useState<string | null>(null)
  const [copiedEarlyAccessLink, setCopiedEarlyAccessLink] = useState(false)

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

  const fullUrl = (slug: string) => `${baseUrl}/experience?artist=${encodeURIComponent(slug)}`
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

  const handleGenerateEarlyAccessLink = async (artist: Artist) => {
    setSelectedArtist(artist)
    setEarlyAccessDialogOpen(true)
    setEarlyAccessLink(null)
    setEarlyAccessToken(null)
    setEarlyAccessError(null)
    setIsGeneratingLink(true)

    try {
      const response = await fetch('/api/admin/generate-early-access-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistSlug: artist.slug }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate early access link')
      }

      const data = await response.json()
      setEarlyAccessLink(data.link)
      setEarlyAccessToken(data.token)
    } catch (err: any) {
      setEarlyAccessError(err.message || 'Failed to generate link')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const copyEarlyAccessLink = async () => {
    if (earlyAccessLink) {
      try {
        await navigator.clipboard.writeText(earlyAccessLink)
        setCopiedEarlyAccessLink(true)
        setTimeout(() => setCopiedEarlyAccessLink(false), 2000)
      } catch {
        // Ignore clipboard errors
      }
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
                          <div className="flex gap-2 flex-wrap">
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
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleGenerateEarlyAccessLink(artist)}
                              className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span className="ml-1.5">Early Access</span>
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
          <strong>Full link:</strong> <code>/experience?artist=artist-slug</code> — use in Instagram bio or link in bio services.
          <br />
          <strong>Short link:</strong> <code>/e/artist-slug</code> — redirects to the same experience. Ideal when character count matters.
          <br />
          <strong>Early Access:</strong> Generates a secure link with a 10% discount coupon. Links expire after 30 days.
        </p>
      </div>

      <Dialog open={earlyAccessDialogOpen} onOpenChange={setEarlyAccessDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Early Access Link for {selectedArtist?.name}
            </DialogTitle>
            <DialogDescription>
              This link includes a secure token that provides a 10% discount on all artworks from this artist. The link expires in 30 days.
            </DialogDescription>
          </DialogHeader>

          {isGeneratingLink ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-sm text-muted-foreground">Generating secure link...</span>
            </div>
          ) : earlyAccessError ? (
            <Alert variant="destructive">
              <AlertDescription>{earlyAccessError}</AlertDescription>
            </Alert>
          ) : earlyAccessLink ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Early Access Link</label>
                <div className="flex gap-2">
                  <Input
                    value={earlyAccessLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copyEarlyAccessLink}
                    variant="outline"
                    size="icon"
                  >
                    {copiedEarlyAccessLink ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Artist Page Link</label>
                <div className="flex gap-2">
                  <Input
                    value={earlyAccessLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(earlyAccessLink, selectedArtist?.slug || '')}
                    variant="outline"
                    size="icon"
                  >
                    {copiedSlug === selectedArtist?.slug ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {selectedArtist && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Experience Page Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={`${baseUrl}/shop/experience?artist=${encodeURIComponent(selectedArtist.slug)}&unlisted=1&token=${encodeURIComponent(earlyAccessToken || '')}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => {
                        const expLink = `${baseUrl}/shop/experience?artist=${encodeURIComponent(selectedArtist.slug)}&unlisted=1&token=${encodeURIComponent(earlyAccessToken || '')}`
                        copyToClipboard(expLink, selectedArtist.slug)
                      }}
                      variant="outline"
                      size="icon"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Note:</strong> This link includes a secure token that expires in 30 days. 
                  Share this link with customers to provide early access with a 10% discount. 
                  The discount will be automatically applied at checkout.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEarlyAccessDialogOpen(false)}>
              Close
            </Button>
            {earlyAccessLink && (
              <Button
                onClick={() => {
                  window.open(earlyAccessLink, '_blank')
                }}
                variant="default"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
