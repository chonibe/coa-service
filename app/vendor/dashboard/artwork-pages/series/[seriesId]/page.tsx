"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"



import { Skeleton } from "@/components/ui"

import { Separator } from "@/components/ui"
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Eye,
  ArrowLeft,
  Plus,
  GripVertical,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Sparkles,
  Upload,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription } from "@/components/ui"
interface ContentBlock {
  id: number
  benefit_type_id: number
  title: string
  description: string | null
  content_url: string | null
  block_config: any
  display_order: number
  is_published: boolean
  block_type?: string
}

interface SeriesData {
  id: string
  name: string
}

export default function SeriesTemplateEditor() {
  const params = useParams()
  const router = useRouter()
  const seriesId = params.seriesId as string
  const { toast } = useToast()

  const [series, setSeries] = useState<SeriesData | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<"locked" | "unlocked">("unlocked")
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [showContentLibrary, setShowContentLibrary] = useState(false)
  const [contentLibraryBlockId, setContentLibraryBlockId] = useState<number | null>(null)
  const [contentLibraryType, setContentLibraryType] = useState<"image" | "video" | "audio" | undefined>()
  const [uploadingBlocks, setUploadingBlocks] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [seriesRes, blocksRes] = await Promise.all([
          fetch(`/api/vendor/series/${seriesId}`, { credentials: "include" }),
          fetch(`/api/vendor/artwork-pages/series/${seriesId}`, { credentials: "include" }),
        ])

        if (!seriesRes.ok) {
          throw new Error("Failed to fetch series data")
        }

        const seriesData = await seriesRes.json()
        setSeries(seriesData.series)

        if (blocksRes.ok) {
          const blocksData = await blocksRes.json()
          setContentBlocks(blocksData.contentBlocks || [])
        }
      } catch (err: any) {
        console.error("Error fetching series template:", err)
        setError(err.message || "Failed to load series template")
      } finally {
        setIsLoading(false)
      }
    }

    if (seriesId) {
      fetchData()
    }
  }, [seriesId])

  const saveTemplate = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/vendor/artwork-pages/series/${seriesId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          blocks: contentBlocks,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save template")
      }

      toast({
        title: "Template Saved",
        description: "Series template has been saved. All artworks in this series will inherit this content.",
      })
      setLastSaved(new Date())
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addBlock = async (blockType: string) => {
    try {
      // Get benefit type ID from API
      const typesResponse = await fetch(`/api/benefits/types`, { credentials: "include" })
      if (!typesResponse.ok) throw new Error("Failed to fetch benefit types")
      const typesData = await typesResponse.json()
      const benefitType = typesData.types?.find((t: any) => t.name === blockType)

      if (!benefitType) {
        throw new Error("Invalid block type")
      }

      const maxOrder = contentBlocks.length > 0
        ? Math.max(...contentBlocks.map((b) => b.display_order || 0))
        : -1

      const newBlock: ContentBlock = {
        id: Date.now(), // Temporary ID for UI
        benefit_type_id: benefitType.id,
        title: "",
        description: "",
        content_url: null,
        block_config: {},
        display_order: maxOrder + 1,
        is_published: true,
        block_type: blockType,
      }

      setContentBlocks([...contentBlocks, newBlock])
      setShowAddBlock(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add block",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (blockId: number, file: File, blockType: string) => {
    try {
      setUploadingBlocks((prev) => new Set(prev).add(blockId))
      
      // Determine file type for upload API
      let uploadType = "image"
      if (blockType === "Artwork Video Block" || blockType === "video") {
        uploadType = "video"
      } else if (blockType === "Artwork Audio Block" || blockType === "audio") {
        uploadType = "audio"
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", uploadType)

      const response = await fetch("/api/vendor/products/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to upload file")
      }

      const data = await response.json()
      
      // Update the block with the uploaded URL
      updateBlock(blockId, { content_url: data.url })
      
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
      })
    } catch (err: any) {
      console.error("Error uploading file:", err)
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploadingBlocks((prev) => {
        const next = new Set(prev)
        next.delete(blockId)
        return next
      })
    }
  }

  const updateBlock = (blockId: number, updates: Partial<ContentBlock>) => {
    const updatedBlocks = contentBlocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    )
    setContentBlocks(updatedBlocks)
    setLastSaved(new Date())
  }

  const deleteBlock = (blockId: number) => {
    if (!confirm("Are you sure you want to delete this block?")) {
      return
    }
    setContentBlocks(contentBlocks.filter((block) => block.id !== blockId))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load series template"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/vendor/dashboard/series/${seriesId}`)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Series
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/vendor/dashboard/series/${seriesId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Series Template: {series.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Content blocks that all artworks in this series will inherit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" onClick={() => setPreviewMode(previewMode === "locked" ? "unlocked" : "locked")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview {previewMode === "locked" ? "Unlocked" : "Locked"}
          </Button>
          <Button onClick={saveTemplate} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This template will be inherited by all artworks in the "{series.name}" series. Individual artworks can override this template with their own content.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Content Blocks</CardTitle>
            <CardDescription>Add content blocks for the series template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentBlocks.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No content blocks yet</p>
              </div>
            ) : (
              <>
                {contentBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{block.block_type || "text"}</Badge>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBlock(block.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <input
                      type="text"
                      placeholder="Block title (optional)"
                      value={block.title || ""}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <textarea
                      placeholder="Content..."
                      value={block.description || ""}
                      onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                      maxLength={2000}
                    />
                    {(block.block_type === "Artwork Image Block" || block.block_type === "image") && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium block">Image Source</label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setContentLibraryBlockId(block.id)
                              setContentLibraryType("image")
                              setShowContentLibrary(true)
                            }}
                            className="flex-1"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Choose from Library
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`image-upload-${block.id}`)?.click()}
                            disabled={uploadingBlocks.has(block.id)}
                            className="flex-1"
                          >
                            {uploadingBlocks.has(block.id) ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploadingBlocks.has(block.id) ? "Uploading..." : "Upload Image"}
                          </Button>
                          <input
                            id={`image-upload-${block.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(block.id, file, block.block_type || "image")
                              }
                              e.target.value = "" // Reset for re-upload
                            }}
                            disabled={uploadingBlocks.has(block.id)}
                            className="hidden"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">OR enter URL</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={block.content_url || ""}
                          onChange={(e) => updateBlock(block.id, { content_url: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    )}
                    {(block.block_type === "Artwork Video Block" || block.block_type === "video") && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium block">Video Source</label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setContentLibraryBlockId(block.id)
                              setContentLibraryType("video")
                              setShowContentLibrary(true)
                            }}
                            className="flex-1"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Choose from Library
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`video-upload-${block.id}`)?.click()}
                            disabled={uploadingBlocks.has(block.id)}
                            className="flex-1"
                          >
                            {uploadingBlocks.has(block.id) ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploadingBlocks.has(block.id) ? "Uploading..." : "Upload Video"}
                          </Button>
                          <input
                            id={`video-upload-${block.id}`}
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(block.id, file, block.block_type || "video")
                              }
                              e.target.value = "" // Reset for re-upload
                            }}
                            disabled={uploadingBlocks.has(block.id)}
                            className="hidden"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">OR enter URL</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <input
                          type="url"
                          placeholder="YouTube, Vimeo, or direct video URL"
                          value={block.content_url || ""}
                          onChange={(e) => updateBlock(block.id, { content_url: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    )}
                    {(block.block_type === "Artwork Audio Block" || block.block_type === "audio") && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium block">Audio Source</label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setContentLibraryBlockId(block.id)
                              setContentLibraryType("audio")
                              setShowContentLibrary(true)
                            }}
                            className="flex-1"
                          >
                            <Music className="h-4 w-4 mr-2" />
                            Choose from Library
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`audio-upload-${block.id}`)?.click()}
                            disabled={uploadingBlocks.has(block.id)}
                            className="flex-1"
                          >
                            {uploadingBlocks.has(block.id) ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploadingBlocks.has(block.id) ? "Uploading..." : "Upload Audio"}
                          </Button>
                          <input
                            id={`audio-upload-${block.id}`}
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(block.id, file, block.block_type || "audio")
                              }
                              e.target.value = "" // Reset for re-upload
                            }}
                            disabled={uploadingBlocks.has(block.id)}
                            className="hidden"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">OR enter URL</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <input
                          type="url"
                          placeholder="Audio file URL or SoundCloud link"
                          value={block.content_url || ""}
                          onChange={(e) => updateBlock(block.id, { content_url: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            <Separator />

            <div className="relative">
              {showAddBlock ? (
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Add Content Block</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock("Artwork Text Block")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock("Artwork Image Block")}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock("Artwork Video Block")}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock("Artwork Audio Block")}
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Audio
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddBlock(false)}
                    className="w-full mt-2"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddBlock(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              {previewMode === "locked"
                ? "How collectors see it before authentication"
                : "How collectors see it after authentication"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`space-y-6 ${previewMode === "locked" ? "blur-sm" : ""}`}>
              {/* Content Blocks */}
              {contentBlocks.map((block) => (
                <div key={block.id} className="border rounded-lg p-4">
                  {block.title && <h3 className="font-semibold mb-2">{block.title}</h3>}
                  {block.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {block.description}
                    </p>
                  )}
                  {block.content_url && (
                    <div className="mt-2">
                      <a
                        href={block.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Content →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Library Modal */}
      <MediaLibraryModal
        open={showContentLibrary}
        onOpenChange={setShowContentLibrary}
        onSelect={(media) => {
          const selectedMedia = Array.isArray(media) ? media[0] : media
          if (contentLibraryBlockId !== null) {
            updateBlock(contentLibraryBlockId, { content_url: selectedMedia.url })
            toast({
              title: "Media Selected",
              description: "Media has been added to this block.",
            })
          }
        }}
        mode="single"
        allowedTypes={contentLibraryType ? [contentLibraryType] : undefined}
        title="Select Media for Content Block"
      />
    </div>
  )
}
