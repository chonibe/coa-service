"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Artwork } from "@/types/collector"

interface ArtworkCardProps {
  artwork: Artwork
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const imageUrl = artwork.images?.[0]?.src || "/placeholder-image.jpg"
  const isNew = artwork.isNew
  const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "thestreetlamp-9103.myshopify.com"
  const productHandle = artwork.handle || artwork.shopifyProductId
  const shopifyUrl = `https://${shopDomain}/products/${productHandle}`

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <Link href={`/collector/products/${artwork.id}`}>
        <div className="relative w-full aspect-[4/5] bg-muted">
          <Image
            src={imageUrl}
            alt={artwork.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={isNew}
          />
          {isNew && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
              New Drop!
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4 flex flex-col items-start">
        <h3 className="text-lg font-semibold line-clamp-2 mb-1">{artwork.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">By {artwork.vendor.name}</p>
        {artwork.series && (
          <Badge variant="secondary" className="mb-2 capitalize">
            {artwork.series.name} Series
          </Badge>
        )}
        <div className="flex items-center justify-between w-full mt-auto">
          <span className="text-xl font-bold text-primary">
            {artwork.price ? `${artwork.currency} ${artwork.price.toFixed(2)}` : "N/A"}
          </span>
          <Button variant="secondary" size="sm" asChild>
            <a href={shopifyUrl} target="_blank" rel="noopener noreferrer">
              View on Shopify
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


