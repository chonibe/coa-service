"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Check, GripVertical, Play, Sparkles, Link2, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Sparkles, Lock as LockIcon, Crown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
          {member.has_benefits && (
            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full border border-purple-200/50 dark:border-purple-800/50 bg-purple-50/80 dark:bg-purple-950/30 pointer-events-auto"
                  >
                    <MoreVertical className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    {member.benefit_count && member.benefit_count > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-purple-600 dark:bg-purple-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {member.benefit_count}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Treasure Connections</span>
                  {member.benefit_count && member.benefit_count > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {member.benefit_count} {member.benefit_count === 1 ? 'treasure' : 'treasures'}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Show connections if they exist */}
                {member.connections && (member.connections.hidden_series || member.connections.vip_artwork || member.connections.vip_series) ? (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Unlocks:</p>
                      <div className="space-y-2">
                        {member.connections.hidden_series && (
                          <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <LockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Hidden Series</p>
                              <p className="text-xs text-amber-700 dark:text-amber-300 truncate">{member.connections.hidden_series.name}</p>
                            </div>
                          </div>
                        )}
                        {member.connections.vip_artwork && (
                          <div className="flex items-start gap-2 p-2 rounded-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                            <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">VIP Artwork</p>
                              <p className="text-xs text-purple-700 dark:text-purple-300 truncate">{member.connections.vip_artwork.title}</p>
                            </div>
                          </div>
                        )}
                        {member.connections.vip_series && (
                          <div className="flex items-start gap-2 p-2 rounded-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                            <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">VIP Series</p>
                              <p className="text-xs text-purple-700 dark:text-purple-300 truncate">{member.connections.vip_series.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span>Purchasing this artwork unlocks these treasures</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">
                      This artwork has {member.benefit_count || 1} treasure{member.benefit_count !== 1 ? 's' : ''} configured.
                    </p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {member.unlock_order && (
            <p className="text-xs text-muted-foreground">
              Unlock order: {member.unlock_order}
            </p>
          )}
          {member.has_benefits && (
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {member.benefit_count === 1 ? "1 treasure" : `${member.benefit_count} treasures`}
            </p>
          )}
        </div>
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

