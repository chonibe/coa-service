"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface MiniSlidesBarProps {
  slides: Slide[]
  activeSlideId: string
  onSlideSelect: (slideId: string) => void
  productId: string
}

interface SortableSlideProps {
  slide: Slide
  index: number
  isActive: boolean
  activeRef: React.RefObject<HTMLDivElement> | null
  onSelect: () => void
  onDelete: () => void
}

function SortableSlide({ slide, index, isActive, activeRef, onSelect, onDelete }: SortableSlideProps) {
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

  const hasContent = (slide.elements && slide.elements.length > 0) || slide.title || slide.caption

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-16 touch-none"
      {...attributes}
      {...listeners}
    >
      <div
        ref={isActive ? activeRef : null}
        onClick={onSelect}
        className="cursor-pointer"
      >
        <div
          className={`relative aspect-[9/16] rounded-lg overflow-hidden ${
            isActive
              ? 'ring-2 ring-white shadow-lg'
              : 'ring-1 ring-white/20'
          }`}
        >
          {/* Slide preview - show background */}
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black">
            {slide.background.type === 'image' && slide.background.url && (
              <Image
                src={slide.background.url}
                alt={`Slide ${index + 1}`}
                fill
                className="object-cover"
              />
            )}
            {slide.background.type === 'video' && slide.background.url && (
              <video
                src={slide.background.url}
                className="w-full h-full object-cover"
              />
            )}
            {!slide.background.url && (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/30 text-xs">{index + 1}</span>
              </div>
            )}
          </div>

          {/* Delete button - always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute top-0.5 right-0.5 bg-red-500/90 hover:bg-red-500 rounded-full p-0.5 backdrop-blur-sm transition-colors z-10"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>

          {/* Completion indicator */}
          {hasContent && (
            <div className="absolute top-0.5 left-0.5 bg-green-500 rounded-full p-0.5">
              <Check className="w-2 h-2 text-white" />
            </div>
          )}

          {/* Active indicator */}
          {isActive && (
            <div className="absolute inset-0 bg-white/10" />
          )}
        </div>

        {/* Slide number */}
        <div className="text-center mt-1">
          <span className={`text-xs font-medium ${
            isActive ? 'text-white' : 'text-white/50'
          }`}>
            {index + 1}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * MiniSlidesBar - Instagram Stories style bottom navigation
 * 
 * Shows mini thumbnails of all slides, with active slide highlighted.
 * Includes add slide button, delete buttons, and drag-to-reorder.
 */
export function MiniSlidesBar({ slides, activeSlideId, onSlideSelect, productId }: MiniSlidesBarProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const [localSlides, setLocalSlides] = useState<Slide[]>(slides)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update local slides when props change
  useEffect(() => {
    setLocalSlides(slides)
  }, [slides])

  // Scroll active slide into view
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeSlideId])

  // Handle drag end - reorder slides
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localSlides.findIndex((s) => s.id === active.id)
      const newIndex = localSlides.findIndex((s) => s.id === over.id)

      const reordered = arrayMove(localSlides, oldIndex, newIndex)
      setLocalSlides(reordered)

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

      // If deleting active slide, navigate to first remaining slide
      if (slideId === activeSlideId) {
        const remainingSlides = localSlides.filter((s) => s.id !== slideId)
        if (remainingSlides.length > 0) {
          router.push(`/slides/${productId}/${remainingSlides[0].id}`)
        } else {
          router.push(`/slides/${productId}`)
        }
      } else {
        // Just remove from local state
        setLocalSlides(localSlides.filter((s) => s.id !== slideId))
      }
    } catch (err) {
      console.error("Failed to delete slide:", err)
    }
  }

  // Handle create new slide
  const handleCreateSlide = async () => {
    try {
      const response = await fetch(`/api/vendor/slides/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          display_order: localSlides.length,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create slide")
      }

      const data = await response.json()
      router.push(`/slides/${productId}/${data.slide.id}`)
    } catch (err) {
      console.error("Failed to create slide:", err)
    }
  }

  return (
    <div className="w-full bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localSlides.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div
            ref={containerRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide group"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {localSlides.map((slide, index) => (
              <SortableSlide
                key={slide.id}
                slide={slide}
                index={index}
                isActive={slide.id === activeSlideId}
                activeRef={slide.id === activeSlideId ? activeRef : null}
                onSelect={() => onSlideSelect(slide.id)}
                onDelete={() => handleDeleteSlide(slide.id)}
              />
            ))}

            {/* Add Slide Button */}
            <div className="flex-shrink-0 w-16">
              <button
                onClick={handleCreateSlide}
                className="relative aspect-[9/16] rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-6 h-6 text-white/50" />
              </button>
              <div className="text-center mt-1">
                <span className="text-xs font-medium text-white/50">Add</span>
              </div>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
