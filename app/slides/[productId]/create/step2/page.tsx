"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { ArrowRight, Plus, Trash2, GripVertical, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
import { Button } from "@/components/ui"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"
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
import Image from "next/image"

interface SortableMediaItemProps {
  media: MediaItem
  index: number
  onRemove: () => void
}

function SortableMediaItem({ media, index, onRemove }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-24 touch-none"
    >
      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black border border-white/20 group">
        {media.type === 'image' ? (
          <Image
            src={media.url}
            alt={media.name}
            fill
            className="object-cover"
          />
        ) : (
          <video
            src={media.url}
            className="w-full h-full object-cover"
          />
        )}

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 bg-black/60 p-1 rounded backdrop-blur-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3 w-3 text-white" />
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="absolute bottom-1 right-1 bg-red-500/80 hover:bg-red-500 p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3 w-3 text-white" />
        </button>

        {/* Media type indicator */}
        <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
          {media.type === 'image' ? (
            <ImageIcon className="w-3 h-3 text-white" />
          ) : (
            <VideoIcon className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

      {/* Index number */}
      <div className="text-center mt-1">
        <span className="text-xs text-white/70 font-medium">
          {index + 1}
        </span>
      </div>
    </div>
  )
}

/**
 * Step 2: Carousel Builder
 * Add multiple media items and reorder them
 */
export default function Step2CarouselBuilder() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([])
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [nextButtonContainer, setNextButtonContainer] = useState<HTMLElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load wizard state from Step 1
  useEffect(() => {
    const wizardState = sessionStorage.getItem(`slides-wizard-${productId}`)
    if (wizardState) {
      const state = JSON.parse(wizardState)
      if (state.selectedMedia && state.selectedMedia.length > 0) {
        setSelectedMedia(state.selectedMedia)
      } else {
        // No media from step 1, go back
        router.push(`/slides/${productId}/create/step1`)
      }
    } else {
      // No wizard state, go back to step 1
      router.push(`/slides/${productId}/create/step1`)
    }

    setNextButtonContainer(document.getElementById('wizard-next-button'))
  }, [productId, router])

  // Handle adding more media
  const handleMediaAdd = (media: MediaItem | MediaItem[]) => {
    const newMedia = Array.isArray(media) ? media : [media]
    const updated = [...selectedMedia, ...newMedia]
    setSelectedMedia(updated)

    // Update sessionStorage
    sessionStorage.setItem(`slides-wizard-${productId}`, JSON.stringify({
      step: 2,
      selectedMedia: updated,
    }))

    setShowMediaLibrary(false)
  }

  // Handle media removal
  const handleMediaRemove = (id: string) => {
    const updated = selectedMedia.filter((m) => m.id !== id)
    setSelectedMedia(updated)

    // Update sessionStorage
    sessionStorage.setItem(`slides-wizard-${productId}`, JSON.stringify({
      step: 2,
      selectedMedia: updated,
    }))
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedMedia.findIndex((m) => m.id === active.id)
      const newIndex = selectedMedia.findIndex((m) => m.id === over.id)

      const reordered = arrayMove(selectedMedia, oldIndex, newIndex)
      setSelectedMedia(reordered)

      // Update sessionStorage
      sessionStorage.setItem(`slides-wizard-${productId}`, JSON.stringify({
        step: 2,
        selectedMedia: reordered,
      }))
    }
  }

  // Navigate to Step 3 (create slides)
  const handleNext = () => {
    router.push(`/slides/${productId}/create/step3`)
  }

  return (
    <>
      <div className="w-full h-full flex flex-col p-6">
        {/* Main Preview */}
        <div className="flex-1 flex items-center justify-center mb-6">
          {selectedMedia.length > 0 && (
            <div className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-black border-2 border-white/20">
              {selectedMedia[0].type === 'image' ? (
                <Image
                  src={selectedMedia[0].url}
                  alt={selectedMedia[0].name}
                  fill
                  className="object-cover"
                />
              ) : (
                <video
                  src={selectedMedia[0].url}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
            </div>
          )}
        </div>

        {/* Carousel Builder */}
        <div className="flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">
              Carousel ({selectedMedia.length} {selectedMedia.length === 1 ? 'slide' : 'slides'})
            </h3>
            <Button
              onClick={() => setShowMediaLibrary(true)}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More
            </Button>
          </div>

          {/* Media Thumbnails */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedMedia.map((m) => m.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selectedMedia.map((media, index) => (
                  <SortableMediaItem
                    key={media.id}
                    media={media}
                    index={index}
                    onRemove={() => handleMediaRemove(media.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-white/50 text-sm text-center">
            Drag to reorder • {selectedMedia.length} {selectedMedia.length === 1 ? 'slide will be created' : 'slides will be created'}
          </p>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={showMediaLibrary}
        onOpenChange={setShowMediaLibrary}
        onSelect={handleMediaAdd}
        mode="multiple"
        allowedTypes={["image", "video"]}
        title="Add More Media"
      />

      {/* Next Button (portal to header) */}
      {nextButtonContainer && createPortal(
        <Button
          onClick={handleNext}
          size="sm"
          disabled={selectedMedia.length === 0}
          className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>,
        nextButtonContainer
      )}
    </>
  )
}
