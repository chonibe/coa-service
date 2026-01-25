"use client"

import Image from "next/image"


import { Separator } from "@/components/ui/separator"
import { X, Copy, Trash2, Download, Image as ImageIcon, Video, Music, FileText } from "lucide-react"
import type { MediaItem } from "../page"

import { Button, Badge } from "@/components/ui"
interface MediaDetailsProps {
  item: MediaItem
  onClose: () => void
  onDelete: () => void
  onCopyUrl: () => void
}

export function MediaDetails({ item, onClose, onDelete, onCopyUrl }: MediaDetailsProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="sticky top-6 border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">File Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview */}
      <div className="mb-4">
        {item.type === "image" ? (
          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
            <Image src={item.url} alt={item.name} fill className="object-contain" />
          </div>
        ) : item.type === "video" ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <video src={item.url} controls className="w-full h-full" />
          </div>
        ) : item.type === "audio" ? (
          <div className="p-8 rounded-lg bg-muted flex flex-col items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <audio src={item.url} controls className="w-full" />
          </div>
        ) : (
          <div className="p-8 rounded-lg bg-muted flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">PDF Document</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm font-medium mb-1">Filename</p>
          <p className="text-sm text-muted-foreground break-all">{item.name}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-1">Type</p>
          <Badge variant="outline">{item.type.toUpperCase()}</Badge>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Size</p>
          <p className="text-sm text-muted-foreground">{formatFileSize(item.size)}</p>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Uploaded</p>
          <p className="text-sm text-muted-foreground">{formatDate(item.created_at)}</p>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">URL</p>
          <p className="text-xs text-muted-foreground break-all font-mono bg-muted p-2 rounded">
            {item.url}
          </p>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={onCopyUrl}>
          <Copy className="h-4 w-4 mr-2" />
          Copy URL
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => window.open(item.url, "_blank")}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-start"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}
