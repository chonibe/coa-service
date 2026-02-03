"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Save, Eye, Loader2, AlertCircle, Menu, X, ChevronLeft, ChevronRight, Trash2, GripVertical, ChevronUp, ChevronDown, Sparkles, Plus, Camera, ChevronsUp, ChevronsDown } from "lucide-react"
import { Button, Alert, AlertDescription } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"
import { BlockSelectorPills } from "@/app/artwork-editor/[productId]/components/BlockSelectorPills"

// Import desktop editor components (reuse for editing)
import SoundtrackEditor from "@/app/vendor/dashboard/artwork-pages/components/SoundtrackEditor"
import VoiceNoteRecorder from "@/app/vendor/dashboard/artwork-pages/components/VoiceNoteRecorder"
import ProcessGalleryEditor from "@/app/vendor/dashboard/artwork-pages/components/ProcessGalleryEditor"
import InspirationBoardEditor from "@/app/vendor/dashboard/artwork-pages/components/InspirationBoardEditor"
import ArtistNoteEditor from "@/app/vendor/dashboard/artwork-pages/components/ArtistNoteEditor"
import SectionGroupEditor from "@/app/vendor/dashboard/artwork-pages/components/SectionGroupEditor"
import BlockLibrarySidebar from "@/app/vendor/dashboard/artwork-pages/components/BlockLibrarySidebar"
import MapBlockEditor from "@/app/artwork-editor/[productId]/components/MapBlockEditor"

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

