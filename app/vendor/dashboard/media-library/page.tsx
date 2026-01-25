"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Upload,
  Search,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Loader2,
  Grid3x3,
  List,
  Trash2,
  Download,
  Copy,
} from "lucide-react"
import { MediaGrid } from "./components/MediaGrid"
import { MediaUploader } from "./components/MediaUploader"
import { MediaDetails } from "./components/MediaDetails"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio" | "pdf">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("date_desc")
  const [showUploader, setShowUploader] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const fetchMedia = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") params.set("type", activeTab)
      if (searchQuery) params.set("search", searchQuery)
      params.set("sort", sortBy)

      const response = await fetch(`/api/vendor/media-library?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch media")
      }

      const data = await response.json()
      setMedia(data.media || [])
      setFilteredMedia(data.media || [])
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
  }, [activeTab, searchQuery, sortBy, toast])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const handleUploadComplete = () => {
    fetchMedia()
    setShowUploader(false)
    toast({
      title: "Success",
      description: "Files uploaded successfully",
    })
  }

  const handleSelectItem = (item: MediaItem) => {
    setSelectedItem(item)
  }

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === filteredMedia.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredMedia.map(item => item.id)))
    }
  }

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/vendor/media-library/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "delete",
          ids: Array.from(selectedItems),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete files")
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: `Deleted ${result.summary.successful} file(s)`,
      })

      setSelectedItems(new Set())
      setShowDeleteDialog(false)
      fetchMedia()
    } catch (error: any) {
      console.error("Error deleting files:", error)
      toast({
        title: "Error",
        description: "Failed to delete files",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    })
  }

  const stats = {
    total: media.length,
    images: media.filter(m => m.type === "image").length,
    videos: media.filter(m => m.type === "video").length,
    audio: media.filter(m => m.type === "audio").length,
    pdfs: media.filter(m => m.type === "pdf").length,
    totalSize: media.reduce((acc, m) => acc + m.size, 0),
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="container mx-auto py-4 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Media Library</h1>
        <p className="text-muted-foreground text-sm">
          Manage all your media files in one place
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <div className="bg-card p-3 rounded border shadow-sm">
          <div className="text-xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Files</div>
        </div>
        <div className="bg-card p-3 rounded border shadow-sm">
          <div className="text-xl font-bold">{stats.images}</div>
          <div className="text-xs text-muted-foreground">Images</div>
        </div>
        <div className="bg-card p-3 rounded border shadow-sm">
          <div className="text-xl font-bold">{stats.videos}</div>
          <div className="text-xs text-muted-foreground">Videos</div>
        </div>
        <div className="bg-card p-3 rounded border shadow-sm">
          <div className="text-xl font-bold">{stats.audio}</div>
          <div className="text-xs text-muted-foreground">Audio</div>
        </div>
        <div className="bg-card p-3 rounded border shadow-sm">
          <div className="text-xl font-bold">{stats.pdfs}</div>
          <div className="text-xs text-muted-foreground">PDFs</div>
        </div>
        <div className="bg-card p-3 rounded border shadow-sm">
          <div className="text-xl font-bold">{formatSize(stats.totalSize)}</div>
          <div className="text-xs text-muted-foreground">Storage Used</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="size_desc">Largest First</SelectItem>
              <SelectItem value="size_asc">Smallest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-accent" : ""}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-accent" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowUploader(!showUploader)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedItems.size > 0 && (
        <div className="mb-4 p-4 bg-accent rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedItems.size} selected</Badge>
            <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
              Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Uploader */}
      {showUploader && (
        <div className="mb-6">
          <MediaUploader onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="image">
            <ImageIcon className="h-4 w-4 mr-2" />
            Images ({stats.images})
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="h-4 w-4 mr-2" />
            Videos ({stats.videos})
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Music className="h-4 w-4 mr-2" />
            Audio ({stats.audio})
          </TabsTrigger>
          <TabsTrigger value="pdf">
            <FileText className="h-4 w-4 mr-2" />
            PDFs ({stats.pdfs})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchQuery ? "No files found matching your search" : "No media files yet. Upload some to get started!"}
              </AlertDescription>
            </Alert>
          ) : (
            <MediaGrid
              media={filteredMedia}
              viewMode={viewMode}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onToggleSelection={handleToggleSelection}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          {selectedItem && (
            <MediaDetails
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onDelete={() => {
                setSelectedItems(new Set([selectedItem.id]))
                setShowDeleteDialog(true)
              }}
              onCopyUrl={() => handleCopyUrl(selectedItem.url)}
            />
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.size} file(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The files will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
