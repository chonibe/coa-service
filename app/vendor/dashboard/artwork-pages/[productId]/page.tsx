"use client"

import { useState, useEffect, useCallback } from "react"
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
  Copy,
  ExternalLink,
  Upload,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { CopyContentModal } from "../components/CopyContentModal"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"

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

interface ProductData {
  id: string
  name: string
  img_url: string | null
}

interface VendorData {
  signature_url: string | null
  bio: string | null
}

export default function ArtworkPageEditor() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { toast } = useToast()

  const [product, setProduct] = useState<ProductData | null>(null)
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<"locked" | "unlocked">("unlocked")
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showContentLibrary, setShowContentLibrary] = useState(false)
  const [contentLibraryBlockId, setContentLibraryBlockId] = useState<number | null>(null)
  const [contentLibraryType, setContentLibraryType] = useState<"image" | "video" | "audio" | undefined>()
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string; hasContent: boolean }>>([])
  const [uploadingBlocks, setUploadingBlocks] = useState<Set<number>>(new Set())

  // Auto-save timer
  const autoSaveTimerRef = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vendor/artwork-pages/${productId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch artwork page data")
        }

        const data = await response.json()
        setProduct(data.product)
        setVendor(data.vendor)
        
        // Content blocks already have block_type from API
        setContentBlocks(data.contentBlocks || [])

        // Fetch available products for copy functionality
        const productsRes = await fetch("/api/vendor/artwork-pages", { credentials: "include" })
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setAvailableProducts(
            (productsData.products || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              hasContent: p.content_blocks_count > 0,
            }))
          )
        }

        // If no blocks exist, offer to apply template
        if (!data.hasTemplate && (data.contentBlocks || []).length === 0) {
          // Auto-apply template on first load
          applyTemplate()
        }
      } catch (err: any) {
        console.error("Error fetching artwork page:", err)
        setError(err.message || "Failed to load artwork page")
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchData()
    }
  }, [productId])

  // Auto-save drafts every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (contentBlocks.length > 0) {
        saveDrafts()
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [contentBlocks])

  const applyTemplate = async () => {
    try {
      const response = await fetch(`/api/vendor/artwork-pages/${productId}/apply-template`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to apply template")
      }

      // Refresh data
      const dataResponse = await fetch(`/api/vendor/artwork-pages/${productId}`, {
        credentials: "include",
      })
      if (dataResponse.ok) {
        const data = await dataResponse.json()
        setContentBlocks(data.contentBlocks || [])
        toast({
          title: "Template Applied",
          description: "Default content blocks have been created. Customize them below.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to apply template",
        variant: "destructive",
      })
    }
  }

  const saveDrafts = async () => {
    // Save all blocks as drafts (is_published = false)
    // This happens automatically in the background
    try {
      for (const block of contentBlocks) {
        await fetch(`/api/vendor/artwork-pages/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            blockId: block.id,
            ...block,
            is_published: false,
          }),
        })
      }
      setLastSaved(new Date())
    } catch (err) {
      console.error("Auto-save failed:", err)
    }
  }

  const publishChanges = async () => {
    setIsSaving(true)
    try {
      // Publish all blocks
      for (const block of contentBlocks) {
        await fetch(`/api/vendor/artwork-pages/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            blockId: block.id,
            ...block,
            is_published: true,
          }),
        })
      }

      toast({
        title: "Published",
        description: "Your artwork page is now live for collectors.",
      })
      setLastSaved(new Date())
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to publish changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addBlock = async (blockType: string) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/vendor/artwork-pages/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          blockType,
          title: "",
          description: "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to add block:", response.status, errorData)
        throw new Error(errorData.error || errorData.message || "Failed to add block")
      }

      const data = await response.json()
      console.log("Block added successfully:", data)
      
      if (!data.contentBlock) {
        throw new Error("Invalid response from server")
      }

      const newBlock = {
        ...data.contentBlock,
        block_type: data.contentBlock.block_type || blockType,
      }
      setContentBlocks([...contentBlocks, newBlock])
      setShowAddBlock(false)
      toast({
        title: "Block Added",
        description: `${blockType} block has been added.`,
      })
    } catch (err: any) {
      console.error("Error adding block:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to add block",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateBlock = async (blockId: number, updates: Partial<ContentBlock>) => {
    const updatedBlocks = contentBlocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    )
    setContentBlocks(updatedBlocks)

    // Auto-save
    try {
      await fetch(`/api/vendor/artwork-pages/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          blockId,
          ...updates,
        }),
      })
      setLastSaved(new Date())
    } catch (err) {
      console.error("Failed to update block:", err)
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
      await updateBlock(blockId, { content_url: data.url })
      
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

  const deleteBlock = async (blockId: number) => {
    if (!confirm("Are you sure you want to delete this block?")) {
      return
    }

    try {
      const response = await fetch(
        `/api/vendor/artwork-pages/${productId}?blockId=${blockId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete block")
      }

      setContentBlocks(contentBlocks.filter((block) => block.id !== blockId))
      toast({
        title: "Block Deleted",
        description: "The content block has been removed.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete block",
        variant: "destructive",
      })
    }
  }

  const publishedCount = contentBlocks.filter((b) => b.is_published).length
  const totalCount = contentBlocks.length

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

  if (error || !product) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load artwork page"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/vendor/dashboard/artwork-pages")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Artwork Pages
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
            onClick={() => router.push("/vendor/dashboard/artwork-pages")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {publishedCount} of {totalCount} blocks published
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Draft saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => setShowCopyModal(true)}
            disabled={availableProducts.filter((p) => p.id !== productId && p.hasContent).length === 0}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy from...
          </Button>
          <Button variant="outline" onClick={() => setPreviewMode(previewMode === "locked" ? "unlocked" : "locked")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview {previewMode === "locked" ? "Unlocked" : "Locked"}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/vendor/dashboard/artwork-pages/${productId}/preview`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View as Collector
          </Button>
          <Button onClick={publishChanges} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Publish Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Content Blocks</CardTitle>
            <CardDescription>Add and edit content blocks for collectors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentBlocks.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No content blocks yet</p>
                <Button onClick={applyTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Apply Template
                </Button>
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
                        {block.is_published && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        )}
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
                        {block.content_url && (
                          <div className="mt-2">
                            <Image
                              src={block.content_url}
                              alt={block.title || "Preview"}
                              width={200}
                              height={150}
                              className="rounded-md border object-cover"
                            />
                          </div>
                        )}
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
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addBlock("Artwork Text Block")
                      }}
                      disabled={isSaving}
                      type="button"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addBlock("Artwork Image Block")
                      }}
                      disabled={isSaving}
                      type="button"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addBlock("Artwork Video Block")
                      }}
                      disabled={isSaving}
                      type="button"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addBlock("Artwork Audio Block")
                      }}
                      disabled={isSaving}
                      type="button"
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
              {/* Artwork Image */}
              {product.img_url && (
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={product.img_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Artist Signature */}
              {vendor?.signature_url && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Artist Signature</h3>
                  <div className="relative h-24 bg-white dark:bg-gray-900 rounded flex items-center justify-center">
                    <Image
                      src={vendor.signature_url}
                      alt="Signature"
                      width={192}
                      height={96}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                </div>
              )}

              {/* Artist Bio */}
              {vendor?.bio && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">About the Artist</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{vendor.bio}</p>
                </div>
              )}

              {/* Content Blocks */}
              {contentBlocks
                .filter((b) => previewMode === "unlocked" ? b.is_published : true)
                .map((block) => {
                  const blockType = block.block_type || ""
                  
                  // Render actual components for better preview
                  if (blockType === "video" && block.content_url) {
                    return (
                      <VideoBlock
                        key={block.id}
                        title={block.title}
                        contentUrl={block.content_url}
                      />
                    )
                  }
                  
                  if (blockType === "audio" && block.content_url) {
                    return (
                      <AudioBlock
                        key={block.id}
                        title={block.title}
                        contentUrl={block.content_url}
                      />
                    )
                  }
                  
                  if (blockType === "image" && block.content_url) {
                    return (
                      <ImageBlock
                        key={block.id}
                        title={block.title}
                        contentUrl={block.content_url}
                        blockConfig={block.block_config}
                      />
                    )
                  }
                  
                  // Default preview for text and other blocks
                  return (
                    <div key={block.id} className="border rounded-lg p-4">
                      {block.title && <h3 className="font-semibold mb-2">{block.title}</h3>}
                      {block.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {block.description}
                        </p>
                      )}
                      {block.content_url && !["video", "audio", "image"].includes(blockType) && (
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
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Copy Content Modal */}
      <CopyContentModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onCopy={async (sourceProductId: string) => {
          try {
            const response = await fetch(`/api/vendor/artwork-pages/${productId}/copy-from`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ sourceProductId }),
            })

            if (!response.ok) {
              throw new Error("Failed to copy content")
            }

            // Refresh content blocks
            const dataResponse = await fetch(`/api/vendor/artwork-pages/${productId}`, {
              credentials: "include",
            })
            if (dataResponse.ok) {
              const data = await dataResponse.json()
              setContentBlocks(data.contentBlocks || [])
              toast({
                title: "Content Copied",
                description: "Content blocks have been copied from the source artwork.",
              })
            }
          } catch (err: any) {
            toast({
              title: "Error",
              description: err.message || "Failed to copy content",
              variant: "destructive",
            })
            throw err
          }
        }}
        currentProductId={productId}
        vendorProducts={availableProducts}
      />

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
