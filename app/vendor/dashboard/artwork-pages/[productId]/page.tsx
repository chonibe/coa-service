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
  Mic,
  Camera,
  Lightbulb,
  PenTool,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { CopyContentModal } from "../components/CopyContentModal"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"

// Import new immersive editor components
import SoundtrackEditor from "../components/SoundtrackEditor"
import VoiceNoteRecorder from "../components/VoiceNoteRecorder"
import ProcessGalleryEditor from "../components/ProcessGalleryEditor"
import InspirationBoardEditor from "../components/InspirationBoardEditor"
import ArtistNoteEditor from "../components/ArtistNoteEditor"

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
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-12">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/vendor/dashboard/artwork-pages")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Artworks
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{product.name}</h1>
            <p className="text-gray-400 text-sm mt-2">
              Building the collector experience by Artist Name
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Draft saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => setShowCopyModal(true)}
            disabled={availableProducts.filter((p) => p.id !== productId && p.hasContent).length === 0}
            className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Content
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/collector/artwork/${productId}/preview`, "_blank")}
            className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={publishChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
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

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Hero Section Preview */}
        {product.img_url && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
            <Image
              src={product.img_url}
              alt={product.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
              <h2 className="text-4xl font-extrabold text-white leading-tight">{product.name}</h2>
              {/* Edition display placeholder */}
              <Badge className="ml-4 bg-white/20 text-white">Edition 12/50</Badge>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {/* This will be replaced by BuilderProgress component */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Collector Experience</h2>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full"
              style={{ width: `${(publishedCount / totalCount) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400">
            {publishedCount} of {totalCount} sections complete. Add more content for a richer experience.
          </p>
        </div>

        {/* Content Blocks Editor */}
        <div className="space-y-8">
          {contentBlocks.length === 0 ? (
            <div className="text-center py-24 bg-gray-800 rounded-lg">
              <Sparkles className="h-16 w-16 mx-auto text-gray-500 mb-6" />
              <p className="text-gray-300 text-lg mb-6">No content sections yet. Start building your story!</p>
              <Button onClick={applyTemplate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Apply Default Template
              </Button>
            </div>
          ) : (
            <>
              {contentBlocks.map((block) => {
                const blockType = block.block_type || ""
                
                return (
                  <div key={block.id} className="bg-gray-800 rounded-lg p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-gray-500" />
                        <span className="text-lg font-semibold text-white">{block.title || blockType || "Untitled Block"}</span>
                        {block.is_published && (
                          <Badge className="bg-green-500 text-white px-3 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteBlock(block.id)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* Render appropriate editor based on block type */}
                    {(() => {
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
                              contentUrl={block.content_url}
                              transcript={block.block_config?.transcript}
                              onUpdate={(updates) => updateBlock(block.id, updates)}
                              onFileUpload={(file, type) => handleFileUpload(block.id, file, type)}
                            />
                          )
                        
                        case "Artwork Process Gallery Block":
                          return (
                            <ProcessGalleryEditor
                              blockId={block.id}
                              config={block.block_config || {}}
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
                              config={block.block_config || {}}
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
                                      signature_url: updates.signature_url 
                                    } 
                                  })
                                }
                              }}
                              onFileUpload={(file, type) => handleFileUpload(block.id, file, type)}
                            />
                          )
                        
                        default:
                          // Generic editor for other block types
                          return (
                            <textarea
                              placeholder="Content..."
                              value={block.description || ""}
                              onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                              className="w-full p-4 bg-gray-700 rounded-md min-h-[120px] text-gray-200 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              maxLength={2000}
                            />
                          )
                      }
                    })()}
                  </div>
                )
              })}
            </>
          )}

          <div className="text-center">
            <Button
              variant="outline"
              className="w-full max-w-xs bg-gray-800 text-white hover:bg-gray-700 border-gray-700 py-3 text-lg"
              onClick={() => setShowAddBlock(true)}
            >
              <Plus className="h-5 w-5 mr-3" />
              Add New Section
            </Button>
          </div>

          {showAddBlock && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-lg p-8 shadow-2xl w-full max-w-md space-y-6">
                <h3 className="text-2xl font-bold text-white text-center">Add Content Section</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Text Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gray-800 text-white hover:bg-gray-700 border-gray-700 text-base"
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Image Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gray-800 text-white hover:bg-gray-700 border-gray-700 text-base"
                  >
                    <ImageIcon className="h-6 w-6 mb-2" />
                    Image
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Video Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gray-800 text-white hover:bg-gray-700 border-gray-700 text-base"
                  >
                    <Video className="h-6 w-6 mb-2" />
                    Video
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Audio Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gray-800 text-white hover:bg-gray-700 border-gray-700 text-base"
                  >
                    <Music className="h-6 w-6 mb-2" />
                    Audio
                  </Button>
                  {/* New immersive blocks */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Soundtrack Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gradient-to-br from-green-900/20 to-gray-800 text-white hover:from-green-800/30 hover:to-gray-700 border-green-700/30 text-base"
                  >
                    <Music className="h-6 w-6 mb-2 text-green-400" />
                    Soundtrack
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Voice Note Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gradient-to-br from-purple-900/20 to-gray-800 text-white hover:from-purple-800/30 hover:to-gray-700 border-purple-700/30 text-base"
                  >
                    <Mic className="h-6 w-6 mb-2 text-purple-400" />
                    Voice Note
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Process Gallery Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gradient-to-br from-blue-900/20 to-gray-800 text-white hover:from-blue-800/30 hover:to-gray-700 border-blue-700/30 text-base"
                  >
                    <Camera className="h-6 w-6 mb-2 text-blue-400" />
                    Process Gallery
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Inspiration Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gradient-to-br from-yellow-900/20 to-gray-800 text-white hover:from-yellow-800/30 hover:to-gray-700 border-yellow-700/30 text-base"
                  >
                    <Lightbulb className="h-6 w-6 mb-2 text-yellow-400" />
                    Inspiration Board
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addBlock("Artwork Artist Note Block"); }}
                    disabled={isSaving}
                    type="button"
                    className="flex flex-col items-center justify-center h-28 bg-gradient-to-br from-amber-900/20 to-gray-800 text-white hover:from-amber-800/30 hover:to-gray-700 border-amber-700/30 text-base"
                  >
                    <PenTool className="h-6 w-6 mb-2 text-amber-400" />
                    Artist Note
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowAddBlock(false)}
                  className="w-full mt-4 text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
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
