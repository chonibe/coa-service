"use client"

import { useState, useEffect } from "react"



import { 
  Loader2, 
  Sparkles, 
  Wrench, 
  ArrowUpCircle, 
  Info, 
  Search, 
  ChevronLeft, 
  Filter, 
  AlertTriangle,
  Code,
  Users
} from "lucide-react"


import { useToast } from "@/hooks/use-toast"
import Link from "next/link"


import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
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

export default function ReleaseNotesPage() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [impactFilter, setImpactFilter] = useState("all")
  const { toast } = useToast()

  const fetchUpdates = async () => {
    try {
      setIsLoading(true)
      const url = `/api/admin/platform-updates?limit=100&category=${categoryFilter}&impact=${impactFilter}`
      const response = await fetch(url)
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
  }, [categoryFilter, impactFilter])

  const filteredUpdates = updates.filter(update => 
    update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (update.version && update.version.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "feature": return <Sparkles className="h-5 w-5 text-amber-500" />
      case "fix": return <Wrench className="h-5 w-5 text-emerald-500" />
      case "improvement": return <ArrowUpCircle className="h-5 w-5 text-blue-500" />
      default: return <Info className="h-5 w-5 text-slate-500" />
    }
  }

  const getImpactBadge = (level: string) => {
    switch (level) {
      case "critical": return <Badge variant="destructive">Critical Impact</Badge>
      case "high": return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">High Impact</Badge>
      case "medium": return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Medium Impact</Badge>
      default: return <Badge variant="secondary">Low Impact</Badge>
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-10 px-4">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild className="-ml-2 h-8">
                <Link href="/admin">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Release Notes</h1>
            <p className="text-muted-foreground mt-1">
              Structured log of all platform features, improvements, and fixes.
            </p>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search release notes, versions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      <SelectValue placeholder="Category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="feature">Features</SelectItem>
                    <SelectItem value="improvement">Improvements</SelectItem>
                    <SelectItem value="fix">Fixes</SelectItem>
                    <SelectItem value="update">Updates</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={impactFilter} onValueChange={setImpactFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      <SelectValue placeholder="Impact" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Impact</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-muted-foreground animate-pulse">Loading release history...</p>
            </div>
          ) : filteredUpdates.length === 0 ? (
            <Card className="border-dashed py-20 flex flex-col items-center justify-center">
              <Info className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="font-semibold text-lg">No release notes found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setImpactFilter("all"); }}>
                Clear all filters
              </Button>
            </Card>
          ) : (
            filteredUpdates.map((update) => (
              <Card key={update.id} className="overflow-hidden border-slate-200/60 dark:border-slate-800/60 shadow-md">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b pb-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                        {getCategoryIcon(update.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl">{update.title}</CardTitle>
                          {update.version && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              v{update.version}
                            </span>
                          )}
                          {update.is_breaking && (
                            <Badge variant="destructive" className="animate-pulse">Breaking Change</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          {new Date(update.created_at).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getImpactBadge(update.impact_level)}
                      <Badge variant="outline" className="capitalize">{update.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="stakeholders" className="w-full">
                    <TabsList className="w-full justify-start h-12 rounded-none bg-white dark:bg-slate-900 border-b px-6">
                      <TabsTrigger value="stakeholders" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent">
                        <Users className="h-4 w-4" />
                        Stakeholder Summary
                      </TabsTrigger>
                      <TabsTrigger value="technical" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent">
                        <Code className="h-4 w-4" />
                        Technical Details
                      </TabsTrigger>
                    </TabsList>
                    <div className="p-6">
                      <TabsContent value="stakeholders" className="mt-0 focus-visible:ring-0">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {update.stakeholder_summary || update.description}
                          </p>
                        </div>
                      </TabsContent>
                      <TabsContent value="technical" className="mt-0 focus-visible:ring-0">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                          <p className="text-sm font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                            {update.technical_details || "No technical details provided for this release."}
                          </p>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

