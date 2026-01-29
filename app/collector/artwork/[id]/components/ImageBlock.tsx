"use client"

import Image from "next/image"
import { useState } from "react"
import { ImageIcon, AlertCircle } from "lucide-react"

interface ImageBlockProps {
  title?: string | null
  contentUrl: string | null
  blockConfig?: {
    caption?: string
    fitMode?: "contain" | "cover" | "fill"
    position?: "center" | "top" | "bottom" | "left" | "right"
    aspectRatio?: "video" | "square" | "portrait" | "auto" | "original"
  }
}

export function ImageBlock({ title, contentUrl, blockConfig }: ImageBlockProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null)

  if (!contentUrl) return null

  const caption = blockConfig?.caption || null
  const fitMode = blockConfig?.fitMode || "contain"
  const position = blockConfig?.position || "center"
  const aspectRatio = blockConfig?.aspectRatio || "video"

  // Object fit class based on config
  const fitClass = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
  }[fitMode]

  // Object position class based on config
  const positionClass = {
    center: "object-center",
    top: "object-top",
    bottom: "object-bottom",
    left: "object-left",
    right: "object-right",
  }[position]

  // Aspect ratio class
  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    auto: naturalAspect ? "" : "aspect-video",
    original: naturalAspect ? "" : "aspect-video",
  }[aspectRatio]

  // Check if URL is a valid image URL
  const isValidImageUrl = contentUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || 
                          contentUrl.includes('supabase.co/storage') ||
                          contentUrl.includes('/storage/v1/object/public/') ||
                          contentUrl.startsWith('http') ||
                          contentUrl.startsWith('/')

  // Handle image load to capture natural dimensions for auto aspect
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoading(false)
    const img = e.currentTarget
    if (img.naturalWidth && img.naturalHeight) {
      setNaturalAspect(img.naturalWidth / img.naturalHeight)
    }
  }

  if (!isValidImageUrl && !imageError) {
    // If it's not a valid image URL, show as a link fallback
    return (
      <div className="py-8 md:py-12">
        {title && (
          <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            {title}
          </h3>
        )}
        <div className="p-6 bg-muted/50 rounded-2xl">
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
          <p className="text-muted-foreground mt-4 text-center italic">{caption}</p>
        )}
      </div>
    )
  }

  return (
    <div className="py-8 md:py-12">
      {title && (
        <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
          <ImageIcon className="h-5 w-5 text-blue-500" />
          {title}
        </h3>
      )}
      <div 
        className={`relative ${aspectClass} rounded-2xl overflow-hidden bg-muted shadow-lg`}
        style={
          (aspectRatio === "auto" || aspectRatio === "original") && naturalAspect
            ? { aspectRatio: naturalAspect }
            : undefined
        }
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-6 w-6" />
              Loading...
            </div>
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">Failed to load image</p>
              <a 
                href={contentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Open in new tab
              </a>
            </div>
          </div>
        ) : (
          <Image
            src={contentUrl}
            alt={title || "Artwork content"}
            fill
            className={`${fitClass} ${positionClass} transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            unoptimized={contentUrl.startsWith('http') && !contentUrl.includes('supabase')}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        )}
      </div>
      {caption && (
        <p className="text-muted-foreground mt-4 text-center italic text-lg">{caption}</p>
      )}
    </div>
  )
}
