"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Check, GripVertical, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SeriesMember } from "@/types/artwork-series"
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

interface TrackListingProps {
  members: SeriesMember[]
  onReorder?: (newOrder: string[]) => void
  editable?: boolean
  seriesId?: string
}

function SortableTrackItem({
  member,
  index,
  isLocked,
  editable,
}: {
  member: SeriesMember
  index: number
  isLocked: boolean
  editable: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id, disabled: !editable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isLocked ? 0.6 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors",
        isDragging && "z-50 shadow-lg",
        isLocked && "opacity-60"
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isLocked ? 0.6 : 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Track number */}
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-sm font-mono text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Drag handle */}
      {editable && (
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Artwork thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted border">
        {member.artwork_image ? (
          <img
            src={member.artwork_image}
            alt={member.artwork_title || "Artwork"}
            className={cn(
              "w-full h-full object-cover",
              isLocked && "blur-sm"
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold truncate">
            {member.artwork_title || "Untitled Artwork"}
          </h4>
          {isLocked ? (
            <div className="h-5 w-5 rounded-full bg-destructive/80 flex items-center justify-center flex-shrink-0">
              <Lock className="h-3 w-3 text-white" />
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        {member.unlock_order && (
          <p className="text-xs text-muted-foreground mt-1">
            Unlock order: {member.unlock_order}
          </p>
        )}
      </div>

      {/* Play button (visual) */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
        >
          <Play className="h-5 w-5 text-primary fill-primary" />
        </button>
      </div>
    </motion.div>
  )
}

export function TrackListing({ members, onReorder, editable = false, seriesId }: TrackListingProps) {
  const [items, setItems] = useState<SeriesMember[]>(members)
  const [isReordering, setIsReordering] = useState(false)

  const sortedMembers = [...members].sort((a, b) => a.display_order - b.display_order)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = sortedMembers.findIndex((item) => item.id === active.id)
    const newIndex = sortedMembers.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(sortedMembers, oldIndex, newIndex)
    setItems(newItems)
    setIsReordering(true)

    if (onReorder) {
      const newOrder = newItems.map((item) => item.id)
      await onReorder(newOrder)
    } else if (seriesId) {
      try {
        const newOrder = newItems.map((item) => item.id)
        const response = await fetch(`/api/vendor/series/${seriesId}/reorder`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ memberIds: newOrder }),
        })

        if (!response.ok) {
          throw new Error("Failed to reorder artworks")
        }

        window.location.reload()
      } catch (error) {
        console.error("Error reordering artworks:", error)
        setItems(sortedMembers)
      }
    }

    setIsReordering(false)
  }

  const displayItems = items.length > 0 ? items : sortedMembers

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{displayItems.length} tracks</span>
          {editable && (
            <span className="text-xs">(Drag to reorder)</span>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            <AnimatePresence>
              {displayItems.map((member, index) => {
                const isLocked = member.is_locked

                return (
                  <SortableTrackItem
                    key={member.id}
                    member={member}
                    index={index}
                    isLocked={isLocked}
                    editable={editable}
                  />
                )
              })}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {isReordering && (
        <div className="text-xs text-muted-foreground text-center">
          Saving new order...
        </div>
      )}
    </div>
  )
}

