"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface CustomField {
  id: string
  field_name: string
  display_name: string
  field_type: string
  entity_type: string
  is_required: boolean
  is_unique: boolean
  default_value: string | null
  options: any
  display_order: number
  is_active: boolean
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityType, setEntityType] = useState<string>("person")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)

  useEffect(() => {
    fetchFields()
  }, [entityType])

  const fetchFields = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/crm/fields?entity_type=${entityType}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fields: ${response.statusText}`)
      }

      const data = await response.json()
      setFields(data.fields || [])
    } catch (err: any) {
      console.error("Error fetching fields:", err)
      setError(err.message || "Failed to load custom fields")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field? This will also delete all field values.")) {
      return
    }

    try {
      const response = await fetch(`/api/crm/fields/${fieldId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete field")
      }

      fetchFields()
    } catch (err: any) {
      console.error("Error deleting field:", err)
      alert(err.message || "Failed to delete field")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Fields</h1>
          <p className="text-muted-foreground mt-1">
            Define custom fields for your CRM entities
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingField(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingField ? "Edit Field" : "Create Custom Field"}</DialogTitle>
              <DialogDescription>
                Define a new custom field for {entityType} records
              </DialogDescription>
            </DialogHeader>
            <CustomFieldForm
              entityType={entityType}
              field={editingField}
              onSuccess={() => {
                setIsDialogOpen(false)
                setEditingField(null)
                fetchFields()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Entity Type Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="entity-type">Entity Type:</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger id="entity-type" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="conversation">Conversation</SelectItem>
                <SelectItem value="order">Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Fields List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Custom Fields for {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom fields defined. Click "Add Field" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{field.display_name}</span>
                      <Badge variant="outline">{field.field_type}</Badge>
                      {field.is_required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                      {field.is_unique && (
                        <Badge variant="secondary" className="text-xs">Unique</Badge>
                      )}
                      {!field.is_active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Internal name: <code className="text-xs bg-muted px-1 rounded">{field.field_name}</code>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingField(field)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(field.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CustomFieldForm({
  entityType,
  field,
  onSuccess,
}: {
  entityType: string
  field: CustomField | null
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    field_name: field?.field_name || "",
    display_name: field?.display_name || "",
    field_type: field?.field_type || "text",
    is_required: field?.is_required || false,
    is_unique: field?.is_unique || false,
    default_value: field?.default_value || "",
    options: field?.options || null,
    display_order: field?.display_order || 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = field
        ? `/api/crm/fields/${field.id}`
        : "/api/crm/fields"
      
      const method = field ? "PUT" : "POST"

      const body = {
        ...formData,
        entity_type: entityType,
        options: formData.field_type === "select" || formData.field_type === "multi_select"
          ? formData.options
          : null,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to save field")
      }

      onSuccess()
    } catch (err: any) {
      console.error("Error saving field:", err)
      alert(err.message || "Failed to save field")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="display_name">Display Name *</Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="field_name">Internal Name *</Label>
        <Input
          id="field_name"
          value={formData.field_name}
          onChange={(e) => setFormData({ ...formData, field_name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
          required
          placeholder="e.g., custom_field_name"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Used internally (snake_case, no spaces)
        </p>
      </div>

      <div>
        <Label htmlFor="field_type">Field Type *</Label>
        <Select
          value={formData.field_type}
          onValueChange={(value) => setFormData({ ...formData, field_type: value })}
        >
          <SelectTrigger id="field_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="select">Select (Single)</SelectItem>
            <SelectItem value="multi_select">Multi-Select</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(formData.field_type === "select" || formData.field_type === "multi_select") && (
        <div>
          <Label htmlFor="options">Options (JSON array)</Label>
          <Input
            id="options"
            value={formData.options ? JSON.stringify(formData.options) : ""}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                setFormData({ ...formData, options: parsed })
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder='["Option 1", "Option 2", "Option 3"]'
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_required}
            onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
          />
          <span className="text-sm">Required</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_unique}
            onChange={(e) => setFormData({ ...formData, is_unique: e.target.checked })}
          />
          <span className="text-sm">Unique</span>
        </label>
      </div>

      <div>
        <Label htmlFor="default_value">Default Value</Label>
        <Input
          id="default_value"
          value={formData.default_value}
          onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            field ? "Update" : "Create"
          )}
        </Button>
      </div>
    </form>
  )
}

