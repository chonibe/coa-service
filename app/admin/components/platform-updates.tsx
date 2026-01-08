"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  Plus, 
  Sparkles, 
  Wrench, 
  ArrowUpCircle, 
  Info, 
  ChevronRight, 
  AlertTriangle,
  History,
  Code,
  Users
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlatformUpdate {
  id: string
  title: string
  description: string
  category: "feature" | "fix" | "improvement" | "update"
  version?: string
  stakeholder_summary?: string
  technical_details?: string
  impact_level: "low" | "medium" | "high" | "critical"
  is_breaking: boolean
  created_at: string
}

export function PlatformUpdates() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<PlatformUpdate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("feature")
  const [version, setVersion] = useState("")
  const [stakeholderSummary, setStakeholderSummary] = useState("")
  const [technicalDetails, setTechnicalDetails] = useState("")
  const [impactLevel, setImpactLevel] = useState<string>("low")
  const [isBreaking, setIsBreaking] = useState(false)

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
        description: "Could not load release notes.",
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
        body: JSON.stringify({ 
          title, 
          description, 
          category, 
          version,
          stakeholder_summary: stakeholderSummary || description,
          technical_details: technicalDetails,
          impact_level: impactLevel,
          is_breaking: isBreaking
        }),
      })

      if (!response.ok) throw new Error("Failed to create release note")

      toast({
        title: "Success",
        description: "Release note published successfully.",
      })

      setIsFormOpen(false)
      // Reset form
      setTitle("")
      setDescription("")
      setCategory("feature")
      setVersion("")
      setStakeholderSummary("")
      setTechnicalDetails("")
      setImpactLevel("low")
      setIsBreaking(false)
      
      // Refresh list
      fetchUpdates()
    } catch (error) {
      console.error("Error creating update:", error)
      toast({
        title: "Error",
        description: "Failed to publish release note.",
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

  const getImpactBadge = (level: string) => {
    if (level === "critical") return <Badge variant="destructive" className="text-[10px] h-4">CRITICAL</Badge>
    if (level === "high") return <Badge variant="destructive" className="bg-orange-500 text-[10px] h-4">HIGH</Badge>
    return null
  }

  return (
    <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-500" />
            <div>
              <CardTitle className="text-base">Release Notes</CardTitle>
              <CardDescription>Latest platform improvements</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add release note</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Publish Release Note</DialogTitle>
                    <DialogDescription>
                      Share new features, fixes, or improvements with the team and stakeholders.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Release Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unified Ledger System" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="version">Version</Label>
                        <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.2.0" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="feature">Feature</SelectItem>
                            <SelectItem value="improvement">Improvement</SelectItem>
                            <SelectItem value="fix">Fix</SelectItem>
                            <SelectItem value="update">General Update</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="impact">Impact Level</Label>
                        <Select value={impactLevel} onValueChange={setImpactLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select impact" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Impact</SelectItem>
                            <SelectItem value="medium">Medium Impact</SelectItem>
                            <SelectItem value="high">High Impact</SelectItem>
                            <SelectItem value="critical">Critical Impact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-md border">
                      <Checkbox 
                        id="is-breaking" 
                        checked={isBreaking} 
                        onCheckedChange={(checked) => setIsBreaking(checked as boolean)} 
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="is-breaking"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          Contains Breaking Changes
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Mark this if the update requires manual action or changes existing behavior.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="stakeholder-summary">Stakeholder Summary (Business Impact)</Label>
                      <Textarea 
                        id="stakeholder-summary" 
                        value={stakeholderSummary} 
                        onChange={(e) => setStakeholderSummary(e.target.value)} 
                        placeholder="What does this mean for the business and users?" 
                        className="min-h-[100px]"
                        required 
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="technical-details">Technical Details (For Developers)</Label>
                      <Textarea 
                        id="technical-details" 
                        value={technicalDetails} 
                        onChange={(e) => setTechnicalDetails(e.target.value)} 
                        placeholder="Internal notes, schema changes, API updates..." 
                        className="min-h-[100px] font-mono text-sm"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Publish Release Note
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent release notes.</p>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <button 
                key={update.id} 
                onClick={() => setSelectedUpdate(update)}
                className="w-full text-left flex flex-col gap-1 rounded-md border bg-muted/30 p-3 text-sm transition-all hover:bg-muted/50 hover:border-blue-200/50 dark:hover:border-blue-800/50 border-slate-200/60 dark:border-slate-800/60 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium">
                    {getCategoryIcon(update.category)}
                    <span className="truncate max-w-[140px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{update.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getImpactBadge(update.impact_level)}
                    {update.is_breaking && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                    {update.version && (
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        v{update.version}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-2 mt-1 text-xs">
                  {update.stakeholder_summary || update.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(update.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                  <Badge variant="outline" className="text-[9px] h-4 uppercase py-0">{update.category}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Release Note Detail Dialog */}
        <Dialog open={!!selectedUpdate} onOpenChange={(open) => !open && setSelectedUpdate(null)}>
          <DialogContent className="max-w-2xl">
            {selectedUpdate && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(selectedUpdate.category)}
                    <Badge variant="outline" className="capitalize text-[10px]">{selectedUpdate.category}</Badge>
                    {getImpactBadge(selectedUpdate.impact_level)}
                    {selectedUpdate.version && (
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                        v{selectedUpdate.version}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-2xl">{selectedUpdate.title}</DialogTitle>
                  <DialogDescription>
                    Published on {new Date(selectedUpdate.created_at).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="stakeholders" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stakeholders" className="gap-2">
                      <Users className="h-4 w-4" />
                      Stakeholders
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="gap-2">
                      <Code className="h-4 w-4" />
                      Technical
                    </TabsTrigger>
                  </TabsList>
                  <div className="mt-4 max-h-[40vh] overflow-y-auto pr-2">
                    <TabsContent value="stakeholders" className="mt-0">
                      <div className="prose prose-sm dark:prose-invert">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {selectedUpdate.stakeholder_summary || selectedUpdate.description}
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="technical" className="mt-0">
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {selectedUpdate.technical_details || "No technical details provided for this release."}
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setSelectedUpdate(null)}>Close</Button>
                  <Button asChild>
                    <Link href="/admin/release-notes">View Full History</Link>
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
        <div className="pt-2 border-t">
          <Button variant="ghost" size="sm" asChild className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 group">
            <Link href="/admin/release-notes">
              View all release notes
              <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
