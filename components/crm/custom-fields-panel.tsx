"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface CustomField {
  id: string
  field_name: string
  field_type: string
  entity_type: string
  is_required: boolean
  options?: string[]
}

interface CustomFieldValue {
  field_id: string
  field_name: string
  field_type: string
  value: any
}

interface CustomFieldsPanelProps {
  entityType: "person" | "company"
  entityId: string
}

export function CustomFieldsPanel({ entityType, entityId }: CustomFieldsPanelProps) {
  const { toast } = useToast()
  const [fields, setFields] = useState<CustomField[]>([])
  const [values, setValues] = useState<Record<string, CustomFieldValue>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<any>("")

  useEffect(() => {
    fetchFieldsAndValues()
  }, [entityType, entityId])

  const fetchFieldsAndValues = async () => {
    try {
      setIsLoading(true)

      // Fetch field definitions
      const fieldsResponse = await fetch(`/api/crm/fields?entity_type=${entityType}`)
      if (!fieldsResponse.ok) {
        throw new Error("Failed to fetch fields")
      }
      const fieldsData = await fieldsResponse.json()
      setFields(fieldsData.fields || [])

      // Fetch field values for this entity
      const valuesResponse = await fetch(
        `/api/crm/fields/values?entity_type=${entityType}&entity_id=${entityId}`
      )
      if (valuesResponse.ok) {
        const valuesData = await valuesResponse.json()
        const valuesMap: Record<string, CustomFieldValue> = {}
        ;(valuesData.values || []).forEach((v: any) => {
          valuesMap[v.field_id] = v
        })
        setValues(valuesMap)
      }
    } catch (err) {
      console.error("Error fetching fields and values:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveValue = async (fieldId: string) => {
    try {
      const field = fields.find((f) => f.id === fieldId)
      if (!field) return

      const response = await fetch("/api/crm/fields/values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: fieldId,
          entity_type: entityType,
          entity_id: entityId,
          value: editValue,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save value")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "Field value saved",
      })

      setEditingField(null)
      fetchFieldsAndValues()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save value",
      })
    }
  }

  const handleDeleteValue = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field value?")) {
      return
    }

    try {
      const response = await fetch(
        `/api/crm/fields/values?field_id=${fieldId}&entity_type=${entityType}&entity_id=${entityId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete value")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "Field value deleted",
      })

      fetchFieldsAndValues()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete value",
      })
    }
  }

  const renderFieldInput = (field: CustomField, currentValue: any) => {
    const value = editingField === field.id ? editValue : currentValue

    switch (field.field_type) {
      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`Enter ${field.field_name}`}
          />
        )
      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${field.field_name}`}
          />
        )
      case "boolean":
        return (
          <Select
            value={value !== null ? String(value) : ""}
            onValueChange={(val) => setEditValue(val === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )
      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={(val) => setEditValue(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.field_name}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "date":
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split("T")[0] : ""}
            onChange={(e) => setEditValue(e.target.value)}
          />
        )
      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`Enter ${field.field_name}`}
          />
        )
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
          <CardDescription>
            No custom fields defined. Create fields in Settings → Custom Fields.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Fields</CardTitle>
        <CardDescription>
          Manage custom field values for this {entityType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const currentValue = values[field.id]
          const isEditing = editingField === field.id

          return (
            <div key={field.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    {field.field_name}
                    {field.is_required && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Required
                      </Badge>
                    )}
                  </Label>
                  <div className="text-xs text-muted-foreground mt-1">
                    {field.field_type}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingField(field.id)
                          setEditValue(currentValue?.value ?? null)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {currentValue && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteValue(field.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {renderFieldInput(field, currentValue?.value)}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveValue(field.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingField(null)
                        setEditValue("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {currentValue ? (
                    <span>{String(currentValue.value)}</span>
                  ) : (
                    <span className="italic">No value set</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

