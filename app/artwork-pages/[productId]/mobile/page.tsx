"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Loader2, AlertCircle, Plus, X } from "lucide-react"
import { Button, Alert, AlertDescription, Skeleton, Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"
import { BlockSelectorPills } from "./components/BlockSelectorPills"
import { BLOCK_SCHEMAS } from "@/lib/artwork-blocks/block-schemas"

// Import desktop editor components (reuse for editing)
import SoundtrackEditor from "../../components/SoundtrackEditor"
import VoiceNoteRecorder from "../../components/VoiceNoteRecorder"
import ProcessGalleryEditor from "../../components/ProcessGalleryEditor"
import InspirationBoardEditor from "../../components/InspirationBoardEditor"
import ArtistNoteEditor from "../../components/ArtistNoteEditor"
import SectionGroupEditor from "../../components/SectionGroupEditor"

// Import preview components
import { VideoBlock } from "@/app/collector/artwork/[id]/components/VideoBlock"
import { AudioBlock } from "@/app/collector/artwork/[id]/components/AudioBlock"
import { ImageBlock } from "@/app/collector/artwork/[id]/components/ImageBlock"

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

export default function MobileArtworkEditorPage() {
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
  const [showAddBlockSheet, setShowAddBlockSheet] = useState(false)

  // Fetch product and blocks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch product data
        const productResponse = await fetch(`/api/vendor/products/${productId}`, {
          credentials: "include",
        })

        if (!productResponse.ok) {
          throw new Error("Failed to fetch product")
        }

        const productData = await productResponse.json()
        setProduct(productData.product)

        // Fetch content blocks
        const blocksResponse = await fetch(`/api/vendor/artwork-pages/${productId}`, {
          credentials: "include",
        })

        if (blocksResponse.ok) {
          const blocksData = await blocksResponse.json()
          setContentBlocks(blocksData.blocks || [])
          
          // Auto-select first block
          if (blocksData.blocks && blocksData.blocks.length > 0) {
            setSelectedBlockId(blocksData.blocks[0].id)
          }
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

  const handleAddBlock = (blockType: string) => {
    const newBlock: Partial<ContentBlock> = {
      benefit_type_id: 1, // Placeholder
      title: "",
      description: null,
      content_url: null,
      block_config: {},
      display_order: contentBlocks.length,
      is_published: false,
      block_type: blockType,
    }

    // API call to create block
    fetch(`/api/vendor/artwork-pages/${productId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newBlock),
    })
      .then(res => res.json())
      .then(data => {
        if (data.block) {
          setContentBlocks(prev => [...prev, data.block])
          setSelectedBlockId(data.block.id)
          setShowAddBlockSheet(false)
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
      // Save current block
      if (selectedBlock) {
        await fetch(`/api/vendor/artwork-pages/${productId}/blocks/${selectedBlock.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(selectedBlock),
        })
      }

      setLastSaved(new Date())
      toast({ title: "Saved", description: "Changes saved successfully" })
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
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col h-full p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load editor"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/vendor/dashboard/artwork-pages")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-white font-bold text-sm truncate max-w-[150px]">
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
          >
            <Eye className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content - Full Screen Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-950 p-4">
        {!selectedBlock ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-400 mb-4">No block selected</p>
            <Button onClick={() => setShowAddBlockSheet(true)} className="bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Block
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Block Editor */}
            {selectedBlock.block_type === "Artwork Text Block" && (
              <div className="bg-gray-900 rounded-lg p-4">
                <input
                  type="text"
                  placeholder="Block Title"
                  value={selectedBlock.title}
                  onChange={(e) => {
                    setContentBlocks(prev =>
                      prev.map(b => b.id === selectedBlock.id ? { ...b, title: e.target.value } : b)
                    )
                  }}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded mb-4"
                />
                <textarea
                  placeholder="Block Description"
                  value={selectedBlock.description || ""}
                  onChange={(e) => {
                    setContentBlocks(prev =>
                      prev.map(b => b.id === selectedBlock.id ? { ...b, description: e.target.value } : b)
                    )
                  }}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded h-64"
                />
              </div>
            )}

            {/* Add more block type editors here */}
            {selectedBlock.block_type && !["Artwork Text Block"].includes(selectedBlock.block_type) && (
              <div className="bg-gray-900 rounded-lg p-4 text-center text-gray-400">
                <p>Editor for {selectedBlock.block_type} coming soon</p>
                <p className="text-xs mt-2">Use desktop editor for full functionality</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Pills Bar */}
      {contentBlocks.length > 0 && (
        <BlockSelectorPills
          selectedBlockId={selectedBlockId}
          blocks={contentBlocks}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={() => setShowAddBlockSheet(true)}
        />
      )}

      {/* Add Block Sheet */}
      <Sheet open={showAddBlockSheet} onOpenChange={setShowAddBlockSheet}>
        <SheetContent side="bottom" className="h-[80vh] bg-gray-900 border-gray-800">
          <SheetHeader>
            <SheetTitle className="text-white">Add Block</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {BLOCK_SCHEMAS.map(schema => (
              <button
                key={schema.name}
                onClick={() => handleAddBlock(schema.name)}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <p className="text-white font-semibold text-sm">{schema.label}</p>
                <p className="text-gray-400 text-xs mt-1">{schema.description}</p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
