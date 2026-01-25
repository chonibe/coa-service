"use client"

import { useState, useEffect } from "react"






import { Loader2, Plus, Star, StarOff, Share2, Trash2, Edit2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui"
interface SavedView {
  id: string
  name: string
  description: string | null
  entity_type: string
  filter_config: any
  sort_config: Array<{ field: string; direction: "asc" | "desc" }> | null
  column_config: any | null
  is_shared: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

interface SavedViewsProps {
  entityType: "person" | "company" | "conversation" | "activity"
  currentFilters?: any
  currentSort?: Array<{ field: string; direction: "asc" | "desc" }>
  onViewSelect: (view: SavedView) => void
}

export function SavedViews({ entityType, currentFilters, currentSort, onViewSelect }: SavedViewsProps) {
  const { toast } = useToast()
  const [views, setViews] = useState<SavedView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingView, setEditingView] = useState<SavedView | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_shared: false,
    is_default: false,
  })

  useEffect(() => {
    fetchViews()
  }, [entityType])

  const fetchViews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/crm/saved-views?entity_type=${entityType}`)
      if (!response.ok) {
        throw new Error("Failed to fetch saved views")
      }
      const data = await response.json()
      setViews(data.views || [])
    } catch (err) {
      console.error("Error fetching saved views:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load saved views",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingView
        ? `/api/crm/saved-views/${editingView.id}`
        : "/api/crm/saved-views"
      
      const method = editingView ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          entity_type: entityType,
          filter_config: currentFilters || {},
          sort_config: currentSort || null,
          column_config: null, // Can be added later
          is_shared: formData.is_shared,
          is_default: formData.is_default,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save view")
      }

      toast({
        variant: "success",
        title: "Success",
        description: editingView ? "View updated" : "View saved",
      })

      setIsDialogOpen(false)
      setEditingView(null)
      setFormData({ name: "", description: "", is_shared: false, is_default: false })
      fetchViews()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save view",
      })
    }
  }

  const handleDelete = async (viewId: string) => {
    if (!confirm("Are you sure you want to delete this saved view?")) {
      return
    }

    try {
      const response = await fetch(`/api/crm/saved-views/${viewId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete view")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "View deleted",
      })

      fetchViews()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete view",
      })
    }
  }

  const handleSetDefault = async (viewId: string) => {
    try {
      const response = await fetch(`/api/crm/saved-views/${viewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      })

      if (!response.ok) {
        throw new Error("Failed to set default view")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "Default view updated",
      })

      fetchViews()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to set default view",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Views</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                setEditingView(null)
                setFormData({
                  name: "",
                  description: "",
                  is_shared: false,
                  is_default: false,
                })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Save View
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingView ? "Edit View" : "Save Current View"}</DialogTitle>
              <DialogDescription>
                Save your current filters and sort as a reusable view
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., High Value Customers"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  />
                  <span className="text-sm">Share with team</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  />
                  <span className="text-sm">Set as default</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!formData.name}>
                  {editingView ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {views.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No saved views. Create one to quickly access your favorite filter combinations.
        </div>
      ) : (
        <div className="space-y-2">
          {views.map((view) => (
            <Card key={view.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onViewSelect(view)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{view.name}</h4>
                      {view.is_default && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {view.is_shared && (
                        <Badge variant="secondary" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                    {view.description && (
                      <p className="text-sm text-muted-foreground mb-2">{view.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {Object.keys(view.filters || {}).length > 0 && (
                        <span>{Object.keys(view.filters).length} filter(s)</span>
                      )}
                      {view.sort && view.sort.length > 0 && (
                        <span className="ml-2">{view.sort.length} sort(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!view.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetDefault(view.id)
                        }}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingView(view)
                        setFormData({
                          name: view.name,
                          description: view.description || "",
                          is_shared: view.is_shared,
                          is_default: view.is_default,
                        })
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(view.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