export default function StandaloneArtworkEditor() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { toast } = useToast()

  // State
  const [product, setProduct] = useState<ProductData | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set())
  const [isReorderMode, setIsReorderMode] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch product and blocks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const blocksResponse = await fetch(`/api/vendor/artwork-pages/${productId}`, {
          credentials: "include",
        })

        if (!blocksResponse.ok) {
          throw new Error("Failed to fetch artwork page data")
        }

        const blocksData = await blocksResponse.json()
        
        console.log("[Standalone Editor] Fetched data:", blocksData)
        
        if (blocksData.product) {
          setProduct(blocksData.product)
        }
        
        // The API returns contentBlocks, not blocks
        const blocks = blocksData.contentBlocks || blocksData.blocks || []
        console.log("[Standalone Editor] Content blocks:", blocks)
        setContentBlocks(blocks)
        
        // Auto-select first block
        if (blocks.length > 0) {
          setSelectedBlockId(blocks[0].id)
        }
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load editor")
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchData()
    }
  }, [productId])

  const selectedBlock = contentBlocks.find(b => b.id === selectedBlockId)
  
  // Debug logging for mobile
  useEffect(() => {
    if (isMobile) {
      console.log('[Mobile] Selected block ID:', selectedBlockId)
      console.log('[Mobile] Selected block:', selectedBlock)
      console.log('[Mobile] Total blocks:', contentBlocks.length)
    }
  }, [selectedBlockId, selectedBlock, contentBlocks, isMobile])

  const handleBlockUpdate = async (blockId: number, updates: Partial<ContentBlock>) => {
    // Optimistically update UI
    setContentBlocks(prev =>
      prev.map(b => b.id === blockId ? { ...b, ...updates } : b)
    )

    // Auto-save to backend
    try {
      const block = contentBlocks.find(b => b.id === blockId)
      if (!block) return

      const response = await fetch(`/api/vendor/artwork-pages/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          blockId,
          ...block,
          ...updates,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save changes")
      }

      setLastSaved(new Date())
    } catch (err: any) {
      console.error("Auto-save error:", err)
      toast({ title: "Auto-save failed", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteBlock = async (blockId: number) => {
    if (!confirm("Are you sure you want to delete this block?")) {
      return
    }

    try {
      const response = await fetch(`/api/vendor/artwork-pages/${productId}?blockId=${blockId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete block")
      }

      setContentBlocks(prev => prev.filter(b => b.id !== blockId))
      if (selectedBlockId === blockId) {
        setSelectedBlockId(null)
      }
      toast({ title: "Block deleted", description: "The block has been removed" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleMoveBlock = async (blockId: number, direction: "up" | "down") => {
    const currentIndex = contentBlocks.findIndex(b => b.id === blockId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= contentBlocks.length) return

    const newBlocks = [...contentBlocks]
    const [movedBlock] = newBlocks.splice(currentIndex, 1)
    newBlocks.splice(newIndex, 0, movedBlock)

    // Update display_order for all blocks
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      display_order: index
    }))

    setContentBlocks(reorderedBlocks)

    // Save the new order to the backend
    try {
      const response = await fetch(`/api/vendor/artwork-pages/${productId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          blockOrders: reorderedBlocks.map(b => ({ id: b.id, display_order: b.display_order }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save block order")
      }

      toast({ title: "Block moved", description: "Block order updated" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
      // Revert the change on error
      const fetchData = async () => {
        const blocksResponse = await fetch(`/api/vendor/artwork-pages/${productId}`, {
          credentials: "include",
        })
        const blocksData = await blocksResponse.json()
        setContentBlocks(blocksData.contentBlocks || [])
      }
      fetchData()
    }
  }

  const handleApplyTemplate = async (templateName: string) => {
    try {
      const response = await fetch(`/api/vendor/artwork-pages/${productId}/apply-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ templateName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to apply template")
      }

      const data = await response.json()
      if (data.contentBlocks) {
        setContentBlocks(data.contentBlocks)
        toast({ title: "Template applied", description: `The ${templateName} template has been applied` })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleAddBlock = async (blockType: string) => {
    try {
      const response = await fetch(`/api/vendor/artwork-pages/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blockType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add block")
      }

      const data = await response.json()
      if (data.contentBlock) {
        setContentBlocks(prev => [...prev, data.contentBlock])
        setSelectedBlockId(data.contentBlock.id)
        setSidebarOpen(false)
        toast({ title: "Block added", description: "Your new block has been created" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save all blocks
      await Promise.all(
        contentBlocks.map(block =>
          fetch(`/api/vendor/artwork-pages/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              blockId: block.id,
              title: block.title,
              description: block.description,
              content_url: block.content_url,
              block_config: block.block_config,
              display_order: block.display_order,
              is_published: block.is_published,
            }),
          })
        )
      )

      setLastSaved(new Date())
      toast({ title: "Saved", description: "All changes saved successfully" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    window.open(`/preview/artwork/${productId}`, "_blank")
  }

  const collapseAll = () => {
    setCollapsedBlocks(new Set(contentBlocks.map(b => b.id)))
  }

  const expandAll = () => {
    setCollapsedBlocks(new Set())
  }

  const toggleBlockCollapse = (blockId: number) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  const enterReorderMode = () => {
    setIsReorderMode(true)
    // Collapse all blocks in reorder mode for cleaner UI
    setCollapsedBlocks(new Set(contentBlocks.map(b => b.id)))
  }

  const exitReorderMode = () => {
    setIsReorderMode(false)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load editor"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/vendor/dashboard/products")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Artworks
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Top Toolbar - Minimal, flat */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/vendor/dashboard/products")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-gray-900 font-bold text-base truncate max-w-[200px]">
              {product.name}
            </h1>
            {lastSaved && (
              <p className="text-xs text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReorderMode && contentBlocks.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={collapseAll}
                title="Collapse all blocks"
              >
                <ChevronsUp className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={expandAll}
                title="Expand all blocks"
              >
                <ChevronsDown className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={enterReorderMode}
                title="Reorder blocks"
              >
                <GripVertical className="w-5 h-5" />
              </Button>
            </>
          )}
          {isReorderMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={exitReorderMode}
            >
              <X className="w-4 h-4 mr-1" />
              Exit Reorder
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreview}
            title="Preview"
          >
            <Eye className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Flat Sidebar - Desktop always visible, Mobile overlay */}
        {(!isMobile || sidebarOpen) && (
          <div
            className={`
              ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-72' : 'relative w-80'}
              bg-card border-r border-border flex flex-col
              transition-transform duration-300
              ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
            `}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-foreground font-semibold text-sm">Content Blocks</h2>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Block Library */}
            <div className="flex-1 overflow-y-auto">
              <BlockLibrarySidebar
                onAddBlock={handleAddBlock}
              />
            </div>

            {/* Collapse Button (Desktop only) */}
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-100 transition-colors shadow-sm"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Mobile Overlay Backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Editor Content - Responsive */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {isMobile ? (
            // Mobile: Pills at bottom
            <>
              {/* Mobile content area - height accounts for header (56px) + pills bar (68px) + safe area */}
              <div 
                data-mobile-content
                className="flex-1 overflow-y-auto overflow-x-hidden p-4"
                style={{ 
                  height: 'calc(100dvh - 56px - 68px - env(safe-area-inset-bottom, 0px))',
                  paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {!selectedBlock && contentBlocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Create Your Story</h3>
                      <p className="text-sm text-gray-600 mb-4">Add content that collectors will love</p>
                      <Button
                        onClick={() => setSidebarOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Block
                      </Button>
                    </div>
                  </div>
                ) : !selectedBlock ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-600 mb-4">Select a block from below to edit</p>
                  </div>
                ) : (
                  <BlockEditor
                    key={`mobile-block-${selectedBlock.id}`}
                    block={selectedBlock}
                    blockIndex={contentBlocks.findIndex(b => b.id === selectedBlock.id)}
                    totalBlocks={contentBlocks.length}
                    productId={productId}
                    onUpdate={(updates) => handleBlockUpdate(selectedBlock.id, updates)}
                    onDelete={() => handleDeleteBlock(selectedBlock.id)}
                    onMove={(direction) => handleMoveBlock(selectedBlock.id, direction)}
                  />
                )}
              </div>

              <BlockSelectorPills
                selectedBlockId={selectedBlockId}
                blocks={contentBlocks}
                onSelectBlock={(blockId) => {
                  console.log('[Mobile Pills] User tapped block ID:', blockId)
                  console.log('[Mobile Pills] Current selected ID:', selectedBlockId)
                  console.log('[Mobile Pills] Will update to:', blockId)
                  setSelectedBlockId(blockId)
                  
                  // Force scroll to top of editor content
                  const contentArea = document.querySelector('[data-mobile-content]')
                  if (contentArea) {
                    contentArea.scrollTop = 0
                  }
                }}
                onAddBlock={() => setSidebarOpen(true)}
              />
            </>
          ) : (
            // Desktop: Traditional layout
            <div className="p-6 max-w-5xl mx-auto">
              {contentBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div>
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Start Your Artwork Page</h2>
                    <p className="text-gray-600 mb-6">Choose a template to get started quickly, or add blocks manually from the sidebar.</p>
                  </div>

                  {/* Template Cards */}
                  <div className="grid grid-cols-3 gap-4 max-w-2xl">
                    <button
                      onClick={() => handleApplyTemplate("minimal")}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">Minimal</h3>
                      <p className="text-xs text-gray-600">Simple text and image blocks</p>
                    </button>
                    <button
                      onClick={() => handleApplyTemplate("story")}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">Story</h3>
                      <p className="text-xs text-gray-600">Tell your creative journey</p>
                    </button>
                    <button
                      onClick={() => handleApplyTemplate("gallery")}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">Gallery</h3>
                      <p className="text-xs text-gray-600">Showcase your process</p>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentBlocks.map((block, index) => {
                    const isCollapsed = collapsedBlocks.has(block.id)
                    return (
                      <div
                        key={block.id}
                        className={`bg-white rounded-lg border-2 ${
                          selectedBlockId === block.id ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                        } hover:border-gray-300 transition-all`}
                      >
                        {/* Block Header - Always visible */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer border-b border-gray-200"
                          onClick={() => toggleBlockCollapse(block.id)}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {block.block_type?.replace("Artwork ", "").replace(" Block", "") || "Block"}
                              </h4>
                              <p className="text-sm text-gray-500 truncate max-w-[300px]">
                                {block.title || "No title"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isReorderMode && (
                              <>
                                {/* Move buttons */}
                                {index > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMoveBlock(block.id, "up")
                                    }}
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </Button>
                                )}
                                {index < contentBlocks.length - 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMoveBlock(block.id, "down")
                                    }}
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteBlock(block.id)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Block Content - Collapsible */}
                        {!isCollapsed && !isReorderMode && (
                          <div className="p-6">
                            <BlockEditor
                              block={block}
                              blockIndex={index}
                              totalBlocks={contentBlocks.length}
                              productId={productId}
                              onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                              onDelete={() => handleDeleteBlock(block.id)}
                              onMove={(direction) => handleMoveBlock(block.id, direction)}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Block Editor Component - Adapts block data to component props
function BlockEditor({
  block,
  blockIndex,
  totalBlocks,
  productId,
  onUpdate,
  onDelete,
  onMove,
}: {
  block: ContentBlock
  blockIndex?: number
  totalBlocks?: number
  productId: string
  onUpdate: (updates: Partial<ContentBlock>) => void
  onDelete?: () => void
  onMove?: (direction: "up" | "down") => void
}) {
  const handleConfigChange = (newConfig: any) => {
    onUpdate({ block_config: newConfig })
  }

  const blockConfig = block.block_config || {}

  const renderBlockContent = () => {
    switch (block.block_type) {
    // BASIC BLOCKS
    case "Artwork Text Block":
    case "text":
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Text Block</h4>
              <p className="text-sm text-gray-500">Add paragraphs and descriptions</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Title (optional)"
            value={block.title || ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Write your content here..."
            value={block.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-none"
          />
        </div>
      )

    case "Artwork Image Block":
    case "image":
      return <ImageBlockEditor block={block} onUpdate={onUpdate} />

    case "Artwork Video Block":
    case "video":
      return <VideoBlockEditor block={block} onUpdate={onUpdate} />

    case "Artwork Audio Block":
    case "audio":
      return <AudioBlockEditor block={block} onUpdate={onUpdate} />

    // IMMERSIVE BLOCKS
    case "Soundtrack":
    case "Artwork Soundtrack Block":
      return (
        <SoundtrackEditor 
          blockId={block.id} 
          config={blockConfig}
          onChange={handleConfigChange}
        />
      )
    
    case "Voice Note":
    case "Artwork Voice Note Block":
      return (
        <VoiceNoteRecorder 
          blockId={block.id} 
          config={blockConfig}
          onChange={handleConfigChange}
        />
      )
    
    case "Process Gallery":
    case "Artwork Process Gallery Block":
      return (
        <ProcessGalleryEditor 
          blockId={block.id} 
          config={blockConfig}
          onChange={handleConfigChange}
        />
      )
    
    case "Inspiration Board":
    case "Artwork Inspiration Block":
      return (
        <InspirationBoardEditor 
          blockId={block.id} 
          config={blockConfig}
          onChange={handleConfigChange}
        />
      )
    
    case "Artist Note":
    case "Artwork Artist Note Block":
      return (
        <ArtistNoteEditor 
          blockId={block.id} 
          config={blockConfig}
          onChange={handleConfigChange}
        />
      )
    
    case "Section Group":
    case "Artwork Section Group Block":
      return (
        <SectionGroupEditor 
          blockId={block.id} 
          config={blockConfig}
          onChange={handleConfigChange}
        />
      )

    case "Location":
    case "Artwork Map Block":
      return (
        <MapBlockEditor 
          block={block}
          onUpdate={onUpdate}
        />
      )
    
    // Fallback
    default:
      return (
        <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Unknown block type: <code className="font-mono bg-yellow-100 px-2 py-1 rounded">{block.block_type}</code>
          </p>
          <p className="text-xs text-yellow-600">
            This block type is not yet supported in the editor.
          </p>
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Block Content */}
      {renderBlockContent()}
    </div>
  )
}

// Video Block Editor with Upload and Proper Embed Preview
function VideoBlockEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (updates: Partial<ContentBlock>) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoType, setVideoType] = useState<"youtube" | "vimeo" | "direct" | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect video type and generate embed URL
  useEffect(() => {
    if (!block.content_url) {
      setVideoType(null)
      setEmbedUrl(null)
      return
    }

    const url = block.content_url

    // Check for YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )
    if (youtubeMatch) {
      setVideoType("youtube")
      setEmbedUrl(`https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1&rel=0`)
      return
    }

    // Check for Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) {
      setVideoType("vimeo")
      setEmbedUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`)
      return
    }

    // Direct video file
    setVideoType("direct")
    setEmbedUrl(url)
  }, [block.content_url])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', 'video')

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          onUpdate({ content_url: response.url })
          setIsUploading(false)
          setUploadProgress(0)
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        alert('Upload failed. Please try again.')
        setIsUploading(false)
        setUploadProgress(0)
      })

      xhr.open('POST', '/api/vendor/media-library/upload')
      xhr.send(formData)
    } catch (error) {
      console.error('Video upload error:', error)
      alert('Failed to upload video')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Video Block</h4>
          <p className="text-sm text-gray-500">Upload video or paste YouTube/Vimeo URL</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={block.title || ""}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      {block.content_url && embedUrl ? (
        <div className="space-y-3">
          {/* Video Preview - Matches collector view */}
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
            {videoType === "youtube" || videoType === "vimeo" ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={embedUrl}
                controls
                className="w-full h-full"
                preload="metadata"
              />
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Change URL"
              value={block.content_url}
              onChange={(e) => onUpdate({ content_url: e.target.value })}
              className="flex-1 bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
            >
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Paste YouTube or Vimeo URL"
            value={block.content_url || ""}
            onChange={(e) => onUpdate({ content_url: e.target.value })}
            className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
          >
            {isUploading ? (
              <div>
                <Loader2 className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">Click to upload video</p>
                <p className="text-xs text-gray-500 mt-1">MP4, MOV, WebM up to 100MB</p>
              </div>
            )}
          </button>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}

// Audio Block Editor with Upload and Preview
function AudioBlockEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (updates: Partial<ContentBlock>) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', 'audio')

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          onUpdate({ content_url: response.url })
          setIsUploading(false)
          setUploadProgress(0)
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        alert('Upload failed. Please try again.')
        setIsUploading(false)
        setUploadProgress(0)
      })

      xhr.open('POST', '/api/vendor/media-library/upload')
      xhr.send(formData)
    } catch (error) {
      console.error('Audio upload error:', error)
      alert('Failed to upload audio')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Audio Block</h4>
          <p className="text-sm text-gray-500">Upload audio file</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={block.title || ""}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
      />

      {block.content_url ? (
        <div className="space-y-3">
          {/* Audio Preview */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-6">
            <audio
              src={block.content_url}
              controls
              className="w-full"
              preload="metadata"
            />
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            Replace Audio
          </Button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-pink-500 hover:bg-pink-50 transition-colors text-center"
        >
          {isUploading ? (
            <div>
              <Loader2 className="w-8 h-8 text-pink-600 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">Click to upload audio</p>
              <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A up to 50MB</p>
            </div>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}

// Image Block Editor with Upload and Preview (supports multiple images)
function ImageBlockEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (updates: Partial<ContentBlock>) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if all files are images
    const nonImageFiles = files.filter(f => !f.type.startsWith('image/'))
    if (nonImageFiles.length > 0) {
      alert('Please select only image files')
      return
    }

    // If single image, upload normally
    if (files.length === 1) {
      try {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', files[0])
        formData.append('fileType', 'image')

        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            onUpdate({ content_url: response.url })
            setIsUploading(false)
            setUploadProgress(0)
          } else {
            throw new Error('Upload failed')
          }
        })

        xhr.addEventListener('error', () => {
          alert('Upload failed. Please try again.')
          setIsUploading(false)
          setUploadProgress(0)
        })

        xhr.open('POST', '/api/vendor/media-library/upload')
        xhr.send(formData)
      } catch (error) {
        console.error('Image upload error:', error)
        alert('Failed to upload image')
        setIsUploading(false)
        setUploadProgress(0)
      }
    } else {
      // Multiple images - store in block_config.images array
      try {
        setIsUploading(true)
        const uploadedUrls: string[] = []

        for (let i = 0; i < files.length; i++) {
          const formData = new FormData()
          formData.append('file', files[i])
          formData.append('fileType', 'image')

          const response = await fetch('/api/vendor/media-library/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Failed to upload ${files[i].name}`)
          }

          const data = await response.json()
          uploadedUrls.push(data.url)
          setUploadProgress(Math.round(((i + 1) / files.length) * 100))
        }

        // Store first image as content_url, rest in config
        const existingImages = block.block_config?.images || []
        onUpdate({
          content_url: uploadedUrls[0],
          block_config: {
            ...block.block_config,
            images: [...existingImages, ...uploadedUrls],
          }
        })

        setIsUploading(false)
        setUploadProgress(0)
      } catch (error) {
        console.error('Multiple image upload error:', error)
        alert('Failed to upload images')
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const images = block.block_config?.images || (block.content_url ? [block.content_url] : [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Image Block</h4>
          <p className="text-sm text-gray-500">Upload one or multiple images</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={block.title || ""}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {images.length > 0 ? (
        <div className="space-y-3">
          {/* Image Grid Preview */}
          <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images.map((imgUrl, idx) => (
              <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={imgUrl}
                  alt={`Image ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <textarea
            placeholder="Caption (optional)"
            value={block.block_config?.caption || ""}
            onChange={(e) => onUpdate({ block_config: { ...block.block_config, caption: e.target.value } })}
            className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
            >
              Add More Images
            </Button>
            <Button
              onClick={() => onUpdate({ content_url: null, block_config: { ...block.block_config, images: [] } })}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
        >
          {isUploading ? (
            <div>
              <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">Click to upload image(s)</p>
              <p className="text-xs text-gray-500 mt-1">Select multiple files for a gallery</p>
              <p className="text-xs text-gray-500">JPG, PNG, WebP up to 10MB each</p>
            </div>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}
