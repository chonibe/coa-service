"use client"

import { useState, useEffect, useCallback } from "react"





import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Search,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Upload,
  X,
} from "lucide-react"
import Image from "next/image"


import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Checkbox } from "@/components/ui"
export interface MediaItem {
  id: string
  url: string
  path: string
  name: string
  created_at: string
  size: number
  type: "image" | "video" | "audio" | "pdf"
  bucket: string
  mime_type?: string
}

interface MediaLibraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaItem | MediaItem[]) => void
  mode?: "single" | "multiple"
  allowedTypes?: ("image" | "video" | "audio" | "pdf")[]
  maxSelection?: number
  showUpload?: boolean
  title?: string
}

export function MediaLibraryModal({
  open,
  onOpenChange,
  onSelect,
  mode = "single",
  allowedTypes,
  maxSelection,
  showUpload = true,
  title = "Select Media",
}: MediaLibraryModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio" | "pdf">(
    allowedTypes && allowedTypes.length === 1 ? allowedTypes[0] : "all"
  )
  const [selectedItems, setSelectedItems] = useState<Map<string, MediaItem>>(new Map())
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const fetchMedia = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") params.set("type", activeTab)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/vendor/media-library?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch media")
      }

      const data = await response.json()
      let mediaList = data.media || []

      // Filter by allowed types
      if (allowedTypes && allowedTypes.length > 0) {
        mediaList = mediaList.filter((item: MediaItem) => allowedTypes.includes(item.type))
      }

      setMedia(mediaList)
      setFilteredMedia(mediaList)
    } catch (error: any) {
      console.error("Error fetching media:", error)
      toast({
        title: "Error",
        description: "Failed to load media library",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchQuery, allowedTypes, toast])

  useEffect(() => {
    if (open) {
      fetchMedia()
    }
  }, [open, fetchMedia])

  const toggleSelection = (item: MediaItem) => {
    if (mode === "single") {
      setSelectedItems(new Map([[item.id, item]]))
    } else {
      const newSelected = new Map(selectedItems)
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id)
      } else {
        if (maxSelection && newSelected.size >= maxSelection) {
          toast({
            title: "Maximum reached",
            description: `You can only select up to ${maxSelection} items`,
            variant: "destructive",
          })
          return
        }
        newSelected.set(item.id, item)
      }
      setSelectedItems(newSelected)
    }
  }

  const handleSelect = () => {
    const selected = Array.from(selectedItems.values())
    if (selected.length === 0) {
      toast({
        title: "No selection",
        description: "Please select at least one item",
        variant: "destructive",
      })
      return
    }

    onSelect(mode === "single" ? selected[0] : selected)
    setSelectedItems(new Map())
    onOpenChange(false)
  }

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        
        let type = "image"
        if (file.type.startsWith("video/")) type = "video"
        else if (file.type.startsWith("audio/")) type = "audio"
        else if (file.type === "application/pdf") type = "pdf"
        
        formData.append("type", type)

        const response = await fetch("/api/vendor/media-library/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return response.json()
      })

      await Promise.all(uploadPromises)
      
      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s)`,
      })

      fetchMedia()
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-8 w-8" />
      case "video":
        return <Video className="h-8 w-8" />
      case "audio":
        return <Music className="h-8 w-8" />
      case "pdf":
        return <FileText className="h-8 w-8" />
      default:
        return <FileText className="h-8 w-8" />
    }
  }

  const stats = {
    images: media.filter(m => m.type === "image").length,
    videos: media.filter(m => m.type === "video").length,
    audio: media.filter(m => m.type === "audio").length,
    pdfs: media.filter(m => m.type === "pdf").length,
  }

  const showTabs = !allowedTypes || allowedTypes.length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "single"
              ? "Select a file from your library"
              : `Select up to ${maxSelection || "multiple"} files`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Upload */}
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {showUpload && (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple={mode === "multiple"}
                  accept={
                    allowedTypes
                      ? allowedTypes.map(t => {
                          if (t === "image") return "image/*"
                          if (t === "video") return "video/*"
                          if (t === "audio") return "audio/*"
                          if (t === "pdf") return "application/pdf"
                          return ""
                        }).join(",")
                      : "image/*,video/*,audio/*,application/pdf"
                  }
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="media-upload"
                  disabled={uploading}
                />
                <label htmlFor="media-upload">
                  <Button type="button" variant="outline" disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload New Files
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            )}

            {showTabs && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {(!allowedTypes || allowedTypes.includes("image")) && (
                    <TabsTrigger value="image">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Images ({stats.images})
                    </TabsTrigger>
                  )}
                  {(!allowedTypes || allowedTypes.includes("video")) && (
                    <TabsTrigger value="video">
                      <Video className="h-4 w-4 mr-2" />
                      Videos ({stats.videos})
                    </TabsTrigger>
                  )}
                  {(!allowedTypes || allowedTypes.includes("audio")) && (
                    <TabsTrigger value="audio">
                      <Music className="h-4 w-4 mr-2" />
                      Audio ({stats.audio})
                    </TabsTrigger>
                  )}
                  {(!allowedTypes || allowedTypes.includes("pdf")) && (
                    <TabsTrigger value="pdf">
                      <FileText className="h-4 w-4 mr-2" />
                      PDFs ({stats.pdfs})
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            )}
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
                  Upload files to add them to your library
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className={`relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors ${
                      selectedItems.has(item.id) ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => toggleSelection(item)}
                  >
                    <div className="aspect-square relative bg-muted">
                      {item.type === "image" ? (
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {getMediaIcon(item.type)}
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-background">
                      <p className="text-xs truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                    </div>
                    {mode === "multiple" && (
                      <div className="absolute top-2 left-2">
                        <Checkbox checked={selectedItems.has(item.id)} />
                      </div>
                    )}
                    {selectedItems.has(item.id) && mode === "multiple" && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {Array.from(selectedItems.keys()).indexOf(item.id) + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            {mode === "multiple" && (
              <Badge variant="secondary">
                {selectedItems.size} selected
                {maxSelection && ` (max ${maxSelection})`}
              </Badge>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={selectedItems.size === 0}>
                Select {selectedItems.size > 0 && `(${selectedItems.size})`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
