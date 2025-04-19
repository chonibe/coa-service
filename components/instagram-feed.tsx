"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Instagram, Loader2 } from "lucide-react"
import { getVendorInstagramUrls } from "@/lib/data-access"

interface InstagramFeedProps {
  vendor: string
}

const InstagramFeed = ({ vendor }: InstagramFeedProps) => {
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInstagramUsername = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch Instagram username from your backend or a configuration
        // For now, let's simulate fetching it
        const vendorInstagramUrls = await getVendorInstagramUrls()
        setInstagramUsername(vendorInstagramUrls[vendor] || null)
      } catch (err: any) {
        console.error("Error fetching Instagram username:", err)
        setError(err.message || "Failed to fetch Instagram username")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstagramUsername()
  }, [vendor])

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardContent className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instagram Feed Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Instagram className="h-6 w-6 text-indigo-500" />
          <h2 className="text-xl font-semibold">Instagram Feed</h2>
        </div>
        {instagramUsername ? (
          <div className="space-y-4">
            <p>Displaying Instagram feed for @{instagramUsername}</p>
            {/* Add Instagram feed grid and stories viewer here */}
            <Button variant="outline" asChild>
              <a href={`https://instagram.com/${instagramUsername}`} target="_blank" rel="noopener noreferrer">
                View on Instagram
              </a>
            </Button>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Instagram Account Found</AlertTitle>
            <AlertDescription>No Instagram account associated with this vendor.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default InstagramFeed
