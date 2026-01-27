"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DndContext, DragEndEvent, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import {
  Loader2,
  AlertCircle,
  Save,
  Eye,
  ArrowLeft,
  Plus,
  Sparkles,
  Copy,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Button, Alert, AlertDescription, Skeleton } from "@/components/ui"

// Import infrastructure components
import BlockLibrarySidebar from "../components/BlockLibrarySidebar"
import DraggableBlockCard from "../components/DraggableBlockCard"

// Import vendor editor components
import SoundtrackEditor from "../components/SoundtrackEditor"
import VoiceNoteRecorder from "../components/VoiceNoteRecorder"
import ProcessGalleryEditor from "../components/ProcessGalleryEditor"
import InspirationBoardEditor from "../components/InspirationBoardEditor"
import ArtistNoteEditor from "../components/ArtistNoteEditor"

// Import collector preview components for preview
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"

// Import utilities
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"
import { CopyContentModal } from "../components/CopyContentModal"

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

  // State
  const [product, setProduct] = useState<ProductData | null>(null)
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Modals
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showContentLibrary, setShowContentLibrary] = useState(false)
  const [contentLibraryBlockId, setContentLibraryBlockId] = useState<number | null>(null)
  const [contentLibraryType, setContentLibraryType] = useState<"image" | "video" | "audio" | undefined>()
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string; hasContent: boolean }>>([])
  const [uploadingBlocks, setUploadingBlocks] = useState<Set<number>>(new Set())

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  )

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [productId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/vendor/artwork-pages/${productId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to load artwork page")
      }

      const data = await response.json()
      console.log("[Editor] Loaded data:", data)
      
      setProduct(data.product)
      setVendor(data.vendor)
      setContentBlocks(data.contentBlocks || [])
      
      // Auto-expand all blocks initially
      const allBlockIds = new Set((data.contentBlocks || []).map((b: ContentBlock) => b.id))
      setExpandedBlocks(allBlockIds)
      
      // Fetch available products for copy modal
      if (data.availableProducts) {
        setAvailableProducts(data.availableProducts)
      }
    } catch (err: any) {
      console.error("[Editor] Error loading data:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Drag and drop handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    console.log("[DnD] Drag ended:", { active: active.id, over: over.id })

    // Case 1: Dragging from sidebar (new block)
    if (active.data.current?.isTemplate) {
      const blockType = active.data.current.blockType as string
      const overIndex = contentBlocks.findIndex(b => b.id === over.id)
      const insertIndex = overIndex >= 0 ? overIndex : contentBlocks.length

      console.log("[DnD] Adding new block:", { blockType, insertIndex })
      await addBlock(blockType, insertIndex)
      return
    }

    // Case 2: Reordering existing blocks
    if (active.id !== over.id) {
      const oldIndex = contentBlocks.findIndex(b => b.id === active.id)
      const newIndex = contentBlocks.findIndex(b => b.id === over.id)

      console.log("[DnD] Reordering:", { oldIndex, newIndex })

      const reordered = arrayMove(contentBlocks, oldIndex, newIndex)
      setContentBlocks(reordered)

      // Persist to database
      await updateBlockOrder(reordered)
    }
  }

  // Add block
  const addBlock = async (blockType: string, insertIndex?: number) => {
    console.log("[addBlock] Starting:", { blockType, insertIndex, currentBlockCount: contentBlocks.length })
    
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

      console.log("[addBlock] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[addBlock] Error response:", errorData)
        throw new Error(errorData.error || "Failed to add block")
      }

      const data = await response.json()
      console.log("[addBlock] Success data:", data)

      if (!data.contentBlock) {
        console.error("[addBlock] Invalid response - missing contentBlock:", data)
        throw new Error("Invalid response from server")
      }

      const newBlock: ContentBlock = {
        ...data.contentBlock,
        block_type: data.contentBlock.block_type || blockType,
      }

      console.log("[addBlock] Created block:", newBlock)

      // Insert at position
      setContentBlocks(prev => {
        const idx = insertIndex !== undefined ? insertIndex : prev.length
        const updated = [...prev.slice(0, idx), newBlock, ...prev.slice(idx)]
        console.log("[addBlock] Updated blocks:", updated.map(b => ({ id: b.id, type: b.block_type })))
        return updated
      })

      // Auto-expand new block
      setExpandedBlocks(prev => new Set([...prev, newBlock.id]))

      // Scroll to block
      setTimeout(() => {
        document.getElementById(`block-${newBlock.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 100)

      toast({
        title: "Block added",
        description: `${blockType} added successfully`,
      })

    } catch (err: any) {
      console.error("[addBlock] Caught error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to add content block",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Update block order
  const updateBlockOrder = async (orderedBlocks: ContentBlock[]) => {
    try {
      const updates = orderedBlocks.map((block, index) => ({
        id: block.id,
        display_order: index,
      }))

      console.log("[updateBlockOrder] Updating:", updates)

      await fetch(`/api/vendor/artwork-pages/${productId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ updates }),
      })

      toast({
        title: "Order updated",
        description: "Block order saved",
      })
    } catch (err) {
      console.error("[updateBlockOrder] Error:", err)
      toast({
        title: "Error",
        description: "Failed to save new order",
        variant: "destructive",
      })
    }
  }

  // Update block content
  const updateBlock = async (blockId: number, updates: Partial<ContentBlock>) => {
    try {
      const response = await fetch(`/api/vendor/artwork-pages/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blockId, ...updates }),
      })

      if (!response.ok) {
        throw new Error("Failed to update block")
      }

      setContentBlocks(prev =>
        prev.map(b => (b.id === blockId ? { ...b, ...updates } : b))
      )

      setLastSaved(new Date())
    } catch (err) {
      console.error("[updateBlock] Error:", err)
    }
  }

  // Delete block
  const deleteBlock = async (blockId: number) => {
    if (!confirm("Delete this block? This cannot be undone.")) return

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

      setContentBlocks(prev => prev.filter(b => b.id !== blockId))
      
      toast({
        title: "Block deleted",
        description: "Content block removed successfully",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete block",
        variant: "destructive",
      })
    }
  }

  // Publish changes
  const publishChanges = async () => {
    try {
      setIsSaving(true)

      // Mark all blocks as published
      for (const block of contentBlocks) {
        if (!block.is_published) {
          await updateBlock(block.id, { is_published: true })
        }
      }

      toast({
        title: "Published!",
        description: "Changes are now live for collectors",
      })
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

  // Apply template
  const applyTemplate = async () => {
    try {
      setIsSaving(true)

      const response = await fetch(
        `/api/vendor/artwork-pages/${productId}/apply-template`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to apply template")
      }

      await fetchData() // Reload all data

      toast({
        title: "Template applied",
        description: "Default content blocks added",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to apply template",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (blockId: number, file: File, blockType: string) => {
    console.log("[handleFileUpload]:", { blockId, fileName: file.name, blockType })

    try {
      setUploadingBlocks(prev => new Set([...prev, blockId]))

      const formData = new FormData()
      formData.append("file", file)
      formData.append("blockId", blockId.toString())
      formData.append("blockType", blockType)

      const response = await fetch(`/api/vendor/artwork-pages/${productId}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      
      if (data.fileUrl) {
        // Update block with new content URL
        if (blockType === "signature") {
          await updateBlock(blockId, {
            block_config: {
              ...contentBlocks.find(b => b.id === blockId)?.block_config,
              signature_url: data.fileUrl,
            },
          })
        } else {
          await updateBlock(blockId, { content_url: data.fileUrl })
        }

        toast({
          title: "Upload successful",
          description: `${blockType} uploaded`,
        })
      }
    } catch (err: any) {
      console.error("[handleFileUpload] Error:", err)
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setUploadingBlocks(prev => {
        const next = new Set(prev)
        next.delete(blockId)
        return next
      })
    }
  }

  // Handle media library selection
  const handleMediaLibrarySelect = async (media: MediaItem) => {
    if (!contentLibraryBlockId) return

    try {
      await updateBlock(contentLibraryBlockId, { content_url: media.url })
      setShowContentLibrary(false)
      setContentLibraryBlockId(null)

      toast({
        title: "Media added",
        description: "Content updated successfully",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Render editor component for block
  const renderEditor = (block: ContentBlock) => {
    const blockType = block.block_type || ""

    switch (blockType) {
      case "Artwork Soundtrack Block":
        return (
          <SoundtrackEditor
            blockId={block.id}
            config={block.block_config || {}}
            onChange={(config) => updateBlock(block.id, { block_config: config })}
          />
        )

      case "Artwork Voice Note Block":
        return (
          <VoiceNoteRecorder
            title={block.title}
            contentUrl={block.content_url || undefined}
            transcript={block.block_config?.transcript}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onFileUpload={(file, type) => handleFileUpload(block.id, file, type)}
          />
        )

      case "Artwork Process Gallery Block":
        return (
          <ProcessGalleryEditor
            blockId={block.id}
            config={block.block_config || { images: [] }}
            onChange={(config) => updateBlock(block.id, { block_config: config })}
            onImageUpload={() => {
              setContentLibraryBlockId(block.id)
              setContentLibraryType("image")
              setShowContentLibrary(true)
            }}
          />
        )

      case "Artwork Inspiration Block":
        return (
          <InspirationBoardEditor
            blockId={block.id}
            config={block.block_config || { images: [] }}
            onChange={(config) => updateBlock(block.id, { block_config: config })}
            onImageUpload={() => {
              setContentLibraryBlockId(block.id)
              setContentLibraryType("image")
              setShowContentLibrary(true)
            }}
          />
        )

      case "Artwork Artist Note Block":
        return (
          <ArtistNoteEditor
            content={block.description || ""}
            signatureUrl={block.block_config?.signature_url}
            onUpdate={(updates) => {
              if (updates.content !== undefined) {
                updateBlock(block.id, { description: updates.content })
              }
              if (updates.signature_url !== undefined) {
                updateBlock(block.id, {
                  block_config: {
                    ...block.block_config,
                    signature_url: updates.signature_url,
                  },
                })
              }
            }}
            onFileUpload={(file, type) => handleFileUpload(block.id, file, type)}
          />
        )

      // Old block types - keep basic editors
      case "Artwork Text Block":
      case "text":
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Content</label>
            <textarea
              placeholder="Share the inspiration, process, or meaning..."
              value={block.description || ""}
              onChange={(e) => updateBlock(block.id, { description: e.target.value })}
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-md min-h-[200px] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              maxLength={2000}
            />
          </div>
        )

      case "Artwork Image Block":
      case "image":
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Image Source</label>
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
                className="flex-1 bg-gray-700 border-gray-600"
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
                className="flex-1 bg-gray-700 border-gray-600"
              >
                {uploadingBlocks.has(block.id) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Upload New
              </Button>
              <input
                id={`image-upload-${block.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(block.id, file, "image")
                  }
                  e.target.value = ""
                }}
                disabled={uploadingBlocks.has(block.id)}
                className="hidden"
              />
            </div>
            {block.content_url && (
              <div className="relative w-full aspect-video rounded overflow-hidden mt-3">
                <Image
                  src={block.content_url}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )

      case "Artwork Video Block":
      case "video":
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Video URL</label>
            <input
              type="url"
              placeholder="YouTube, Vimeo, or direct URL"
              value={block.content_url || ""}
              onChange={(e) => updateBlock(block.id, { content_url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
            {block.content_url && (
              <div className="mt-3">
                <VideoBlock title={block.title} contentUrl={block.content_url} />
              </div>
            )}
          </div>
        )

      case "Artwork Audio Block":
      case "audio":
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Audio Source</label>
            <Button
              onClick={() => document.getElementById(`audio-upload-${block.id}`)?.click()}
              variant="outline"
              disabled={uploadingBlocks.has(block.id)}
              className="w-full bg-gray-700 border-gray-600"
            >
              {uploadingBlocks.has(block.id) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
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
                  handleFileUpload(block.id, file, "audio")
                }
                e.target.value = ""
              }}
              disabled={uploadingBlocks.has(block.id)}
              className="hidden"
            />
            {block.content_url && (
              <div className="mt-3">
                <AudioBlock title={block.title} contentUrl={block.content_url} />
              </div>
            )}
          </div>
        )

      default:
        return (
          <textarea
            placeholder="Content..."
            value={block.description || ""}
            onChange={(e) => updateBlock(block.id, { description: e.target.value })}
            className="w-full p-4 bg-gray-700 border border-gray-600 rounded-md min-h-[120px] text-white"
          />
        )
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="flex gap-6">
          <Skeleton className="w-[280px] h-screen" />
          <div className="flex-1 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
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

  const publishedCount = (contentBlocks || []).filter(b => b.is_published).length
  const totalCount = (contentBlocks || []).length

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/vendor/dashboard/artwork-pages")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{product?.name || 'Loading...'}</h1>
              <p className="text-sm text-gray-400">
                {publishedCount} of {totalCount} blocks published
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => setShowCopyModal(true)}
              disabled={(availableProducts || []).filter((p) => p.id !== productId && p.hasContent).length === 0}
              className="bg-gray-800 border-gray-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy from...
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/vendor/dashboard/artwork-pages/${productId}/preview`, "_blank")}
              className="bg-gray-800 border-gray-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={publishChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-500">
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
        </header>

        {/* Main: Sidebar + Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <BlockLibrarySidebar />

          {/* Canvas */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Hero Preview */}
              {product.img_url && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src={product.img_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Progress */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Your Collector Experience</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {publishedCount} of {totalCount} sections complete
                  </p>
                </div>
                <div className="h-3 w-64 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${totalCount > 0 ? (publishedCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Content Blocks */}
              {contentBlocks.length === 0 ? (
                <div className="text-center py-32 bg-gray-900/30 rounded-xl border-2 border-dashed border-gray-700">
                  <Sparkles className="h-20 w-20 mx-auto text-gray-600 mb-6" />
                  <h3 className="text-2xl font-bold mb-3">Start Building Your Story</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Drag content blocks from the sidebar to create an immersive experience for your collectors
                  </p>
                  <Button onClick={applyTemplate} size="lg" className="bg-blue-600 hover:bg-blue-500">
                    <Plus className="h-5 w-5 mr-2" />
                    Apply Default Template
                  </Button>
                </div>
              ) : (
                <SortableContext
                  items={contentBlocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6">
                    {contentBlocks.map((block, index) => (
                      <DraggableBlockCard
                        key={block.id}
                        block={block}
                        index={index}
                        isExpanded={expandedBlocks.has(block.id)}
                        onToggle={() => {
                          setExpandedBlocks(prev => {
                            const next = new Set(prev)
                            if (next.has(block.id)) {
                              next.delete(block.id)
                            } else {
                              next.add(block.id)
                            }
                            return next
                          })
                        }}
                        onDelete={() => deleteBlock(block.id)}
                      >
                        {renderEditor(block)}
                      </DraggableBlockCard>
                    ))}
                  </div>
                </SortableContext>
              )}

              {/* Inline Add Button */}
              {contentBlocks.length > 0 && (
                <div className="text-center pt-8">
                  <p className="text-gray-500 text-sm">
                    💡 Drag more blocks from the sidebar or click below
                  </p>
                  <Button
                    onClick={() => addBlock("Artwork Text Block")}
                    variant="outline"
                    className="mt-4 bg-gray-800 border-dashed border-2 border-gray-700 hover:border-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Add Text Block
                  </Button>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modals */}
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

              await fetchData()
              setShowCopyModal(false)

              toast({
                title: "Content copied",
                description: "Content blocks copied successfully",
              })
            } catch (err: any) {
              toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
              })
            }
          }}
          productId={productId}
          availableProducts={availableProducts}
        />

        <MediaLibraryModal
          isOpen={showContentLibrary}
          onClose={() => {
            setShowContentLibrary(false)
            setContentLibraryBlockId(null)
            setContentLibraryType(undefined)
          }}
          onSelect={handleMediaLibrarySelect}
          type={contentLibraryType}
        />
      </div>
    </DndContext>
  )
}
