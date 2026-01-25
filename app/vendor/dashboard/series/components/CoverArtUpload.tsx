"use client"

import { useState, useRef } from "react"

import { Loader2, Upload, X, Image as ImageIcon, Folder } from "lucide-react"
import { motion } from "framer-motion"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"

import { Button } from "@/components/ui"
interface CoverArtUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  onUpload?: (file: File) => Promise<string>
  seriesId?: string
}

export function CoverArtUpload({ value, onChange, onUpload, seriesId }: CoverArtUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [showLibrary, setShowLibrary] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Create preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
    }
    reader.readAsDataURL(file)

    // Upload if onUpload callback or seriesId is provided
    if (onUpload) {
      await handleUpload(file)
    } else if (seriesId) {
      await handleUploadToAPI(file)
    } else {
      // Just use data URL for preview
      onChange(preview)
    }
  }

  const handleUpload = async (file: File) => {
    if (!onUpload) return
    
    setUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch (error) {
      console.error("Error uploading cover art:", error)
      alert("Failed to upload cover art")
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadToAPI = async (file: File) => {
    if (!seriesId) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/vendor/series/${seriesId}/cover-art`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload cover art")
      }

      const data = await response.json()
      onChange(data.url)
    } catch (error: any) {
      console.error("Error uploading cover art:", error)
      alert(error.message || "Failed to upload cover art")
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
        if (onUpload) {
          handleUpload(file)
        } else if (seriesId) {
          handleUploadToAPI(file)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative aspect-square w-full max-w-[400px] mx-auto border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50 cursor-pointer group hover:border-primary transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Cover art preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
            ) : (
              <>
                <ImageIcon className="h-12 w-12 mb-4" />
                <p className="text-sm font-medium mb-1">Upload cover art</p>
                <p className="text-xs">Drag & drop or click to select</p>
                <p className="text-xs mt-2">Square images work best</p>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="mt-3 flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLibrary(true)}
        >
          <Folder className="h-4 w-4 mr-2" />
          Select from Library
        </Button>
      </div>
      <MediaLibraryModal
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelect={handleLibrarySelect}
        mode="single"
        allowedTypes={["image"]}
        title="Select Cover Art"
      />
    </div>
  )
}
