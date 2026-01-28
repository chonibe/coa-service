"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useShouldShowDesktopGate } from "@/hooks/use-is-mobile"
import { useSafeArea } from "@/hooks/use-safe-area"
import { DesktopGate } from "../../components/DesktopGate"
import { SlideCanvas } from "../../components/SlideCanvas"
import { ToolBar } from "../../components/ToolBar"
import { TitlePillBar } from "../../components/TitlePillBar"
import { TitleCaptionEditor } from "../../components/TitleCaptionEditor"
import { BackgroundPicker } from "../../components/BackgroundPicker"
import { TextStylePicker } from "../../components/TextStylePicker"
import { AudioPicker } from "../../components/AudioPicker"
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Editor state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>("none")

  // Fetch slide
  useEffect(() => {
    async function fetchSlide() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vendor/slides/${productId}/${slideId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch slide")
        }

        setSlide(data.slide)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (productId && slideId) {
      fetchSlide()
    }
  }, [productId, slideId])

  // Save slide
  const saveSlide = useCallback(async () => {
    if (!slide || !hasChanges) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/vendor/slides/${productId}/${slideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          background: slide.background,
          elements: slide.elements,
          title: slide.title,
          caption: slide.caption,
          audio: slide.audio,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      setHasChanges(false)
    } catch (err: any) {
      console.error("Failed to save slide:", err)
    } finally {
      setIsSaving(false)
    }
  }, [slide, hasChanges, productId, slideId])

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasChanges) return

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

  const updateBackground = useCallback((background: SlideBackground) => {
    updateSlide({ background })
    setActiveSheet("none")
  }, [updateSlide])

  const updateElements = useCallback((elements: CanvasElement[]) => {
    updateSlide({ elements })
  }, [updateSlide])

  const addElement = useCallback((element: CanvasElement) => {
    if (!slide) return
    updateSlide({ elements: [...slide.elements, element] })
    setSelectedElementId(element.id)
  }, [slide, updateSlide])

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    if (!slide) return
    const newElements = slide.elements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    )
    updateSlide({ elements: newElements })
  }, [slide, updateSlide])

  const deleteElement = useCallback((elementId: string) => {
    if (!slide) return
    updateSlide({ elements: slide.elements.filter((el) => el.id !== elementId) })
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }, [slide, selectedElementId, updateSlide])

  const updateTitle = useCallback((title: string) => {
    updateSlide({ title: title || null })
  }, [updateSlide])

  const updateCaption = useCallback((caption: string) => {
    updateSlide({ caption: caption || null })
  }, [updateSlide])

  const updateAudio = useCallback((audio: SlideAudio | null) => {
    updateSlide({ audio })
    setActiveSheet("none")
  }, [updateSlide])

  // Navigate back
  const handleBack = useCallback(() => {
    if (hasChanges) {
      saveSlide().then(() => {
        router.push(`/vendor/dashboard/slides/${productId}`)
      })
    } else {
      router.push(`/vendor/dashboard/slides/${productId}`)
    }
  }, [hasChanges, saveSlide, router, productId])

  // Show desktop gate if needed
  if (shouldShowDesktopGate) {
    const isDev = process.env.NODE_ENV === "development"
    return <DesktopGate showDevBypass={isDev} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="w-full max-w-sm aspect-[9/16]" />
      </div>
    )
  }

  if (error || !slide) {
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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-white/60">Saving...</span>
          )}
          {!isSaving && hasChanges && (
            <span className="text-xs text-white/60">Unsaved</span>
          )}
          {!isSaving && !hasChanges && (
            <span className="text-xs text-green-400 flex items-center">
              <Check className="w-3 h-3 mr-1" />
              Saved
            </span>
          )}
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <SlideCanvas
          slide={slide}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
        />
      </div>

      {/* Title pill bar */}
      <div className="flex-shrink-0 px-4 py-2 bg-black/80 backdrop-blur">
        <TitlePillBar
          currentTitle={slide.title || ""}
          onSelectTitle={updateTitle}
        />
      </div>

      {/* Title/Caption editor */}
      <div className="flex-shrink-0 px-4 py-2 bg-black/80 backdrop-blur">
        <TitleCaptionEditor
          title={slide.title || ""}
          caption={slide.caption || ""}
          onTitleChange={updateTitle}
          onCaptionChange={updateCaption}
        />
      </div>

      {/* Toolbar */}
      <div
        className="flex-shrink-0 bg-black/80 backdrop-blur"
        style={{ paddingBottom: safeArea.bottom + 16 }}
      >
        <ToolBar
          hasAudio={!!slide.audio}
          onAddText={() => {
            const newElement: CanvasElement = {
              id: crypto.randomUUID(),
              type: "text",
              x: 50,
              y: 50,
              scale: 1,
              rotation: 0,
              width: 80,
              height: 20,
              content: "Tap to edit",
              style: {
                fontSize: "large",
                fontWeight: "normal",
                fontStyle: "normal",
                color: "#ffffff",
                textAlign: "center",
              },
            }
            addElement(newElement)
          }}
          onAddImage={() => {
            // TODO: Open media library
            console.log("Open media library")
          }}
          onOpenAudio={() => setActiveSheet("audio")}
          onOpenBackground={() => setActiveSheet("background")}
          onOpenTextStyle={() => {
            if (selectedElementId) {
              setActiveSheet("text-style")
            }
          }}
        />
      </div>

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
    </div>
  )
}
