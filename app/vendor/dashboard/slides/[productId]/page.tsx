"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, ArrowLeft, GripVertical, Trash2, Eye, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useShouldShowDesktopGate } from "@/hooks/use-is-mobile"
import { DesktopGate } from "../components/DesktopGate"
import type { Slide } from "@/lib/slides/types"
import { GRADIENT_PRESETS } from "@/lib/slides/types"

interface SortableSlideCardProps {
  slide: Slide
  index: number
  onEdit: (slideId: string) => void
  onDelete: (slideId: string) => void
}

function SortableSlideCard({ slide, index, onEdit, onDelete }: SortableSlideCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Get background preview
  const getBackgroundStyle = () => {
    const bg = slide.background
    if (!bg) return { backgroundColor: "#1a1a1a" }

    if (bg.type === "gradient" && bg.value) {
      const preset = GRADIENT_PRESETS[bg.value as keyof typeof GRADIENT_PRESETS]
      if (preset) {
        return {
          background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
        }
      }
    }

    if (bg.type === "solid" && bg.value) {
      return { backgroundColor: bg.value }
    }

    if ((bg.type === "image" || bg.type === "video") && bg.url) {
      return {
        backgroundImage: `url(${bg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    }

    return { backgroundColor: "#1a1a1a" }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-20 sm:w-24 touch-none"
    >
      <Card
        className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={() => onEdit(slide.id)}
      >
        {/* Slide thumbnail */}
        <div
          className="aspect-[9/16] relative"
          style={getBackgroundStyle()}
        >
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-1 left-1 p-1 bg-black/40 rounded touch-none cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3 text-white" />
          </div>

          {/* Lock indicator */}
          {slide.is_locked && (
            <div className="absolute top-1 right-1 p-1 bg-black/40 rounded">
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Slide number */}
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white font-medium">
            {index + 1}
          </div>

          {/* Title preview if exists */}
          {slide.title && (
            <div className="absolute bottom-1 right-1 left-6 px-1 py-0.5 bg-black/60 rounded">
              <p className="text-[8px] text-white truncate">{slide.title}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function SlidesPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const shouldShowDesktopGate = useShouldShowDesktopGate()

  const [slides, setSlides] = useState<Slide[]>([])
  const [product, setProduct] = useState<{ id: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch slides
  useEffect(() => {
    async function fetchSlides() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vendor/slides/${productId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch slides")
        }

        setSlides(data.slides || [])
        setProduct(data.product)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchSlides()
    }
  }, [productId])

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id)
      const newIndex = slides.findIndex((s) => s.id === over.id)

      const newSlides = arrayMove(slides, oldIndex, newIndex)
      setSlides(newSlides)

      // Save new order to backend
      try {
        await fetch(`/api/vendor/slides/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slideOrder: newSlides.map((s) => s.id),
          }),
        })
      } catch (err) {
        console.error("Failed to save slide order:", err)
        // Revert on error
        setSlides(slides)
      }
    }
  }

  // Create new slide
  const handleCreateSlide = async () => {
    try {
      const response = await fetch(`/api/vendor/slides/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create slide")
      }

      // Navigate to the new slide editor
      router.push(`/vendor/dashboard/slides/${productId}/${data.slide.id}`)
    } catch (err: any) {
      console.error("Failed to create slide:", err)
      setError(err.message)
    }
  }

  // Edit slide
  const handleEditSlide = (slideId: string) => {
    router.push(`/vendor/dashboard/slides/${productId}/${slideId}`)
  }

  // Delete slide
  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm("Delete this slide?")) return

    try {
      await fetch(`/api/vendor/slides/${productId}/${slideId}`, {
        method: "DELETE",
      })
      setSlides(slides.filter((s) => s.id !== slideId))
    } catch (err) {
      console.error("Failed to delete slide:", err)
    }
  }

  // Show desktop gate if needed
  if (shouldShowDesktopGate) {
    const isDev = process.env.NODE_ENV === "development"
    return <DesktopGate showDevBypass={isDev} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-20 h-36 flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="font-semibold truncate max-w-[200px]">
            {product?.name || "Slides"}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/collector/artwork/${productId}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 max-w-lg mx-auto">
        {/* Slide list */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Slides ({slides.length})
          </h2>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2 overflow-x-auto pb-4 snap-x snap-mandatory">
                {slides.map((slide, index) => (
                  <SortableSlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    onEdit={handleEditSlide}
                    onDelete={handleDeleteSlide}
                  />
                ))}

                {/* Add slide button */}
                <button
                  onClick={handleCreateSlide}
                  className="flex-shrink-0 w-20 sm:w-24 aspect-[9/16] border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Empty state */}
        {slides.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No slides yet. Create your first slide to tell your artwork's story.
              </p>
              <Button onClick={handleCreateSlide}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Slide
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {slides.length > 0 && slides.length < 3 && (
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Most artworks have 3-8 slides. Consider adding:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• The story behind the piece</li>
                <li>• Your creative process</li>
                <li>• Close-up details</li>
                <li>• A personal message to collectors</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
