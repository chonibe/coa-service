"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Trash2 } from "lucide-react"
import { Button, Skeleton } from "@/components/ui"
import { useShouldShowDesktopGate } from "@/hooks/use-is-mobile"
import { useSafeArea } from "@/hooks/use-safe-area"
import { DesktopGate } from "@/app/vendor/dashboard/slides/components/DesktopGate"
import { SlideCanvas } from "@/app/vendor/dashboard/slides/components/SlideCanvas"
import { ToolBar } from "@/app/vendor/dashboard/slides/components/ToolBar"
import { TitlePillBar } from "@/app/vendor/dashboard/slides/components/TitlePillBar"
import { TitleCaptionEditor } from "@/app/vendor/dashboard/slides/components/TitleCaptionEditor"
import { BackgroundPicker } from "@/app/vendor/dashboard/slides/components/BackgroundPicker"
import { TextStylePicker } from "@/app/vendor/dashboard/slides/components/TextStylePicker"
import { AudioPicker } from "@/app/vendor/dashboard/slides/components/AudioPicker"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"
import { MiniSlidesBar } from "../create/components/MiniSlidesBar"
import { createTextElement } from "@/lib/slides/types"
import type { Slide, CanvasElement, SlideBackground, SlideAudio } from "@/lib/slides/types"

type ActiveSheet = "none" | "background" | "text-style" | "audio"

