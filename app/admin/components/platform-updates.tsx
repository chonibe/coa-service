"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Sparkles, Wrench, ArrowUpCircle, Info } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface PlatformUpdate {
  id: string
  title: string
  description: string
  category: "feature" | "fix" | "improvement" | "update"
  version?: string
  created_at: string
}

export function PlatformUpdates() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("feature")
  const [version, setVersion] = useState("")

  const fetchUpdates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/platform-updates?limit=5")
      if (!response.ok) throw new Error("Failed to fetch updates")
      const data = await response.json()
      setUpdates(data.updates || [])
    } catch (error) {
      console.error("Error fetching updates:", error)
      toast({
        title: "Error",
        description: "Could not load platform updates.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/platform-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, version }),
      })

      if (!response.ok) throw new Error("Failed to create update")

      toast({
        title: "Success",
        description: "Platform update published successfully.",
      })

      setIsFormOpen(false)
      // Reset form
      setTitle("")
      setDescription("")
      setCategory("feature")
      setVersion("")
      
      // Refresh list
      fetchUpdates()
    } catch (error) {
      console.error("Error creating update:", error)
      toast({
        title: "Error",
        description: "Failed to publish update.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "feature": return <Sparkles className="h-4 w-4 text-amber-500" />
      case "fix": return <Wrench className="h-4 w-4 text-emerald-500" />
      case "improvement": return <ArrowUpCircle className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4 text-slate-500" />
    }
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "feature": return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Feature</Badge>
      case "fix": return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Fix</Badge>
      case "improvement": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Improvement</Badge>
      default: return <Badge variant="outline">Update</Badge>
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Platform Updates</CardTitle>
            <CardDescription>Latest changes and improvements</CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add update</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Platform Update</DialogTitle>
                  <DialogDescription>
                    Publish a new update or feature announcement to the dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New Analytics Dashboard" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="fix">Fix</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="update">General Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="version">Version (optional)</Label>
                    <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.2.0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's new?" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Publish Update
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent updates.</p>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="flex flex-col gap-1 rounded-md border bg-muted/30 p-3 text-sm transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium">
                    {getCategoryIcon(update.category)}
                    <span>{update.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {update.version && (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                        v{update.version}
                      </span>
                    )}
                    {getCategoryBadge(update.category)}
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-2 mt-1">
                  {update.description}
                </p>
                <div className="mt-2 text-[10px] text-slate-400">
                  {new Date(update.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={fetchUpdates}>
          Refresh logs
        </Button>
      </CardContent>
    </Card>
  )
}

