"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { GripVertical, Trash2, Lock, Crown, Image as ImageIcon } from "lucide-react"
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
import Link from "next/link"

interface ArtworkListViewProps {
  members: SeriesMember[]
  onReorder: (memberIds: string[]) => Promise<void>
  onRemove: (memberId: string) => Promise<void>
}

function SortableRow({ member, onRemove }: { member: SeriesMember; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)

  // Determine the artwork page URL
  const artworkPageUrl = member.submission_id 
    ? `/vendor/dashboard/artwork-pages/${member.submission_id}`
    : (member as any).product_id
      ? `/vendor/dashboard/artwork-pages/${(member as any).product_id}`
      : null

  return (
    <>
      <TableRow ref={setNodeRef} style={style} className={cn(isDragging && "bg-muted")}>
        {/* Drag Handle */}
        <TableCell className="w-12">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>

        {/* Order */}
        <TableCell className="w-16 text-center text-xs font-mono text-muted-foreground">
          #{member.display_order + 1}
        </TableCell>

        {/* Thumbnail */}
        <TableCell className="w-16">
          <div className="w-10 h-10 rounded overflow-hidden bg-muted border">
            {member.artwork_image ? (
              <img
                src={member.artwork_image}
                alt={member.artwork_title || "Artwork"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </TableCell>

        {/* Title */}
        <TableCell className="font-medium">
          {artworkPageUrl ? (
            <Link href={artworkPageUrl} className="hover:underline">
              {member.artwork_title || "Untitled Artwork"}
            </Link>
          ) : (
            <span>{member.artwork_title || "Untitled Artwork"}</span>
          )}
        </TableCell>

        {/* Status */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant={member.is_locked ? "secondary" : "default"} className="text-xs">
              {member.is_locked ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </>
              ) : (
                "Unlocked"
              )}
            </Badge>
            {member.has_benefits && (
              <div className="flex items-center text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <Crown className="h-3 w-3 mr-1" />
                {member.benefit_count || 1}
              </div>
            )}
          </div>
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRemoveDialogOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Series?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{member.artwork_title || "this artwork"}" from the series?
              The artwork will not be deleted, just removed from this series.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRemove(member.id)
                setRemoveDialogOpen(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function ArtworkListView({ members, onReorder, onRemove }: ArtworkListViewProps) {
  const [localMembers, setLocalMembers] = useState(members)

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = localMembers.findIndex((m) => m.id === active.id)
    const newIndex = localMembers.findIndex((m) => m.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const reordered = arrayMove(localMembers, oldIndex, newIndex)
    setLocalMembers(reordered)

    // Call the reorder API
    try {
      await onReorder(reordered.map((m) => m.id))
    } catch (error) {
      console.error("Error reordering:", error)
      // Revert on error
      setLocalMembers(members)
    }
  }

  // Update local state when members prop changes
  if (members !== localMembers && members.length !== localMembers.length) {
    setLocalMembers(members)
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No artworks in this series yet.</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-16 text-center">Order</TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={localMembers.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {localMembers.map((member) => (
                <SortableRow
                  key={member.id}
                  member={member}
                  onRemove={onRemove}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>
    </DndContext>
  )
}
