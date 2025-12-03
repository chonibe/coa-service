"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, MoreVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

interface KanbanColumn {
  status: string
  label: string
  records: any[]
  count: number
}

interface KanbanBoardProps {
  entityType: "person" | "company"
  statusFieldId: string
  filters?: any
  onRecordClick?: (recordId: string) => void
  onStatusChange?: (recordId: string, newStatus: string) => void
}

export function KanbanBoard({
  entityType,
  statusFieldId,
  filters,
  onRecordClick,
  onStatusChange,
}: KanbanBoardProps) {
  const { toast } = useToast()
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusField, setStatusField] = useState<any>(null)

  const fetchKanbanData = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        entity_type: entityType,
        status_field_id: statusFieldId,
      })

      if (filters) {
        queryParams.append("filters", JSON.stringify(filters))
      }

      const response = await fetch(`/api/crm/kanban?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch kanban data")
      }

      const data = await response.json()
      setColumns(data.columns || [])
      setStatusField(data.status_field)
    } catch (error: any) {
      console.error("Error fetching kanban data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load kanban board",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKanbanData()
  }, [entityType, statusFieldId, JSON.stringify(filters)])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return // Dropped outside a droppable area
    }

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId) {
      return // Same column, no change needed
    }

    const recordId = draggableId
    const newStatus = destination.droppableId

    // Optimistically update UI
    const newColumns = columns.map((col) => {
      if (col.status === source.droppableId) {
        return {
          ...col,
          records: col.records.filter((r) => r.id !== recordId),
          count: col.count - 1,
        }
      }
      if (col.status === newStatus) {
        const record = columns
          .find((c) => c.status === source.droppableId)
          ?.records.find((r) => r.id === recordId)
        if (record) {
          return {
            ...col,
            records: [...col.records, record],
            count: col.count + 1,
          }
        }
      }
      return col
    })
    setColumns(newColumns)

    // Update status via API
    try {
      const response = await fetch(`/api/crm/${entityType === "person" ? "people" : "companies"}/${recordId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: statusFieldId,
          value: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      if (onStatusChange) {
        onStatusChange(recordId, newStatus)
      }

      toast({
        variant: "success",
        title: "Status Updated",
        description: "Record status has been updated successfully",
      })
    } catch (error: any) {
      // Revert optimistic update
      fetchKanbanData()
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update status",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (columns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No status columns found. Please configure a status field first.</p>
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <Droppable key={column.status} droppableId={column.status}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-shrink-0 w-80 ${
                  snapshot.isDraggingOver ? "bg-muted/50" : ""
                }`}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {column.label}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({column.count})
                        </span>
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => fetchKanbanData()}>
                            Refresh
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {column.records.map((record, index) => (
                      <Draggable
                        key={record.id}
                        draggableId={record.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                            onClick={() => {
                              if (onRecordClick) {
                                onRecordClick(record.id)
                              }
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {entityType === "person"
                                    ? `${record.first_name || ""} ${record.last_name || ""}`.trim() ||
                                      record.email ||
                                      "Unnamed"
                                    : record.name || "Unnamed Company"}
                                </div>
                                {entityType === "person" && record.email && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {record.email}
                                  </div>
                                )}
                                {entityType === "company" && record.domain && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {record.domain}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CardContent>
                </Card>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}

