"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { Perk } from "@/types/perks"

export default function PerksAdminPage() {
  const [loading, setLoading] = useState(false)
  const [perks, setPerks] = useState<Perk[]>([])
  const [artistId, setArtistId] = useState("artist123") // In a real app, this would come from auth
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    content: "",
    src: "",
    href: "",
    expires_at: "",
  })

  // Fetch existing perks
  useEffect(() => {
    const fetchPerks = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("perks")
        .select("*")
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching perks:", error)
      } else {
        setPerks(data as Perk[])
      }
      setLoading(false)
    }

    if (artistId) {
      fetchPerks()
    }
  }, [artistId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("perks")
        .insert({
          artist_id: artistId,
          type: formData.type,
          title: formData.title,
          content: formData.content,
          src: formData.src,
          href: formData.href,
          expires_at: formData.expires_at || null,
          is_active: true,
        })
        .select()

      if (error) {
        console.error("Error creating perk:", error)
      } else {
        // Reset form and refresh perks
        setFormData({
          type: "",
          title: "",
          content: "",
          src: "",
          href: "",
          expires_at: "",
        })

        setPerks((prev) => [data[0] as Perk, ...prev])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const deletePerk = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this perk?")
    if (!confirmed) return

    try {
      const { error } = await supabase.from("perks").delete().eq("id", id)

      if (error) {
        console.error("Error deleting perk:", error)
      } else {
        setPerks((prev) => prev.filter((perk) => perk.id !== id))
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Exclusive Content</h1>

      <Tabs defaultValue="current">
        <TabsList className="mb-6">
          <TabsTrigger value="current">Current Content</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Exclusive Content</CardTitle>
                <CardDescription>Manage your current exclusive content for collectors</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : perks.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No exclusive content yet. Create some to engage with your collectors!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {perks.map((perk) => (
                      <div key={perk.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{perk.title || perk.type}</h3>
                          <p className="text-sm text-gray-500">
                            {perk.type.charAt(0).toUpperCase() + perk.type.slice(1)} • Added{" "}
                            {new Date(perk.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => deletePerk(perk.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Exclusive Content</CardTitle>
              <CardDescription>Add new exclusive content for your collectors</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Content Type</Label>
                  <Select value={formData.type} onValueChange={handleSelectChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Message</SelectItem>
                      <SelectItem value="audio">Audio Message</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="code">Discount Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a title for this content"
                  />
                </div>

                {(formData.type === "text" || formData.type === "code") && (
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Enter your message or code"
                      rows={4}
                      required
                    />
                  </div>
                )}

                {(formData.type === "video" || formData.type === "audio") && (
                  <div className="space-y-2">
                    <Label htmlFor="src">Media URL</Label>
                    <Input
                      id="src"
                      name="src"
                      value={formData.src}
                      onChange={handleInputChange}
                      placeholder="Enter URL to your media file"
                      required
                    />
                  </div>
                )}

                {formData.type === "link" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="content">Description</Label>
                      <Textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Enter a description for this link"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="href">Link URL</Label>
                      <Input
                        id="href"
                        name="href"
                        value={formData.href}
                        onChange={handleInputChange}
                        placeholder="Enter the URL"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration (Optional)</Label>
                  <Input
                    id="expires_at"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleInputChange}
                    type="date"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Exclusive Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
