"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"



import { Skeleton } from "@/components/ui"

import {
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Film,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription } from "@/components/ui"
interface Product {
  id: string
  name: string
  img_url: string | null
  shopify_product_id: string
  status: "complete" | "incomplete" | "not_started"
  content_blocks_count: number
  total_blocks_needed: number
  submission_status?: "pending" | "approved" | "published"
  is_pending?: boolean
  analytics?: {
    views: number
    video_plays: number
    audio_plays: number
  }
}

export default function ArtworkPagesPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendorProfile, setVendorProfile] = useState<{ signature_url: string | null; bio: string | null } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [productsRes, profileRes] = await Promise.all([
          fetch("/api/vendor/artwork-pages", { credentials: "include" }),
          fetch("/api/vendor/profile", { credentials: "include" }),
        ])

        if (!productsRes.ok) {
          throw new Error("Failed to fetch artwork pages")
        }

        const productsData = await productsRes.json()
        setProducts(productsData.products || [])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setVendorProfile({
            signature_url: profileData.vendor?.signature_url || null,
            bio: profileData.vendor?.bio || null,
          })
        }
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load artwork pages")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )
      case "incomplete":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Incomplete
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            Not Started
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artwork Pages</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Create and manage unlockable content for collectors after NFC authentication
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No artworks yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first artwork to start building unlockable content pages for collectors.
            </p>
            <Button onClick={() => router.push("/vendor/dashboard/products/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Artwork
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile Completeness Prompts */}
          {vendorProfile && (!vendorProfile.signature_url || !vendorProfile.bio) && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                {!vendorProfile.signature_url && (
                  <div className="flex items-center justify-between">
                    <p>Your signature will appear on every artwork page. Upload your signature to continue.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/vendor/dashboard/profile")}
                    >
                      Upload Signature
                    </Button>
                  </div>
                )}
                {!vendorProfile.bio && (
                  <div className="flex items-center justify-between">
                    <p>Your artist bio appears on artwork pages. Add a bio to help collectors connect with you.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/vendor/dashboard/profile")}
                    >
                      Go to Profile
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                {product.img_url ? (
                  <Image
                    src={product.img_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(product.status)}
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Content Blocks</span>
                    <span className="font-medium">
                      {product.content_blocks_count} / {product.total_blocks_needed}
                    </span>
                  </div>
                  {product.analytics && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{product.analytics.views} views</span>
                      </div>
                      {(product.analytics.video_plays > 0 || product.analytics.audio_plays > 0) && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>
                            {product.analytics.video_plays + product.analytics.audio_plays} plays
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="default"
                      className="flex-1"
                    >
                      <Link href={product.is_pending 
                        ? `/vendor/dashboard/artwork-pages/${product.id}` 
                        : `/vendor/dashboard/artwork-pages/${product.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        {product.status === "not_started" ? "Set Up" : "Edit"}
                      </Link>
                    </Button>
                    {!product.is_pending && (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          title="Full-Screen Editor"
                        >
                          <Link href={`/artwork-editor/${product.id}`}>
                            📱
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          title="View as Collector"
                        >
                          <Link href={`/vendor/dashboard/artwork-pages/${product.id}/preview`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                  {!product.is_pending && (
                    <div className="flex gap-2">
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                      >
                        <Link href={`/slides/${product.id}`}>
                          <Film className="h-4 w-4 mr-2" />
                          Manage
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                      >
                        <Link href={`/slides/${product.id}/view`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
                {product.is_pending && product.submission_status && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {product.submission_status === "pending" ? "Pending Review" : "Approved - Not Published"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}
    </div>
  )
}
