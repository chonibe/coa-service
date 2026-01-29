"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit3, Check, GripVertical, X } from "lucide-react"
import { Button } from "@/components/ui"
import { useShouldShowDesktopGate } from "@/hooks/use-is-mobile"
import { DesktopGate } from "@/app/vendor/dashboard/slides/components/DesktopGate"
import type { Slide } from "@/lib/slides/types"
import Image from "next/image"
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SortableSlideProps {
  slide: Slide
  index: number
  isReorderMode: boolean
  onEdit: () => void
  onDelete: () => void
}

function SortableSlide({ slide, index, isReorderMode, onEdit, onDelete }: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id, disabled: !isReorderMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 mb-4 group"
    >
      {/* Slide Content */}
      <div className="w-full h-full relative">
        {/* Background */}
        {slide.background.type === 'image' && slide.background.url && (
          <Image
            src={slide.background.url}
            alt={slide.title || `Slide ${index + 1}`}
            fill
            className="object-cover"
            style={{
              transform: `scale(${slide.background.scale || 1})`,
            }}
          />
        )}
        {slide.background.type === 'video' && slide.background.url && (
          <video
            src={slide.background.url}
            className="w-full h-full object-cover"
            style={{
              transform: `scale(${slide.background.scale || 1})`,
            }}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        {!slide.background.url && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <span className="text-white/30 text-2xl">{index + 1}</span>
          </div>
        )}

        {/* Title & Caption Overlay */}
        {(slide.title || slide.caption) && !isReorderMode && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            {slide.title && (
              <h2 className="text-white font-bold text-2xl mb-2">{slide.title}</h2>
            )}
            {slide.caption && (
              <p className="text-white/90 text-sm">{slide.caption}</p>
            )}
          </div>
        )}

        {/* Reorder Mode Overlay */}
        {isReorderMode && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
            <div
              {...attributes}
              {...listeners}
              className="bg-white/20 backdrop-blur-sm p-4 rounded-full cursor-grab active:cursor-grabbing mb-4"
            >
              <GripVertical className="w-8 h-8 text-white" />
            </div>
            <div className="text-white font-bold text-xl mb-2">Slide {index + 1}</div>
            {slide.title && (
              <div className="text-white/80 text-sm">{slide.title}</div>
            )}
          </div>
        )}
      </div>

      {/* Edit Button (visible when not in reorder mode) */}
      {!isReorderMode && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Edit3 className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Delete Button (visible in reorder mode) */}
      {isReorderMode && (
        <button
          onClick={onDelete}
          className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm p-2 rounded-full hover:bg-red-500 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Slide Number Badge */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className="text-white text-sm font-medium">{index + 1}</span>
      </div>
    </div>
  )
}

/**
 * Slides Viewer - Full-screen Reels-style view with edit/reorder modes
 */
export default function SlidesViewerPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const shouldShowDesktopGate = useShouldShowDesktopGate()

  const [slides, setSlides] = useState<Slide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
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

        setSlides(data.slides)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching slides:", err)
        setError(err.message || "Failed to load slides")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSlides()
  }, [productId])

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((slide) => slide.id === active.id)
      const newIndex = slides.findIndex((slide) => slide.id === over.id)

      const reordered = arrayMove(slides, oldIndex, newIndex)
      setSlides(reordered)

      // Update display_order on backend
      try {
        await Promise.all(
          reordered.map((slide, index) =>
            fetch(`/api/vendor/slides/${productId}/${slide.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                slide: { ...slide, display_order: index },
              }),
            })
          )
        )
      } catch (err) {
        console.error("Failed to reorder slides:", err)
      }
    }
  }

  // Handle edit slide
  const handleEditSlide = (slideId: string) => {
    router.push(`/slides/${productId}/${slideId}`)
  }

  // Handle delete slide
  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm("Delete this slide?")) return

    try {
      const response = await fetch(`/api/vendor/slides/${productId}/${slideId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete slide")
      }

      setSlides(slides.filter((s) => s.id !== slideId))
    } catch (err) {
      console.error("Failed to delete slide:", err)
    }
  }

  // Toggle reorder mode
  const toggleReorderMode = () => {
    setIsReorderMode(!isReorderMode)
  }

  if (shouldShowDesktopGate) {
    return <DesktopGate />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white/70 mb-4">No slides yet</p>
          <Button onClick={() => router.push(`/slides/${productId}`)}>
            Create Slides
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleReorderMode}
          className={`text-white hover:bg-white/10 ${
            isReorderMode ? 'bg-white/20' : ''
          }`}
        >
          {isReorderMode ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Done
            </>
          ) : (
            <>
              <GripVertical className="w-4 h-4 mr-2" />
              Reorder
            </>
          )}
        </Button>
      </header>

      {/* Content */}
      <div className="pt-16 pb-8 px-4">
        {isReorderMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {slides.map((slide, index) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isReorderMode={isReorderMode}
                  onEdit={() => handleEditSlide(slide.id)}
                  onDelete={() => handleDeleteSlide(slide.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <>
            {slides.map((slide, index) => (
              <SortableSlide
                key={slide.id}
                slide={slide}
                index={index}
                isReorderMode={isReorderMode}
                onEdit={() => handleEditSlide(slide.id)}
                onDelete={() => handleDeleteSlide(slide.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Helper text */}
      {isReorderMode && (
        <div className="fixed bottom-8 left-0 right-0 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white text-sm">Drag slides to reorder</p>
          </div>
        </div>
      )}
    </div>
  )
}
