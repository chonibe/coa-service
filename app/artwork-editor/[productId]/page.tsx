"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Loader2, AlertCircle, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button, Alert, AlertDescription } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"
import { BlockSelectorPills } from "./components/BlockSelectorPills"

// Import desktop editor components (reuse for editing)
import SoundtrackEditor from "../../vendor/dashboard/artwork-pages/components/SoundtrackEditor"
import VoiceNoteRecorder from "../../vendor/dashboard/artwork-pages/components/VoiceNoteRecorder"
import ProcessGalleryEditor from "../../vendor/dashboard/artwork-pages/components/ProcessGalleryEditor"
import InspirationBoardEditor from "../../vendor/dashboard/artwork-pages/components/InspirationBoardEditor"
import ArtistNoteEditor from "../../vendor/dashboard/artwork-pages/components/ArtistNoteEditor"
import SectionGroupEditor from "../../vendor/dashboard/artwork-pages/components/SectionGroupEditor"
import BlockLibrarySidebar from "../../vendor/dashboard/artwork-pages/components/BlockLibrarySidebar"

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
        
        if (blocksData.product) {
          setProduct(blocksData.product)
        }
        
        setContentBlocks(blocksData.blocks || [])
        
        // Auto-select first block
        if (blocksData.blocks && blocksData.blocks.length > 0) {
          setSelectedBlockId(blocksData.blocks[0].id)
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

  const handleBlockUpdate = (blockId: number, updates: Partial<ContentBlock>) => {
    setContentBlocks(prev =>
      prev.map(b => b.id === blockId ? { ...b, ...updates } : b)
    )
  }

  const handleAddBlock = (blockData: Partial<ContentBlock>) => {
    fetch(`/api/vendor/artwork-pages/${productId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(blockData),
    })
      .then(res => res.json())
      .then(data => {
        if (data.block) {
          setContentBlocks(prev => [...prev, data.block])
          setSelectedBlockId(data.block.id)
          setSidebarOpen(false)
          toast({ title: "Block added", description: "Your new block has been created" })
        }
      })
      .catch(err => {
        toast({ title: "Error", description: err.message, variant: "destructive" })
      })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save all blocks
      await Promise.all(
        contentBlocks.map(block =>
          fetch(`/api/vendor/artwork-pages/${productId}/blocks/${block.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(block),
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
    window.open(`/vendor/dashboard/artwork-pages/${productId}/preview`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load editor"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/vendor/dashboard/artwork-pages")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Artwork List
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Top Toolbar - Minimal, flat */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/vendor/dashboard/artwork-pages")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-white font-bold text-base truncate max-w-[200px]">
              {product.name}
            </h1>
            {lastSaved && (
              <p className="text-xs text-gray-400">
                Saved {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreview}
            className="text-white hover:bg-gray-800"
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
              bg-gray-950 border-r border-gray-800 flex flex-col
              transition-transform duration-300
              ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
            `}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-white font-semibold text-sm">Content Blocks</h2>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Block Library */}
            <div className="flex-1 overflow-y-auto">
              <BlockLibrarySidebar
                productId={productId}
                onBlockAdded={handleAddBlock}
              />
            </div>

            {/* Collapse Button (Desktop only) */}
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-full p-1 hover:bg-gray-700 transition-colors"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-4 h-4 text-white" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white" />
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
        <div className="flex-1 overflow-y-auto bg-gray-950">
          {isMobile ? (
            // Mobile: Pills at bottom
            <>
              <div className="h-[calc(100vh-120px)] overflow-y-auto p-4">
                {!selectedBlock ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-400 mb-4">Select a block or add a new one</p>
                  </div>
                ) : (
                  <BlockEditor
                    block={selectedBlock}
                    productId={productId}
                    onUpdate={(updates) => handleBlockUpdate(selectedBlock.id, updates)}
                  />
                )}
              </div>

              <BlockSelectorPills
                selectedBlockId={selectedBlockId}
                blocks={contentBlocks}
                onSelectBlock={setSelectedBlockId}
                onAddBlock={() => setSidebarOpen(true)}
              />
            </>
          ) : (
            // Desktop: Traditional layout
            <div className="p-6 max-w-5xl mx-auto">
              {contentBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-gray-400 mb-4">No blocks yet. Add your first block from the sidebar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentBlocks.map(block => (
                    <div
                      key={block.id}
                      className={`bg-gray-900 rounded-lg border ${
                        selectedBlockId === block.id ? 'border-blue-500' : 'border-gray-800'
                      }`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="p-4">
                        <BlockEditor
                          block={block}
                          productId={productId}
                          onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Block Editor Component
function BlockEditor({
  block,
  productId,
  onUpdate,
}: {
  block: ContentBlock
  productId: string
  onUpdate: (updates: Partial<ContentBlock>) => void
}) {
  switch (block.block_type) {
    case "Soundtrack":
      return <SoundtrackEditor block={block} productId={productId} onUpdate={onUpdate} />
    case "Voice Note":
      return <VoiceNoteRecorder block={block} productId={productId} onUpdate={onUpdate} />
    case "Process Gallery":
      return <ProcessGalleryEditor block={block} productId={productId} onUpdate={onUpdate} />
    case "Inspiration Board":
      return <InspirationBoardEditor block={block} productId={productId} onUpdate={onUpdate} />
    case "Artist Note":
      return <ArtistNoteEditor block={block} productId={productId} onUpdate={onUpdate} />
    case "Section Group":
      return <SectionGroupEditor block={block} productId={productId} onUpdate={onUpdate} />
    
    // Simple text block fallback
    case "Artwork Text Block":
    default:
      return (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Block Title"
            value={block.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <textarea
            placeholder="Block Description"
            value={block.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none h-32"
          />
        </div>
      )
  }
}
