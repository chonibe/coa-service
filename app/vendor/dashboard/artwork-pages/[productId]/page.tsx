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
  GripVertical,
  Check,
  X,
  Grid3x3,
  ChevronsDown,
  ChevronsUp,
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
import SectionGroupEditor from "../components/SectionGroupEditor"
import MapBlockEditor from "@/app/artwork-editor/[productId]/components/MapBlockEditor"

// Import collector preview components for preview
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"

// Import utilities
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"
import { CopyContentModal } from "../components/CopyContentModal"
import { UnlockRelationshipVisualizer } from "../components/UnlockRelationshipVisualizer"
import { uploadWithProgress } from "@/lib/artwork-blocks/upload-with-progress"
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/artwork-blocks/page-templates"
import TemplatePickerCard from "../components/TemplatePickerCard"

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
  const [seriesInfo, setSeriesInfo] = useState<{ id: string; name: string; slug: string; position: number; totalCount: number } | null>(null)
  const [unlockRelationships, setUnlockRelationships] = useState<{ unlocks: Array<{ type: string; id: string; name: string }> } | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [tempBlockOrder, setTempBlockOrder] = useState<ContentBlock[]>([])
  
  // Modals
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showContentLibrary, setShowContentLibrary] = useState(false)
  const [contentLibraryBlockId, setContentLibraryBlockId] = useState<number | null>(null)
  const [contentLibraryType, setContentLibraryType] = useState<"image" | "video" | "audio" | undefined>()
  const [contentLibraryMode, setContentLibraryMode] = useState<"single" | "gallery">("single")
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string; hasContent: boolean }>>([])
  const [uploadingBlocks, setUploadingBlocks] = useState<Set<number>>(new Set())
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})
  const [contentLibraryRefreshKey, setContentLibraryRefreshKey] = useState(0)
  const [showTemplatePicker, setShowTemplatePicker] = useState(true)

  // Debug availableProducts
  console.log("[Editor v2] availableProducts:", availableProducts, "length:", availableProducts?.length)

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
      console.log("[Editor v2] Loaded data:", data)

      // Validate contentBlocks structure
      const rawBlocks = data.contentBlocks || []
      console.log("[Editor v2] Raw contentBlocks:", rawBlocks, "length:", rawBlocks.length)

      // Check for undefined elements
      const undefinedIndices = rawBlocks.map((b: any, i: number) => b === undefined ? i : -1).filter((i: number) => i >= 0)
      if (undefinedIndices.length > 0) {
        console.error("[Editor v2] Found undefined elements at indices:", undefinedIndices)
      }

      setProduct(data.product)
      setVendor(data.vendor)
      setSeriesInfo(data.seriesInfo || null)
      setUnlockRelationships(data.unlockRelationships || null)
      const blocks = rawBlocks.filter((b: any) => b && typeof b === 'object' && b.id !== undefined)
      console.log("[Editor v2] Filtered blocks:", blocks, "filtered from", rawBlocks.length, "to", blocks.length)
      setContentBlocks(blocks)

      // Auto-expand all blocks initially
      const allBlockIds = new Set(blocks.map((b: ContentBlock) => b.id))
      console.log("[Editor v2] Block IDs:", Array.from(allBlockIds))
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

  // Click handler to add block
  const handleAddBlock = async (blockType: string) => {
    console.log("[Click] Adding new block:", blockType)
    await addBlock(blockType, contentBlocks.length) // Always add to end
  }

  // Drag and drop handler (only for reordering when in reorder mode)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return
    if (!isReorderMode) return // Only allow drag in reorder mode

    console.log("[DnD] Drag ended:", { active: active.id, over: over.id })

    // Reordering existing blocks (in memory only until approved)
    if (active.id !== over.id) {
      const oldIndex = tempBlockOrder.findIndex(b => b.id === active.id)
      const newIndex = tempBlockOrder.findIndex(b => b.id === over.id)

      console.log("[DnD] Reordering:", { oldIndex, newIndex })

      const reordered = arrayMove(tempBlockOrder, oldIndex, newIndex)
      setTempBlockOrder(reordered)
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

  // Enter reorder mode
  const enterReorderMode = () => {
    setIsReorderMode(true)
    setTempBlockOrder([...contentBlocks])
    toast({
      title: "Reorder mode",
      description: "Drag blocks to reorder, then approve changes",
    })
  }

  // Cancel reorder mode
  const cancelReorderMode = () => {
    setIsReorderMode(false)
    setTempBlockOrder([])
  }

  // Approve reorder
  const approveReorder = async () => {
    setIsSaving(true)
    await updateBlockOrder(tempBlockOrder)
    setContentBlocks(tempBlockOrder)
    setIsReorderMode(false)
    setTempBlockOrder([])
    setIsSaving(false)
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

  // Collapse all blocks
  const collapseAll = () => {
    setExpandedBlocks(new Set())
    toast({
      title: "Collapsed all blocks",
      description: "All content blocks have been collapsed",
    })
  }

  // Expand all blocks
  const expandAll = () => {
    const allBlockIds = new Set(contentBlocks.map(b => b.id))
    setExpandedBlocks(allBlockIds)
    toast({
      title: "Expanded all blocks",
      description: "All content blocks have been expanded",
    })
  }

  // Apply template (legacy - uses default template)
  const applyDefaultTemplate = async () => {
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
      setShowTemplatePicker(false)

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

  // Apply a specific page template
  const applyPageTemplate = async (template: PageTemplate) => {
    try {
      setIsSaving(true)
      setShowTemplatePicker(false)

      // Add each block from the template
      for (const templateBlock of template.blocks) {
        await fetch(`/api/vendor/artwork-pages/${productId}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockType: templateBlock.type,
            title: templateBlock.title || "",
          }),
        })
      }

      await fetchData() // Reload all data

      toast({
        title: `${template.name} template applied`,
        description: `Added ${template.blocks.length} content blocks`,
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

  // Handle file upload with progress tracking
  const handleFileUpload = async (blockId: number, file: File, blockType: string) => {
    console.log("[handleFileUpload]:", { blockId, fileName: file.name, blockType })

    try {
      setUploadingBlocks(prev => new Set([...prev, blockId]))
      setUploadProgress(prev => ({ ...prev, [blockId]: 0 }))

      const formData = new FormData()
      formData.append("file", file)
      formData.append("blockId", blockId.toString())
      formData.append("blockType", blockType)

      // Use uploadWithProgress for real-time progress tracking
      const response = await uploadWithProgress(
        `/api/vendor/artwork-pages/${productId}/upload`,
        formData,
        (percent) => {
          setUploadProgress(prev => ({ ...prev, [blockId]: percent }))
        }
      )

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
        
        // Trigger Content Library refresh
        setContentLibraryRefreshKey(prev => prev + 1)
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
      setUploadProgress(prev => {
        const next = { ...prev }
        delete next[blockId]
        return next
      })
    }
  }

  // Handle media library selection
  const handleMediaLibrarySelect = async (media: MediaItem) => {
    if (!contentLibraryBlockId) return

    try {
      // Find the block to update
      const block = contentBlocks.find(b => b.id === contentLibraryBlockId)
      
      if (contentLibraryMode === "gallery" && block) {
        // For gallery blocks, add image to the images array in block_config
        const currentConfig = block.block_config || { images: [] }
        const currentImages = currentConfig.images || []
        const newImage = {
          url: media.url,
          caption: "",
          order: currentImages.length
        }
        await updateBlock(contentLibraryBlockId, { 
          block_config: { 
            ...currentConfig, 
            images: [...currentImages, newImage] 
          } 
        })
        
        toast({
          title: "Image added",
          description: "Image added to gallery",
        })
      } else {
        // For single content blocks, set the content_url directly
        await updateBlock(contentLibraryBlockId, { content_url: media.url })
        
        toast({
          title: "Media added",
          description: "Content updated successfully",
        })
      }
      
      setShowContentLibrary(false)
      setContentLibraryBlockId(null)
      setContentLibraryMode("single")
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
              setContentLibraryMode("gallery")
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
              setContentLibraryMode("gallery")
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

      case "Artwork Map Block":
        return (
          <MapBlockEditor
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
          />
        )

      case "Artwork Section Group Block":
        // Get child blocks for this section
        const childBlocks = contentBlocks.filter(
          (b) => b.block_config?.parent_block_id === block.id
        )
        return (
          <SectionGroupEditor
            blockId={block.id}
            config={block.block_config || {}}
            childBlocks={childBlocks.map((b) => ({
              id: b.id,
              block_type: b.block_type || "",
              title: b.title,
              display_order_in_parent: b.block_config?.display_order_in_parent || 0,
            }))}
            onChange={(config) => updateBlock(block.id, { block_config: config })}
            onAddChildBlock={async (blockType) => {
              // Add a new block as a child of this section
              await addBlock(blockType)
              // Note: Parent assignment would need to be handled in the addBlock response
              toast({
                title: "Block added",
                description: "New block added to section",
              })
            }}
            onRemoveChildBlock={(childBlockId) => {
              // Remove child from section (unset parent_block_id)
              const childBlock = contentBlocks.find((b) => b.id === childBlockId)
              if (childBlock) {
                updateBlock(childBlockId, {
                  block_config: {
                    ...childBlock.block_config,
                    parent_block_id: null,
                  },
                })
              }
            }}
            onReorderChild={(childBlockId, direction) => {
              const child = childBlocks.find((b) => b.id === childBlockId)
              if (!child) return
              const currentOrder = child.block_config?.display_order_in_parent || 0
              const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1
              updateBlock(childBlockId, {
                block_config: {
                  ...child.block_config,
                  display_order_in_parent: newOrder,
                },
              })
            }}
            onSelectChildBlock={(childBlockId) => {
              // Scroll to and expand child block
              setExpandedBlocks((prev) => new Set([...prev, childBlockId]))
              setTimeout(() => {
                document.getElementById(`block-${childBlockId}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }, 100)
            }}
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
        const imageConfig = block.block_config || {}
        return (
          <div className="space-y-4">
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
                {uploadingBlocks.has(block.id) ? `${uploadProgress[block.id] || 0}%` : "Upload New"}
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

            {/* Image Preview */}
            {block.content_url && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-600">
                <Image
                  src={block.content_url}
                  alt="Preview"
                  fill
                  className={`${imageConfig.fitMode === "cover" ? "object-cover" : imageConfig.fitMode === "fill" ? "object-fill" : "object-contain"} ${imageConfig.position === "top" ? "object-top" : imageConfig.position === "bottom" ? "object-bottom" : "object-center"}`}
                />
              </div>
            )}

            {/* Display Options */}
            {block.content_url && (
              <div className="space-y-3 pt-2 border-t border-gray-700">
                <label className="text-sm font-medium text-gray-400">Display Options</label>
                
                {/* Fit Mode */}
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs text-gray-400 col-span-3">Fit Mode</label>
                  {[
                    { value: "contain", label: "Contain" },
                    { value: "cover", label: "Cover" },
                    { value: "fill", label: "Fill" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateBlock(block.id, { 
                        block_config: { ...imageConfig, fitMode: opt.value }
                      })}
                      className={`px-3 py-2 text-xs rounded-md transition-all ${
                        (imageConfig.fitMode || "contain") === opt.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Position */}
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs text-gray-400 col-span-3">Position</label>
                  {[
                    { value: "top", label: "Top" },
                    { value: "center", label: "Center" },
                    { value: "bottom", label: "Bottom" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateBlock(block.id, { 
                        block_config: { ...imageConfig, position: opt.value }
                      })}
                      className={`px-3 py-2 text-xs rounded-md transition-all ${
                        (imageConfig.position || "center") === opt.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Aspect Ratio */}
                <div className="grid grid-cols-4 gap-2">
                  <label className="text-xs text-gray-400 col-span-4">Aspect Ratio</label>
                  {[
                    { value: "video", label: "16:9" },
                    { value: "square", label: "1:1" },
                    { value: "portrait", label: "3:4" },
                    { value: "original", label: "Auto" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateBlock(block.id, { 
                        block_config: { ...imageConfig, aspectRatio: opt.value }
                      })}
                      className={`px-3 py-2 text-xs rounded-md transition-all ${
                        (imageConfig.aspectRatio || "video") === opt.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Caption */}
                <div>
                  <label className="text-xs text-gray-400">Caption (optional)</label>
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={imageConfig.caption || ""}
                    onChange={(e) => updateBlock(block.id, { 
                      block_config: { ...imageConfig, caption: e.target.value }
                    })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )

      case "Artwork Video Block":
      case "video":
        return (
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-300">Video Source</label>
            
            {/* Upload or URL options */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`video-upload-${block.id}`)?.click()}
                disabled={uploadingBlocks.has(block.id)}
                className="flex-1 bg-gray-700 border-gray-600"
              >
                {uploadingBlocks.has(block.id) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {uploadingBlocks.has(block.id) ? `Uploading ${uploadProgress[block.id] || 0}%` : "Upload Video"}
              </Button>
              <input
                id={`video-upload-${block.id}`}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(block.id, file, "video")
                  }
                  e.target.value = ""
                }}
                disabled={uploadingBlocks.has(block.id)}
                className="hidden"
              />
            </div>

            {/* Or enter URL */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or enter URL</span>
              </div>
            </div>

            <input
              type="url"
              placeholder="YouTube, Vimeo, or direct video URL"
              value={block.content_url || ""}
              onChange={(e) => updateBlock(block.id, { content_url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder:text-gray-500"
            />

            {/* Video Preview */}
            {block.content_url && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-600">
                <div className="bg-gray-900 px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Preview
                </div>
                <VideoBlock title={null} contentUrl={block.content_url} />
              </div>
            )}

            {/* Help text */}
            <p className="text-xs text-gray-500">
              Supports YouTube, Vimeo, or direct video files (MP4, WebM, MOV). Max 50MB for uploads.
            </p>
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
              {uploadingBlocks.has(block.id) ? `Uploading ${uploadProgress[block.id] || 0}%` : "Upload Audio"}
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

  const publishedCount = (contentBlocks || []).filter(b => b && typeof b === 'object' && b.is_published).length
  const totalCount = (contentBlocks || []).length

  // Debug contentBlocks
  console.log("[Editor v2] Render - contentBlocks:", contentBlocks, "publishedCount:", publishedCount, "totalCount:", totalCount)

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
            {!isReorderMode && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowCopyModal(true)}
                  disabled={(availableProducts || []).filter((p) => p && p.id !== productId && p.hasContent).length === 0}
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
                {contentBlocks.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={collapseAll}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                      title="Collapse all blocks"
                    >
                      <ChevronsUp className="h-4 w-4 mr-2" />
                      Collapse All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={expandAll}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                      title="Expand all blocks"
                    >
                      <ChevronsDown className="h-4 w-4 mr-2" />
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={enterReorderMode}
                      className="bg-gray-800 border-gray-700"
                    >
                      <GripVertical className="h-4 w-4 mr-2" />
                      Reorder
                    </Button>
                  </>
                )}
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
              </>
            )}
            {isReorderMode && (
              <>
                <Button
                  variant="outline"
                  onClick={cancelReorderMode}
                  className="bg-gray-800 border-gray-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={approveReorder} disabled={isSaving} className="bg-green-600 hover:bg-green-500">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve Order
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Main: Sidebar + Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - hide in reorder mode */}
          {!isReorderMode && <BlockLibrarySidebar onAddBlock={handleAddBlock} />}

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

              {/* Unlock Relationships Visualizer */}
              {unlockRelationships && (
                <UnlockRelationshipVisualizer unlockRelationships={unlockRelationships} />
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

              {/* Mobile Editor Banner - Only show on small screens */}
              <div className="md:hidden">
                <Alert className="bg-blue-900/30 border-blue-700">
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <strong>Mobile Tip:</strong> Try our mobile-optimized editor for a better experience on small screens
                    </div>
                    <Button
                      onClick={() => router.push(`/artwork-pages/${productId}/mobile`)}
                      size="sm"
                      className="ml-2 bg-blue-600 hover:bg-blue-700"
                    >
                      📱 Switch
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Reorder Mode Banner */}
              {isReorderMode && (
                <Alert className="bg-blue-900/30 border-blue-700">
                  <GripVertical className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Reorder Mode Active:</strong> Drag blocks to reorder them, then click "Approve Order" to save.
                  </AlertDescription>
                </Alert>
              )}

              {/* Content Blocks */}
              {contentBlocks.length === 0 ? (
                showTemplatePicker ? (
                  <TemplatePickerCard 
                    onSelectTemplate={applyPageTemplate}
                    onDismiss={() => setShowTemplatePicker(false)}
                  />
                ) : (
                  <div className="text-center py-32 bg-gray-900/30 rounded-xl border-2 border-dashed border-gray-700">
                    <Sparkles className="h-20 w-20 mx-auto text-gray-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-3">Start Building Your Story</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      Click content blocks from the sidebar to create an immersive experience for your collectors
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setShowTemplatePicker(true)} variant="outline">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Use a Template
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <SortableContext
                  items={(isReorderMode ? tempBlockOrder : contentBlocks).map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={!isReorderMode}
                >
                  <div className="space-y-6">
                    {(isReorderMode ? tempBlockOrder : contentBlocks).map((block, index) => (
                      <DraggableBlockCard
                        key={block.id}
                        block={block}
                        index={index}
                        isExpanded={!isReorderMode && expandedBlocks.has(block.id)}
                        isReorderMode={isReorderMode}
                        onToggle={() => {
                          if (isReorderMode) return
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
                        {!isReorderMode && renderEditor(block)}
                      </DraggableBlockCard>
                    ))}
                  </div>
                </SortableContext>
              )}

              {/* Inline Add Button - hidden in reorder mode */}
              {contentBlocks.length > 0 && !isReorderMode && (
                <div className="text-center pt-8">
                  <p className="text-gray-500 text-sm">
                    💡 Click more blocks from the sidebar or use quick add below
                  </p>
                  <Button
                    onClick={() => handleAddBlock("Artwork Text Block")}
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
          open={showContentLibrary}
          onOpenChange={(open) => {
            if (!open) {
              setShowContentLibrary(false)
              setContentLibraryBlockId(null)
              setContentLibraryType(undefined)
            }
          }}
          onSelect={handleMediaLibrarySelect}
          allowedTypes={contentLibraryType ? [contentLibraryType] : undefined}
          refreshKey={contentLibraryRefreshKey}
        />
      </div>
    </DndContext>
  )
}