export default function SlideEditorPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const slideId = params.slideId as string
  const shouldShowDesktopGate = useShouldShowDesktopGate()
  const safeArea = useSafeArea()

  // Slide state
  const [slide, setSlide] = useState<Slide | null>(null)
  const [allSlides, setAllSlides] = useState<Slide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Editor state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>("none")
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)

  // Fetch all slides and current slide
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // Fetch all slides for mini-slides bar
        const slidesResponse = await fetch(`/api/vendor/slides/${productId}`)
        const slidesData = await slidesResponse.json()
        
        if (!slidesResponse.ok) {
          throw new Error(slidesData.error || "Failed to fetch slides")
        }
        
        setAllSlides(slidesData.slides)
        
        // Fetch current slide
        const slideResponse = await fetch(`/api/vendor/slides/${productId}/${slideId}`)
        const slideData = await slideResponse.json()

        if (!slideResponse.ok) {
          throw new Error(slideData.error || "Failed to fetch slide")
        }

        setSlide(slideData.slide)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load slide")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productId, slideId])

  // Auto-save functionality
  const saveSlide = useCallback(async () => {
    if (!slide || !hasChanges) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/vendor/slides/${productId}/${slideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slide }),
      })

      if (!response.ok) {
        throw new Error("Failed to save slide")
      }

      setHasChanges(false)
      setError(null)
    } catch (err: any) {
      console.error("Error saving slide:", err)
      setError("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }, [slide, hasChanges, productId, slideId])

  // Auto-save on changes
  useEffect(() => {
    if (!hasChanges || !slide) return

    const timeout = setTimeout(() => {
      saveSlide()
    }, 1000)

    return () => clearTimeout(timeout)
  }, [hasChanges, saveSlide])

  // Update handlers
  const updateSlide = useCallback((updates: Partial<Slide>) => {
    setSlide((prev) => prev ? { ...prev, ...updates } : null)
    setHasChanges(true)
  }, [])

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setSlide((prev) => {
      if (!prev) return null
      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      }
    })
    setHasChanges(true)
  }, [])

  const addElement = useCallback((element: CanvasElement) => {
    setSlide((prev) => {
      if (!prev) return null
      return {
        ...prev,
        elements: [...prev.elements, element],
      }
    })
    setHasChanges(true)
  }, [])

  const deleteElement = useCallback((elementId: string) => {
    setSlide((prev) => {
      if (!prev) return null
      return {
        ...prev,
        elements: prev.elements.filter((el) => el.id !== elementId),
      }
    })
    setHasChanges(true)
    setSelectedElementId(null)
  }, [])

  const updateBackground = useCallback((background: SlideBackground) => {
    updateSlide({ background })
  }, [updateSlide])

  const updateAudio = useCallback((audio: SlideAudio | undefined) => {
    updateSlide({ audio })
  }, [updateSlide])

  // Add text element
  const addTextElement = useCallback(() => {
    const newElement = createTextElement("Double tap to edit")
    addElement(newElement)
    setSelectedElementId(newElement.id)
  }, [addElement])

  // Add image element
  const handleImageSelect = useCallback((media: MediaItem | MediaItem[]) => {
    const selected = Array.isArray(media) ? media[0] : media
    
    // Add as canvas element or background?
    // For now, add as background
    updateBackground({
      type: 'image',
      url: selected.url,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    })
    
    setShowMediaLibrary(false)
  }, [updateBackground])

  // Navigate to different slide
  const handleSlideSelect = useCallback(async (newSlideId: string) => {
    if (newSlideId === slideId) return
    
    // Save current changes first
    if (hasChanges && slide) {
      await saveSlide()
    }
    
    // Navigate to new slide
    router.push(`/slides/${productId}/${newSlideId}`)
  }, [slideId, hasChanges, slide, saveSlide, router, productId])

  // Delete slide
  const deleteSlide = async () => {
    if (!confirm("Are you sure you want to delete this slide? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/vendor/slides/${productId}/${slideId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete slide")
      }

      router.push(`/slides/${productId}`)
    } catch (err: any) {
      console.error("Error deleting slide:", err)
      setError("Failed to delete slide")
    }
  }

  if (shouldShowDesktopGate) {
    return <DesktopGate />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="w-full max-w-sm aspect-[9/16]" />
      </div>
    )
  }

  if (error && !slide) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Slide not found"}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!slide) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="w-full max-w-sm aspect-[9/16]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/slides/${productId}`)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-yellow-400">
              {isSaving ? "Saving..." : "Unsaved changes"}
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={deleteSlide}
            className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/collector/artwork/${productId}`)}
            className="text-white hover:bg-white/10"
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Title/Caption Editor */}
        <div className="flex-shrink-0 px-4 py-2 bg-black/40">
          <TitleCaptionEditor
            title={slide.title}
            caption={slide.caption}
            onTitleChange={(title) => updateSlide({ title })}
            onCaptionChange={(caption) => updateSlide({ caption })}
          />
        </div>

        {/* Title Suggestions */}
        <div className="flex-shrink-0 px-4 pb-2 bg-black/40">
          <TitlePillBar
            onSelect={(title) => updateSlide({ title })}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <SlideCanvas
            slide={slide}
            selectedElementId={selectedElementId}
            onElementSelect={setSelectedElementId}
            onElementUpdate={updateElement}
            onElementAdd={addElement}
            onElementDelete={deleteElement}
            safeArea={safeArea}
          />
        </div>

        {/* Toolbar */}
        <div className="flex-shrink-0">
          <ToolBar
            hasAudio={!!slide.audio}
            onAddText={addTextElement}
            onAddImage={() => setShowMediaLibrary(true)}
            onOpenAudio={() => setActiveSheet("audio")}
            onOpenBackground={() => setActiveSheet("background")}
            onOpenTextStyle={() => setActiveSheet("text-style")}
          />
        </div>
      </div>

      {/* Mini-Slides Navigation Bar */}
      {allSlides.length > 0 && (
        <div className="flex-shrink-0">
          <MiniSlidesBar
            slides={allSlides}
            activeSlideId={slideId}
            onSlideSelect={handleSlideSelect}
            productId={productId}
          />
        </div>
      )}

      {/* Bottom sheets */}
      <BackgroundPicker
        isOpen={activeSheet === "background"}
        onClose={() => setActiveSheet("none")}
        currentBackground={slide.background}
        onSelect={updateBackground}
      />

      <TextStylePicker
        isOpen={activeSheet === "text-style"}
        onClose={() => setActiveSheet("none")}
        element={slide.elements.find((el) => el.id === selectedElementId)}
        onUpdate={(updates) => {
          if (selectedElementId) {
            updateElement(selectedElementId, updates)
          }
        }}
      />

      <AudioPicker
        isOpen={activeSheet === "audio"}
        onClose={() => setActiveSheet("none")}
        currentAudio={slide.audio}
        onSelect={updateAudio}
      />

      {/* Media Library Modal for adding images */}
      <MediaLibraryModal
        open={showMediaLibrary}
        onOpenChange={setShowMediaLibrary}
        onSelect={handleImageSelect}
        mode="single"
        allowedTypes={["image", "video"]}
        title="Add Media"
      />
    </div>
  )
}