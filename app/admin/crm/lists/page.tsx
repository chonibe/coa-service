"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, List, Trash2, Edit2, Users, Building2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface List {
  id: string
  name: string
  description: string | null
  object_type: string
  color: string | null
  icon: string | null
  is_system: boolean
  created_at: string
}

export default function ListsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [objectType, setObjectType] = useState<"person" | "company" | "all">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    object_type: "person" as "person" | "company",
    color: "",
    icon: "",
  })

  useEffect(() => {
    fetchLists()
  }, [objectType])

  const fetchLists = async () => {
    try {
      setIsLoading(true)
      let url = "/api/crm/lists"
      if (objectType !== "all") {
        url += `?object_type=${objectType}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch lists")
      }

      const data = await response.json()
      setLists(data.lists || [])
    } catch (err: any) {
      console.error("Error fetching lists:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load lists",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "List name is required",
      })
      return
    }

    try {
      const response = await fetch("/api/crm/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create list")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "List created",
      })

      setIsDialogOpen(false)
      setFormData({ name: "", description: "", object_type: "person", color: "", icon: "" })
      fetchLists()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create list",
      })
    }
  }

  const handleDelete = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this list? All entries will be deleted.")) {
      return
    }

    try {
      const response = await fetch(`/api/crm/lists/${listId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete list")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "List deleted",
      })

      fetchLists()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete list",
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lists</h1>
          <p className="text-muted-foreground mt-1">
            Organize records into lists with custom attributes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({ name: "", description: "", object_type: "person", color: "", icon: "" })
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Create a list to group and organize records
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">List Name *</Label>
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
              <div>
                <Label htmlFor="object_type">Record Type *</Label>
                <Select
                  value={formData.object_type}
                  onValueChange={(value) => setFormData({ ...formData, object_type: value as "person" | "company" })}
                >
                  <SelectTrigger id="object_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">People</SelectItem>
                    <SelectItem value="company">Companies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by object type */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by type:</Label>
            <Select value={objectType} onValueChange={(value) => setObjectType(value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lists</SelectItem>
                <SelectItem value="person">People Lists</SelectItem>
                <SelectItem value="company">Company Lists</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No lists found. Create your first list to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card
              key={list.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/admin/crm/lists/${list.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {list.object_type === "person" ? (
                      <Users className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                    <CardTitle>{list.name}</CardTitle>
                  </div>
                  {list.is_system && (
                    <Badge variant="outline" className="text-xs">System</Badge>
                  )}
                </div>
                {list.description && (
                  <CardDescription>{list.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {list.object_type === "person" ? "People" : "Companies"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/crm/lists/${list.id}`)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {!list.is_system && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(list.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

