"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"



import { Skeleton } from "@/components/ui/skeleton"
import { ProductApiResponse, ProductArtwork } from "@/types/collector"

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [artwork, setArtwork] = useState<ProductArtwork | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mainImage, setMainImage] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!id) {
      setError("Missing artwork id")
      setIsLoading(false)
      return
    }
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/collector/products/${id}`)
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.message || "Failed to load product")
        }
        const data: ProductApiResponse = await res.json()
        setArtwork(data.artwork)
        setMainImage(data.artwork.images?.[0]?.src)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="w-full h-[500px]" />
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">Error: {error}</div>
  }

  if (!artwork) {
    notFound()
  }

  const primaryVariant = artwork.variants?.[0]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <div className="aspect-square w-full relative mb-4 rounded-lg overflow-hidden bg-muted">
            {mainImage && (
              <Image
                src={mainImage}
                alt={artwork.title}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {artwork.images.map((img) => (
              <div
                key={img.id}
                className={`w-20 h-20 relative cursor-pointer rounded-md overflow-hidden border-2 ${mainImage === img.src ? "border-primary" : "border-transparent"}`}
                onClick={() => setMainImage(img.src)}
              >
                <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="80px" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">{artwork.title}</h1>
          <Link href={`/collector/artists/${artwork.vendor.name}`} className="text-lg text-muted-foreground hover:underline">
            By {artwork.vendor.name}
          </Link>

          <div className="flex items-baseline gap-2">
            {artwork.price !== null && (
              <span className="text-4xl font-extrabold text-primary">
                {artwork.currency} {artwork.price.toFixed(2)}
              </span>
            )}
            {artwork.compareAtPrice && artwork.price && artwork.price < artwork.compareAtPrice && (
              <span className="text-xl text-muted-foreground line-through">
                {artwork.currency} {artwork.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">{artwork.description}</p>

          {artwork.series && (
            <Card className="bg-muted/50 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Part of: {artwork.series.name} Series</CardTitle>
                <CardDescription>{artwork.series.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Series</Badge>
                <Button variant="link" className="px-0 ml-2" asChild>
                  <Link href={`/collector/series/${artwork.series.id}`}>View Series</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Button className="w-full text-lg py-7" asChild disabled={!primaryVariant?.available}>
            <a
              href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "thestreetlamp-9103.myshopify.com"}/products/${
                artwork.handle || artwork.shopifyProductId
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {primaryVariant?.available ? "View on Shopify" : "Sold Out"}
            </a>
          </Button>
        </div>
      </div>

      {artwork.relatedArtworks && artwork.relatedArtworks.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">More from this Series</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artwork.relatedArtworks.map((related) => (
              <Card key={related.id} className="overflow-hidden shadow-lg">
                <Link href={`/collector/products/${related.id}`}>
                  <div className="relative w-full aspect-[4/5] bg-muted">
                    {related.image && (
                      <Image
                        src={related.image}
                        alt={related.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    )}
                    {related.isLocked && (
                      <Badge className="absolute top-2 right-2 bg-yellow-500 text-white shadow-md">Locked</Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold line-clamp-2">{related.title}</h3>
                  {related.displayOrder !== undefined && (
                    <p className="text-sm text-muted-foreground">Piece #{related.displayOrder + 1}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


