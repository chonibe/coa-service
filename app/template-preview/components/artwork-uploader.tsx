"use client"

import { useState, useRef } from "react"

import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"


import { Button, Alert, AlertDescription } from "@/components/ui"
interface ArtworkUploaderProps {
  onImageUpload: (imageUrl: string) => void
  onImageRemove: () => void
  currentImage: string | null
}

export function ArtworkUploader({
  onImageUpload,
  onImageRemove,
  currentImage,
}: ArtworkUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, etc.)")
      return
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      setError(`File is too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Create preview using FileReader (no upload needed for preview)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageUpload(result)
        setUploading(false)
      }
      reader.onerror = () => {
        setError("Failed to read image file")
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message || "Failed to process image")
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const fakeEvent = {
        target: { files: [file] },
      } as any
      handleFileSelect(fakeEvent)
    }
  }

  return (
    <div className="space-y-4">
      {currentImage ? (
        <div className="relative">
          <div className="relative aspect-square w-full border-2 border-primary rounded-lg overflow-hidden bg-muted">
            <img
              src={currentImage}
              alt="Artwork preview"
              className="w-full h-full object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={onImageRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Artwork loaded. View preview on the right.
          </p>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 bg-muted/50 cursor-pointer group hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            {uploading ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                {uploading ? "Processing..." : "Drop your artwork here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or WebP (max 10MB)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Processing..." : "Choose Image"}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

