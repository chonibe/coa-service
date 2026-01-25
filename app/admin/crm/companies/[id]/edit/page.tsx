"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"





import { Loader2, ArrowLeft, Save } from "lucide-react"


import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
export default function EditCompanyPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    website: "",
    industry: "",
    company_size: "",
    description: "",
    phone: "",
    email: "",
    tags: "",
  })

  useEffect(() => {
    async function fetchCompany() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/crm/companies/${companyId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch company")
        }

        const data = await response.json()
        const company = data.company
        
        setFormData({
          name: company.name || "",
          domain: company.domain || "",
          website: company.website || "",
          industry: company.industry || "",
          company_size: company.company_size || "",
          description: company.description || "",
          phone: company.phone || "",
          email: company.email || "",
          tags: company.tags?.join(", ") || "",
        })
      } catch (err) {
        console.error("Error fetching company:", err)
        alert("Failed to load company")
        router.push(`/admin/crm/companies/${companyId}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (companyId) {
      fetchCompany()
    }
  }, [companyId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert("Company name is required")
      return
    }

    setIsSubmitting(true)

    try {
      const tagsArray = formData.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)

      const response = await fetch(`/api/crm/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain || null,
          website: formData.website || null,
          industry: formData.industry || null,
          company_size: formData.company_size || null,
          description: formData.description || null,
          phone: formData.phone || null,
          email: formData.email || null,
          tags: tagsArray.length > 0 ? tagsArray : [],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update company")
      }

      router.push(`/admin/crm/companies/${companyId}`)
    } catch (err: any) {
      console.error("Error updating company:", err)
      alert(err.message || "Failed to update company")
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
          onClick={() => router.push(`/admin/crm/companies/${companyId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Company
        </Button>
        
        <h1 className="text-2xl font-bold tracking-tight">Edit Company</h1>
        <p className="text-muted-foreground mt-1">
          Update company information
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update information about the company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Technology, Retail, etc."
                />
              </div>
              <div>
                <Label htmlFor="company_size">Company Size</Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                >
                  <SelectTrigger id="company_size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10</SelectItem>
                    <SelectItem value="11-50">11-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-500">201-500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Enterprise, Partner, etc."
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
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/crm/companies/${companyId}`)}
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

