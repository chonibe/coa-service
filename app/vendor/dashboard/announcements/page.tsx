"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Megaphone, 
  Send, 
  Users, 
  Grid3x3, 
  Crown,
  Plus,
  Clock,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  Button,
  Textarea,
  Input,
  Label,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"

interface Announcement {
  id: string
  title: string
  message: string
  audience: "all" | "artwork" | "series" | "vip"
  targetId?: string
  targetName?: string
  sentAt: string
  recipientCount: number
  status: "sent" | "pending" | "failed"
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  
  // Composer state
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState<"all" | "artwork" | "series" | "vip">("all")
  const [targetId, setTargetId] = useState("")
  
  // Available targets (mock data - would be fetched from API)
  const [availableArtworks, setAvailableArtworks] = useState<Array<{ id: string; name: string }>>([])
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchAnnouncements()
    fetchTargets()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/vendor/announcements", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (err) {
      console.error("Error fetching announcements:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTargets = async () => {
    try {
      // Fetch vendor's products/submissions
      const productsResponse = await fetch("/api/vendor/products/submissions", {
        credentials: "include",
      })
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        const artworks = (productsData.submissions || []).map((s: any) => ({
          id: s.id,
          name: s.title || s.name || "Untitled",
        }))
        setAvailableArtworks(artworks)
      }
    } catch (err) {
      console.error("Error fetching artworks for announcements:", err)
    }

    try {
      // Fetch vendor's series
      const seriesResponse = await fetch("/api/vendor/series", {
        credentials: "include",
      })
      if (seriesResponse.ok) {
        const seriesData = await seriesResponse.json()
        const series = (seriesData.series || []).map((s: any) => ({
          id: s.id,
          name: s.name || "Untitled Series",
        }))
        setAvailableSeries(series)
      }
    } catch (err) {
      console.error("Error fetching series for announcements:", err)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a title and message",
      })
      return
    }

    if ((audience === "artwork" || audience === "series") && !targetId) {
      toast({
        variant: "destructive",
        title: "Missing target",
        description: `Please select a ${audience} to send this announcement to`,
      })
      return
    }

    try {
      setIsSending(true)
      
      const response = await fetch("/api/vendor/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          message,
          audience,
          targetId: targetId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send announcement")
      }

      const data = await response.json()
      
      toast({
        title: "Announcement sent!",
        description: `Your message was sent to ${data.recipientCount} collectors`,
      })

      // Reset form
      setTitle("")
      setMessage("")
      setAudience("all")
      setTargetId("")
      setShowComposer(false)
      
      // Refresh list
      fetchAnnouncements()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send announcement",
      })
    } finally {
      setIsSending(false)
    }
  }

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "all":
        return <Users className="h-4 w-4" />
      case "artwork":
        return <Megaphone className="h-4 w-4" />
      case "series":
        return <Grid3x3 className="h-4 w-4" />
      case "vip":
        return <Crown className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "all":
        return "All Collectors"
      case "artwork":
        return "Artwork Collectors"
      case "series":
        return "Series Collectors"
      case "vip":
        return "VIP Collectors"
      default:
        return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-5xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Announcements</h1>
        <p className="text-muted-foreground">
          Send updates and messages to your collectors
        </p>
      </div>

      {/* Composer */}
      {showComposer ? (
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              New Announcement
            </CardTitle>
            <CardDescription>
              Compose a message to send to your collectors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="New Release, Behind the Scenes, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                {message.length} characters
              </p>
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <Label htmlFor="audience">Send to</Label>
              <Select value={audience} onValueChange={(value: any) => {
                setAudience(value)
                setTargetId("")
              }}>
                <SelectTrigger id="audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Collectors
                    </div>
                  </SelectItem>
                  <SelectItem value="artwork">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Collectors of Specific Artwork
                    </div>
                  </SelectItem>
                  <SelectItem value="series">
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="h-4 w-4" />
                      Collectors of Series
                    </div>
                  </SelectItem>
                  <SelectItem value="vip">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      VIP Collectors Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Selection */}
            {audience === "artwork" && (
              <div className="space-y-2">
                <Label htmlFor="artwork">Select Artwork</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger id="artwork">
                    <SelectValue placeholder="Choose an artwork..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableArtworks.map((artwork) => (
                      <SelectItem key={artwork.id} value={artwork.id}>
                        {artwork.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {audience === "series" && (
              <div className="space-y-2">
                <Label htmlFor="series">Select Series</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger id="series">
                    <SelectValue placeholder="Choose a series..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSeries.map((series) => (
                      <SelectItem key={series.id} value={series.id}>
                        {series.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowComposer(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button onClick={handleSendAnnouncement} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Announcement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setShowComposer(true)}
          size="lg"
          className="mb-8 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      )}

      {/* Past Announcements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Announcements</h2>
        
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Megaphone className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No announcements yet</h3>
              <p className="text-muted-foreground mb-4">
                Send your first announcement to connect with your collectors
              </p>
              <Button onClick={() => setShowComposer(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{announcement.title}</h3>
                      <Badge variant={announcement.status === "sent" ? "default" : "secondary"}>
                        {announcement.status === "sent" && <Check className="h-3 w-3 mr-1" />}
                        {announcement.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {announcement.status === "failed" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {announcement.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.message}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {getAudienceIcon(announcement.audience)}
                    {getAudienceLabel(announcement.audience)}
                    {announcement.targetName && `: ${announcement.targetName}`}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {announcement.recipientCount} {announcement.recipientCount === 1 ? "collector" : "collectors"}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(announcement.sentAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
