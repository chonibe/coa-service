"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, Image as ImageIcon, Video, Music, X } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

interface MediaItem {
  url: string
  path: string
  name: string
  created_at: string
  size: number
  type: "image" | "video" | "audio"
}

interface ContentLibraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  mediaType?: "image" | "video" | "audio"
}

export function ContentLibraryModal({
  open,
  onOpenChange,
  onSelect,
  mediaType,
}: ContentLibraryModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio">(
    mediaType || "all"
  )
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchMedia()
    }
  }, [open, activeTab])

  useEffect(() => {
    // Filter media by search query
    if (searchQuery.trim() === "") {
      setFilteredMedia(media)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredMedia(
        media.filter((item) => item.name.toLowerCase().includes(query))
      )
    }
  }, [searchQuery, media])

  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const typeParam = activeTab !== "all" ? `?type=${activeTab}` : ""
      const response = await fetch(`/api/vendor/content-library${typeParam}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch content library")
      }

      const data = await response.json()
      setMedia(data.media || [])
      setFilteredMedia(data.media || [])
    } catch (err: any) {
      console.error("Error fetching content library:", err)
      toast({
        title: "Error",
        description: "Failed to load content library",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (url: string) => {
    onSelect(url)
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Content Library</DialogTitle>
          <DialogDescription>
            Select from your uploaded media files
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Tabs */}
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="video">
                  <Video className="h-4 w-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Music className="h-4 w-4 mr-2" />
                  Audio
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? "No files found matching your search" : "No media files found"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload files to add them to your content library
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((item) => (
                  <div
                    key={item.path}
                    className="group relative border rounded-lg overflow-hidden hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handleSelect(item.url)}
                  >
                    {item.type === "image" ? (
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : item.type === "video" ? (
                      <div className="aspect-square relative bg-muted flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white bg-black/50 px-2 py-1 rounded truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square relative bg-muted flex items-center justify-center">
                        <Music className="h-12 w-12 text-muted-foreground" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white bg-black/50 px-2 py-1 rounded truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="p-2 bg-background">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
