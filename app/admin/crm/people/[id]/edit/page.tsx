"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"





import { Loader2, ArrowLeft, Save } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea } from "@/components/ui"
export default function EditPersonPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    company_id: "",
    tags: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchPerson() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/crm/people/${personId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch person")
        }

        const data = await response.json()
        const person = data.person
        
        setFormData({
          email: person.email || "",
          first_name: person.first_name || "",
          last_name: person.last_name || "",
          phone: person.phone || "",
          company_id: person.company_id || "",
          tags: person.tags?.join(", ") || "",
          notes: person.notes || "",
        })
      } catch (err) {
        console.error("Error fetching person:", err)
        alert("Failed to load person")
        router.push(`/admin/crm/people/${personId}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (personId) {
      fetchPerson()
    }
  }, [personId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const tagsArray = formData.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)

      const response = await fetch(`/api/crm/people/${personId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email || null,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          phone: formData.phone || null,
          company_id: formData.company_id || null,
          tags: tagsArray.length > 0 ? tagsArray : [],
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update person")
      }

      router.push(`/admin/crm/people/${personId}`)
    } catch (err: any) {
      console.error("Error updating person:", err)
      alert(err.message || "Failed to update person")
      setIsSubmitting(false)
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/crm/people/${personId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Person
        </Button>
        
        <h1 className="text-2xl font-bold tracking-tight">Edit Person</h1>
        <p className="text-muted-foreground mt-1">
          Update contact information
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update contact information for this person
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="VIP, Customer, Lead"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/crm/people/${personId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

