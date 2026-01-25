"use client"

import { useState } from "react"






import { Loader2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
interface ActivityCreatorProps {
  customerId?: string
  companyId?: string
  onActivityCreated?: () => void
}

export function ActivityCreator({ customerId, companyId, onActivityCreated }: ActivityCreatorProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    activity_type: "note",
    title: "",
    description: "",
    due_date: "",
    priority: "normal",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title is required",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: formData.activity_type,
          title: formData.title,
          description: formData.description || null,
          customer_id: customerId || null,
          company_id: companyId || null,
          due_date: formData.due_date || null,
          priority: formData.priority,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create activity")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "Activity created successfully",
      })

      // Reset form
      setFormData({
        activity_type: "note",
        title: "",
        description: "",
        due_date: "",
        priority: "normal",
      })
      setIsOpen(false)

      if (onActivityCreated) {
        onActivityCreated()
      }
    } catch (err: any) {
      console.error("Error creating activity:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create activity",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Plus className="mr-2 h-4 w-4" />
        Add Activity
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Activity</CardTitle>
        <CardDescription>
          Add a note, task, call, or meeting to track interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="activity_type">Activity Type</Label>
            <Select
              value={formData.activity_type}
              onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
            >
              <SelectTrigger id="activity_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {(formData.activity_type === "task" || formData.activity_type === "meeting") && (
            <>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setFormData({
                  activity_type: "note",
                  title: "",
                  description: "",
                  due_date: "",
                  priority: "normal",
                })
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Activity
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

