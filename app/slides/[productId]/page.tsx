"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, ArrowLeft, GripVertical, Trash2, Eye, Lock, Unlock } from "lucide-react"
import { Button, Card, CardContent, Skeleton } from "@/components/ui"
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
import { DesktopGate } from "@/app/vendor/dashboard/slides/components/DesktopGate"
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-20 sm:w-24 touch-none"
    >
      <Card className="overflow-hidden border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          <div
            className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => onEdit(slide.id)}
            {...attributes}
            {...listeners}
          >
            {/* Slide Preview */}
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              {slide.elements && slide.elements.length > 0 ? (
                <div className="text-white text-xs font-medium">
                  {slide.elements.length} elements
                </div>
              ) : (
                <div className="text-white/50 text-xs">
                  Empty
                </div>
              )}
            </div>

            {/* Title overlay */}
            {slide.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1">
                <div className="text-white text-[8px] font-medium truncate">
                  {slide.title}
                </div>
              </div>
            )}

            {/* Drag handle */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/60 p-1 rounded backdrop-blur-sm">
                <GripVertical className="h-2 w-2 text-white" />
              </div>
            </div>

            {/* Lock indicator */}
            {slide.is_locked && (
              <div className="absolute top-1 left-1">
                <div className="bg-red-500/80 p-1 rounded backdrop-blur-sm">
                  <Lock className="h-2 w-2 text-white" />
                </div>
              </div>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(slide.id)
              }}
              className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 p-1 rounded backdrop-blur-sm"
            >
              <Trash2 className="h-2 w-2 text-white" />
            </button>
          </div>

          {/* Slide number */}
          <div className="text-center mt-1">
            <span className="text-xs text-muted-foreground font-medium">
              {index + 1}
            </span>
          </div>
        </CardContent>
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
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch slides
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        const [slidesRes, productRes] = await Promise.all([
          fetch(`/api/vendor/slides/${productId}`),
          fetch(`/api/vendor/products/by-handle/${productId}`),
        ])

        if (!slidesRes.ok) {
          throw new Error("Failed to fetch slides")
        }

        const slidesData = await slidesRes.json()
        setSlides(slidesData.slides || [])

        if (productRes.ok) {
          const productData = await productRes.json()
          setProduct(productData.product)
        }
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load slides")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productId])

  // Create new slide
  const createSlide = async () => {
    try {
      setIsCreating(true)
      const response = await fetch(`/api/vendor/slides/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to create slide")
      }

      const data = await response.json()
      router.push(`/slides/${productId}/${data.slide.id}`)
    } catch (err: any) {
      console.error("Failed to create slide:", err)
      setError("Failed to create slide")
    } finally {
      setIsCreating(false)
    }
  }

  // Edit slide
  const editSlide = (slideId: string) => {
    router.push(`/slides/${productId}/${slideId}`)
  }

  // Delete slide
  const deleteSlide = async (slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) {
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

      setSlides(slides.filter((slide) => slide.id !== slideId))
    } catch (err: any) {
      console.error("Failed to delete slide:", err)
      setError("Failed to delete slide")
    }
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((slide) => slide.id === active.id)
      const newIndex = slides.findIndex((slide) => slide.id === over.id)

      const newSlides = arrayMove(slides, oldIndex, newIndex)

      // Update display order
      const updatedSlides = newSlides.map((slide, index) => ({
        ...slide,
        display_order: index,
      }))

      setSlides(updatedSlides)

      // Save to server
      try {
        await fetch(`/api/vendor/slides/${productId}/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            slides: updatedSlides.map((slide) => ({
              id: slide.id,
              display_order: slide.display_order,
            })),
          }),
        })
      } catch (err) {
        console.error("Failed to save slide order:", err)
        // Revert on error
        setSlides(slides)
      }
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

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
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
            onClick={() => router.push(`/collector/artwork/${productId}`)}
            variant="ghost"
            size="sm"
            className="-mr-2"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Slides List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map((slide) => slide.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-4 overflow-x-auto pb-4 mb-6">
                {/* Add new slide button */}
                <div className="flex-shrink-0 w-20 sm:w-24 touch-none">
                  <Card className="overflow-hidden border-dashed border-2 border-muted hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-0">
                      <div
                        className="aspect-[9/16] rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={createSlide}
                      >
                        {isCreating ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                        ) : (
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="text-center mt-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      Add
                    </span>
                  </div>
                </div>

                {/* Existing slides */}
                {slides.map((slide, index) => (
                  <SortableSlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    onEdit={editSlide}
                    onDelete={deleteSlide}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Empty state */}
          {slides.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-lg font-semibold mb-2">Create Your First Slide</h3>
                <p className="text-muted-foreground mb-6">
                  Build an immersive story for your collectors with interactive slides.
                  Each slide can contain images, text, audio, and more.
                </p>
                <Button onClick={createSlide} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Slide
                    </>
                  )}
                </Button>
                <ul className="text-sm text-muted-foreground mt-6 space-y-1">
                  <li>• The story behind the piece</li>
                  <li>• Your creative process</li>
                  <li>• Close-up details</li>
                  <li>• A personal message to collectors</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}