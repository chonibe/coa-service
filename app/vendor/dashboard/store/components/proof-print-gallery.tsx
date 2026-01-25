"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

import { ArtworkCard } from "./artwork-card"
import { useToast } from "@/components/ui/use-toast"

import { Badge } from "@/components/ui"
interface Artwork {
  id: string
  title: string
  imageUrl: string | null
  status: string
  submittedAt: string
  proofPrintsOrdered: number
  canOrderProofPrint: boolean
  remainingProofPrints: number
}

export function ProofPrintGallery() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchArtworks()
    
    // Check if we should highlight a specific artwork
    if (typeof window !== 'undefined') {
      const highlightId = sessionStorage.getItem('highlightArtwork')
      if (highlightId) {
        sessionStorage.removeItem('highlightArtwork')
        // Scroll to the artwork after a short delay
        setTimeout(() => {
          const element = document.querySelector(`[data-artwork-id="${highlightId}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Add a highlight effect
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
            }, 2000)
          }
        }, 500)
      }
    }
  }, [])

  const fetchArtworks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/store/artworks", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch artworks")
      }

      const data = await response.json()
      if (data.success) {
        setArtworks(data.artworks)
      }
    } catch (error: any) {
      console.error("Error fetching artworks:", error)
      toast({
        title: "Error",
        description: "Failed to load artworks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchaseSuccess = () => {
    fetchArtworks() // Refresh to update proof print counts
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (artworks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No artworks available for proof prints</p>
        <p className="text-sm text-muted-foreground mt-2">
          Submit your artworks to make them available for proof print orders
        </p>
      </div>
    )
  }

  // Separate artworks by status for better organization
  const pendingArtworks = artworks.filter(a => a.status === "pending")
  const approvedArtworks = artworks.filter(a => a.status === "approved" || a.status === "published")

  return (
    <div className="space-y-6">
      {pendingArtworks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Pending Approval</span>
            <Badge variant="secondary" className="text-xs">
              {pendingArtworks.length}
            </Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onPurchaseSuccess={handlePurchaseSuccess}
              />
            ))}
          </div>
        </div>
      )}

      {approvedArtworks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Approved Artworks</span>
            <Badge variant="default" className="text-xs">
              {approvedArtworks.length}
            </Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onPurchaseSuccess={handlePurchaseSuccess}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

