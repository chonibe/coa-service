"use client"

import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Video, Music, FileText, MoreVertical } from "lucide-react"
import type { MediaItem } from "../page"

interface MediaGridProps {
  media: MediaItem[]
  viewMode: "grid" | "list"
  selectedItems: Set<string>
  onSelectItem: (item: MediaItem) => void
  onToggleSelection: (id: string) => void
  onSelectAll: () => void
}

export function MediaGrid({
  media,
  viewMode,
  selectedItems,
  onSelectItem,
  onToggleSelection,
  onSelectAll,
}: MediaGridProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "pdf":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 border-b">
          <Checkbox
            checked={selectedItems.size === media.length && media.length > 0}
            onCheckedChange={onSelectAll}
          />
          <div className="flex-1 grid grid-cols-4 gap-4 text-sm font-medium">
            <div>Name</div>
            <div>Type</div>
            <div>Size</div>
            <div>Date</div>
          </div>
        </div>
        {media.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer"
            onClick={() => onSelectItem(item)}
          >
            <Checkbox
              checked={selectedItems.has(item.id)}
              onCheckedChange={() => onToggleSelection(item.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 grid grid-cols-4 gap-4 text-sm items-center">
              <div className="flex items-center gap-2 min-w-0">
                {item.type === "image" ? (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={item.url}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-muted rounded flex-shrink-0">
                    {getMediaIcon(item.type)}
                  </div>
                )}
                <span className="truncate">{item.name}</span>
              </div>
              <div>
                <Badge variant="outline">{item.type}</Badge>
              </div>
              <div className="text-muted-foreground">{formatFileSize(item.size)}</div>
              <div className="text-muted-foreground">{formatDate(item.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {media.map((item) => (
        <div
          key={item.id}
          className={`relative group border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors ${
            selectedItems.has(item.id) ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectItem(item)}
        >
          <div className="aspect-square relative bg-muted">
            {item.type === "image" ? (
              <Image
                src={item.url}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : item.type === "video" ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Video className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground px-2 text-center">Video</p>
              </div>
            ) : item.type === "audio" ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Music className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground px-2 text-center">Audio</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground px-2 text-center">PDF</p>
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
          <div className="p-2 bg-background">
            <p className="text-xs font-medium truncate">{item.name}</p>
            <div className="flex justify-between items-center mt-1">
              <Badge variant="outline" className="text-xs">
                {item.type}
              </Badge>
              <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
            </div>
          </div>
          {/* Selection checkbox */}
          <div
            className="absolute top-2 left-2 z-10"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelection(item.id)
            }}
          >
            <Checkbox checked={selectedItems.has(item.id)} />
          </div>
        </div>
      ))}
    </div>
  )
}
