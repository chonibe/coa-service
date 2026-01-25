"use client"


import Image from "next/image"
import { useState } from "react"

import { Card, CardContent } from "@/components/ui"
interface ImageBlockProps {
  title?: string | null
  contentUrl: string | null
  blockConfig?: any
}

export function ImageBlock({ title, contentUrl, blockConfig }: ImageBlockProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!contentUrl) return null

  const caption = blockConfig?.caption || null

  // Check if URL is a valid image URL
  const isValidImageUrl = contentUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || 
                          contentUrl.startsWith('http') ||
                          contentUrl.startsWith('/')

  if (!isValidImageUrl && !imageError) {
    // If it's not a valid image URL, show as a link fallback
    return (
      <Card>
        <CardContent className="p-6">
          {title && <h3 className="font-semibold mb-4">{title}</h3>}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Image URL:</p>
            <a 
              href={contentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {contentUrl}
            </a>
          </div>
          {caption && (
            <p className="text-sm text-muted-foreground mt-2 italic">{caption}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-semibold mb-4">{title}</h3>}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading image...</div>
            </div>
          )}
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Failed to load image</p>
                <a 
                  href={contentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {contentUrl}
                </a>
              </div>
            </div>
          ) : (
            <Image
              src={contentUrl}
              alt={title || "Artwork content"}
              fill
              className="object-contain"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
              unoptimized={contentUrl.startsWith('http') && !contentUrl.includes('supabase')}
            />
          )}
        </div>
        {caption && (
          <p className="text-sm text-muted-foreground mt-2 italic">{caption}</p>
        )}
      </CardContent>
    </Card>
  )
}
