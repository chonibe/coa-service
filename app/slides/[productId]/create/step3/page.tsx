"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { ArrowRight, Check } from "lucide-react"
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
import { MiniSlidesBar } from "../components/MiniSlidesBar"
import type { Slide, CanvasElement, SlideBackground, SlideAudio } from "@/lib/slides/types"
import type { MediaItem } from "@/components/vendor/MediaLibraryModal"

type ActiveSheet = "none" | "background" | "text-style" | "audio"

/**
 * Step 3: Editor with Mini-Slides
 * 
 * Create all slides from selected media, then provide editor interface
 * with mini-slides navigation at bottom (Instagram Stories style)
 */
export default function Step3EditorWithMiniSlides() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const shouldShowDesktopGate = useShouldShowDesktopGate()
  const safeArea = useSafeArea()

  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isCreatingSlides, setIsCreatingSlides] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextButtonContainer, setNextButtonContainer] = useState<HTMLElement | null>(null)

  // Editor state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>("none")

  const currentSlide = slides[currentSlideIndex]

  useEffect(() => {
    setNextButtonContainer(document.getElementById('wizard-next-button'))
  }, [])

  // Create slides from wizard state
  useEffect(() => {
    async function createSlidesFromMedia() {
      try {
        setIsCreatingSlides(true)

        // Load wizard state
        const wizardState = sessionStorage.getItem(`slides-wizard-${productId}`)
        if (!wizardState) {
          router.push(`/slides/${productId}/create/step1`)
          return
        }

        const state = JSON.parse(wizardState)
        const selectedMedia: MediaItem[] = state.selectedMedia || []

        if (selectedMedia.length === 0) {
          router.push(`/slides/${productId}/create/step1`)
          return
        }

        // Create slides via API (one per media item)
        const createdSlides: Slide[] = []

        for (let i = 0; i < selectedMedia.length; i++) {
          const media = selectedMedia[i]

          const response = await fetch(`/api/vendor/slides/${productId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              product_id: productId,
              display_order: i,
              background: {
                type: media.type === 'image' ? 'image' : 'video',
                url: media.url,
                scale: 1,
                offsetX: 0,
                offsetY: 0,
              },
              elements: [],
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to create slide ${i + 1}`)
          }

          const data = await response.json()
          createdSlides.push(data.slide)
        }

        setSlides(createdSlides)

        // Update wizard state with created slide IDs
        sessionStorage.setItem(`slides-wizard-${productId}`, JSON.stringify({
          ...state,
          step: 3,
          createdSlideIds: createdSlides.map((s) => s.id),
        }))

        setError(null)
      } catch (err: any) {
        console.error("Error creating slides:", err)
        setError(err.message || "Failed to create slides")
      } finally {
        setIsCreatingSlides(false)
      }
    }

    createSlidesFromMedia()
  }, [productId, router])

  // Auto-save current slide
  const saveCurrentSlide = useCallback(async () => {
    if (!currentSlide || !hasChanges) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/vendor/slides/${productId}/${currentSlide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slide: currentSlide }),
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
  }, [currentSlide, hasChanges, productId])

  // Auto-save on changes
  useEffect(() => {
    if (!hasChanges || !currentSlide) return

    const timeout = setTimeout(() => {
      saveCurrentSlide()
    }, 1000)

    return () => clearTimeout(timeout)
  }, [hasChanges, saveCurrentSlide])

  // Update handlers
  const updateCurrentSlide = useCallback((updates: Partial<Slide>) => {
    setSlides((prevSlides) => {
      const updated = [...prevSlides]
      updated[currentSlideIndex] = { ...updated[currentSlideIndex], ...updates }
      return updated
    })
    setHasChanges(true)
  }, [currentSlideIndex])

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setSlides((prevSlides) => {
      const updated = [...prevSlides]
      updated[currentSlideIndex] = {
        ...updated[currentSlideIndex],
        elements: updated[currentSlideIndex].elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      }
      return updated
    })
    setHasChanges(true)
  }, [currentSlideIndex])

  const addElement = useCallback((element: CanvasElement) => {
    setSlides((prevSlides) => {
      const updated = [...prevSlides]
      updated[currentSlideIndex] = {
        ...updated[currentSlideIndex],
        elements: [...updated[currentSlideIndex].elements, element],
      }
      return updated
    })
    setHasChanges(true)
  }, [currentSlideIndex])

  const deleteElement = useCallback((elementId: string) => {
    setSlides((prevSlides) => {
      const updated = [...prevSlides]
      updated[currentSlideIndex] = {
        ...updated[currentSlideIndex],
        elements: updated[currentSlideIndex].elements.filter((el) => el.id !== elementId),
      }
      return updated
    })
    setHasChanges(true)
    setSelectedElementId(null)
  }, [currentSlideIndex])

  const updateBackground = useCallback((background: SlideBackground) => {
    updateCurrentSlide({ background })
  }, [updateCurrentSlide])

  const updateAudio = useCallback((audio: SlideAudio | undefined) => {
    updateCurrentSlide({ audio })
  }, [updateCurrentSlide])

  // Handle Next button - go to next slide or complete
  const handleNext = async () => {
    // Save current slide first
    if (hasChanges) {
      await saveCurrentSlide()
    }

    if (currentSlideIndex < slides.length - 1) {
      // Move to next slide
      setCurrentSlideIndex(currentSlideIndex + 1)
      setSelectedElementId(null)
      setActiveSheet("none")
      setHasChanges(false)
    } else {
      // Complete wizard - go back to slides list
      sessionStorage.removeItem(`slides-wizard-${productId}`)
      router.push(`/slides/${productId}`)
    }
  }

  // Handle slide selection from mini-slides bar
  const handleSlideSelect = async (slideId: string) => {
    // Save current slide first
    if (hasChanges) {
      await saveCurrentSlide()
    }

    const index = slides.findIndex((s) => s.id === slideId)
    if (index !== -1) {
      setCurrentSlideIndex(index)
      setSelectedElementId(null)
      setActiveSheet("none")
      setHasChanges(false)
    }
  }

  if (shouldShowDesktopGate) {
    return <DesktopGate />
  }

  if (isCreatingSlides) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4" />
        <p className="text-white text-lg">Creating slides...</p>
      </div>
    )
  }

  if (error || slides.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <p className="text-red-400 text-center mb-4">{error || "No slides created"}</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/slides/${productId}/create/step2`)}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="w-full h-full flex flex-col">
        {/* Title/Caption Editor */}
        <div className="flex-shrink-0 px-4 py-2 bg-black/40">
          <TitleCaptionEditor
            title={currentSlide.title}
            caption={currentSlide.caption}
            onTitleChange={(title) => updateCurrentSlide({ title })}
            onCaptionChange={(caption) => updateCurrentSlide({ caption })}
          />
        </div>

        {/* Title Suggestions */}
        <div className="flex-shrink-0 px-4 pb-2 bg-black/40">
          <TitlePillBar
            onSelect={(title) => updateCurrentSlide({ title })}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <SlideCanvas
            slide={currentSlide}
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
            onBackgroundClick={() => setActiveSheet("background")}
            onTextClick={() => setActiveSheet("text-style")}
            onAudioClick={() => setActiveSheet("audio")}
            onDeleteClick={() => selectedElementId && deleteElement(selectedElementId)}
            hasSelectedElement={!!selectedElementId}
            selectedElement={currentSlide.elements.find((el) => el.id === selectedElementId)}
          />
        </div>

        {/* Mini-Slides Navigation Bar */}
        <div className="flex-shrink-0">
          <MiniSlidesBar
            slides={slides}
            activeSlideId={currentSlide.id}
            onSlideSelect={handleSlideSelect}
          />
        </div>
      </div>

      {/* Bottom sheets */}
      <BackgroundPicker
        isOpen={activeSheet === "background"}
        onClose={() => setActiveSheet("none")}
        currentBackground={currentSlide.background}
        onSelect={updateBackground}
      />

      <TextStylePicker
        isOpen={activeSheet === "text-style"}
        onClose={() => setActiveSheet("none")}
        element={currentSlide.elements.find((el) => el.id === selectedElementId)}
        onUpdate={(updates) => {
          if (selectedElementId) {
            updateElement(selectedElementId, updates)
          }
        }}
      />

      <AudioPicker
        isOpen={activeSheet === "audio"}
        onClose={() => setActiveSheet("none")}
        currentAudio={currentSlide.audio}
        onSelect={updateAudio}
      />

      {/* Next Button (portal to header) */}
      {nextButtonContainer && createPortal(
        <Button
          onClick={handleNext}
          size="sm"
          className="bg-white text-black hover:bg-white/90"
        >
          {currentSlideIndex < slides.length - 1 ? (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Done
            </>
          )}
        </Button>,
        nextButtonContainer
      )}
    </>
  )
}
