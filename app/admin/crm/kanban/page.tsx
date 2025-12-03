"use client"

import { useState, useEffect } from "react"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function KanbanPage() {
  const router = useRouter()
  const [entityType, setEntityType] = useState<"person" | "company">("person")
  const [statusFields, setStatusFields] = useState<any[]>([])
  const [selectedStatusFieldId, setSelectedStatusFieldId] = useState<string>("")
  const [isLoadingFields, setIsLoadingFields] = useState(true)

  useEffect(() => {
    fetchStatusFields()
  }, [entityType])

  const fetchStatusFields = async () => {
    setIsLoadingFields(true)
    try {
      const response = await fetch(`/api/crm/fields?entity_type=${entityType}&attribute_type=status`)
      if (!response.ok) {
        throw new Error("Failed to fetch status fields")
      }
      const data = await response.json()
      setStatusFields(data.fields || [])
      if (data.fields && data.fields.length > 0 && !selectedStatusFieldId) {
        setSelectedStatusFieldId(data.fields[0].id)
      }
    } catch (error) {
      console.error("Error fetching status fields:", error)
    } finally {
      setIsLoadingFields(false)
    }
  }

  if (isLoadingFields) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (statusFields.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Status Fields Found</CardTitle>
            <CardDescription>
              Create a status field for {entityType === "person" ? "people" : "companies"} to use the kanban board.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => router.push(`/admin/crm/settings/fields?entity_type=${entityType}`)}
              className="text-primary hover:underline"
            >
              Create Status Field →
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-muted-foreground">
            Visualize and manage {entityType === "person" ? "people" : "companies"} by status
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={entityType} onValueChange={(value) => setEntityType(value as "person" | "company")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="person">People</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatusFieldId} onValueChange={setSelectedStatusFieldId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select status field" />
            </SelectTrigger>
            <SelectContent>
              {statusFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.field_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedStatusFieldId && (
        <KanbanBoard
          entityType={entityType}
          statusFieldId={selectedStatusFieldId}
          onRecordClick={(recordId) => {
            router.push(`/admin/crm/${entityType === "person" ? "people" : "companies"}/${recordId}`)
          }}
        />
      )}
    </div>
  )
}


