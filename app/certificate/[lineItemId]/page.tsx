"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  CheckCircle,
  Download,
  Share2,
  Clock,
  ShoppingBag,
  User,
  BadgeIcon as Certificate,
  Instagram,
  MessageSquare,
  Bell,
  Heart,
  Calendar,
  Gift,
  Sparkles,
  RefreshCw,
  Video,
  FileText,
  Percent,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export default function CertificatePage() {
  const params = useParams()
  const lineItemId = params.lineItemId as string

  const [certificate, setCertificate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("certificate")
  const [instagramStories, setInstagramStories] = useState<any[]>([])
  const [benefits, setBenefits] = useState<any[]>([])
  const [artistUpdates, setArtistUpdates] = useState<any[]>([])
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/certificate/${lineItemId}`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: Certificate not found`)
        }

        const data = await response.json()
        setCertificate(data.certificate)

        // Set last checked time
        setLastChecked(new Date())

        // After fetching certificate, fetch Instagram stories and benefits
        if (data.certificate) {
          fetchInstagramStories(data.certificate.product.vendor)
          fetchBenefits(data.certificate.lineItem.id)
          fetchArtistUpdates(data.certificate.product.vendor)
        }
      } catch (err: any) {
        console.error("Error fetching certificate:", err)
        setError(err.message || "Failed to load certificate")
      } finally {
        setIsLoading(false)
      }
    }

    if (lineItemId) {
      fetchCertificate()
    }
  }, [lineItemId])

  const fetchInstagramStories = async (artistName: string) => {
    // In a real implementation, this would fetch from your Instagram API integration
    // For demo purposes, we'll use mock data
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock Instagram stories data
      const mockStories = [
        {
          id: "story1",
          imageUrl: "/vibrant-artist-corner.png",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          caption: "Working on a new piece today! #artistlife",
        },
        {
          id: "story2",
          imageUrl: "/brushstrokes-texture.png",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          caption: "Detail shot of the new limited edition print",
        },
        {
          id: "story3",
          imageUrl: "/gallery-night.png",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          caption: "At the gallery preparing for the upcoming show",
        },
      ]

      setInstagramStories(mockStories)
    } catch (err) {
      console.error("Error fetching Instagram stories:", err)
    }
  }

  const fetchBenefits = async (lineItemId: string) => {
    // In a real implementation, this would fetch from your benefits API
    // For demo purposes, we'll use mock data
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock benefits data
      const mockBenefits = [
        {
          id: "benefit1",
          title: "Exclusive Artist Livestream",
          description: "Join a private livestream where the artist will discuss their creative process",
          type: "Virtual Event",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
          claimed: false,
          icon: "video",
        },
        {
          id: "benefit2",
          title: "Digital Sketchbook",
          description: "Download a PDF of the artist's sketches and studies for this piece",
          type: "Digital Content",
          claimed: true,
          icon: "file-text",
        },
        {
          id: "benefit3",
          title: "Collector-Only Discount",
          description: "15% off your next purchase from this artist",
          type: "Discount",
          claimed: false,
          icon: "percent",
        },
      ]

      setBenefits(mockBenefits)
    } catch (err) {
      console.error("Error fetching benefits:", err)
    }
  }

  const fetchArtistUpdates = async (artistName: string) => {
    // In a real implementation, this would fetch from your artist updates API
    // For demo purposes, we'll use mock data
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Mock artist updates
      const mockUpdates = [
        {
          id: "update1",
          title: "New Exhibition Announced",
          content: "I'm excited to announce my upcoming exhibition 'Reflections' opening next month at Gallery Modern.",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          type: "announcement",
        },
        {
          id: "update2",
          title: "Studio Process Video",
          content: "I've just uploaded a new video showing the creation process behind this limited edition.",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          type: "content",
          mediaUrl: "/creative-workspace.png",
        },
      ]

      setArtistUpdates(mockUpdates)
    } catch (err) {
      console.error("Error fetching artist updates:", err)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // Refresh all dynamic content
      if (certificate) {
        await Promise.all([
          fetchInstagramStories(certificate.product.vendor),
          fetchBenefits(certificate.lineItem.id),
          fetchArtistUpdates(certificate.product.vendor),
        ])
      }

      setLastChecked(new Date())
      toast({
        title: "Content refreshed",
        description: "The latest updates have been loaded",
      })
    } catch (err) {
      console.error("Error refreshing content:", err)
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not load the latest updates",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleNotifications = () => {
    if (isNotificationsEnabled) {
      // In a real implementation, this would unsubscribe from notifications
      setIsNotificationsEnabled(false)
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive updates for this certificate",
      })
    } else {
      // In a real implementation, this would subscribe to notifications
      setIsNotificationsEnabled(true)
      toast({
        title: "Notifications enabled",
        description: "You will receive updates when new content is available",
      })
    }
  }

  const claimBenefit = (benefitId: string) => {
    // In a real implementation, this would call your API to claim the benefit
    setBenefits(benefits.map((benefit) => (benefit.id === benefitId ? { ...benefit, claimed: true } : benefit)))

    toast({
      title: "Benefit claimed",
      description: "You have successfully claimed this benefit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds} seconds ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`

    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`

    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`

    const years = Math.floor(months / 12)
    return `${years} year${years !== 1 ? "s" : ""} ago`
  }

  const handleShare = () => {
    if (navigator.share && certificate) {
      navigator.share({
        title: `Certificate of Authenticity - Edition #${certificate.lineItem.editionNumber}`,
        text: `View my certificate of authenticity for ${certificate.product.title} - Edition #${certificate.lineItem.editionNumber} of ${certificate.lineItem.editionTotal}`,
        url: window.location.href,
      })
    } else {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Certificate URL copied to clipboard!",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold">Loading Certificate...</h1>
            <p className="mt-2 text-lg text-gray-600">Please wait while we verify your edition</p>
          </div>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                  <Skeleton className="absolute inset-0" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Certificate Error</AlertTitle>
            <AlertDescription>
              {error || "Certificate not found. The provided edition ID may be invalid."}
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Certificate Verification Failed</h2>
              <p className="text-gray-600 mb-6">
                We couldn't verify this certificate. Please check the URL and try again.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mr-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Certificate of Authenticity</h1>
              <p className="text-gray-600">
                Edition #{certificate.lineItem.editionNumber} of {certificate.lineItem.editionTotal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-1"
              onClick={toggleNotifications}
            >
              {isNotificationsEnabled ? (
                <>
                  <Bell className="h-4 w-4 fill-current" />
                  <span>Notifications On</span>
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  <span>Get Notifications</span>
                </>
              )}
            </Button>

            <Button variant="outline" size="icon" className="md:hidden" onClick={toggleNotifications}>
              {isNotificationsEnabled ? <Bell className="h-4 w-4 fill-current" /> : <Bell className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {lastChecked && (
          <div className="text-xs text-gray-500 mb-4 text-right">Last updated: {lastChecked.toLocaleTimeString()}</div>
        )}

        <Tabs defaultValue="certificate" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="certificate">Certificate</TabsTrigger>
            <TabsTrigger value="stories" className="relative">
              Stories
              {instagramStories.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white">
                  {instagramStories.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="benefits" className="relative">
              Benefits
              {benefits.filter((b) => !b.claimed).length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white">
                  {benefits.filter((b) => !b.claimed).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="updates" className="relative">
              Updates
              {artistUpdates.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white">
                  {artistUpdates.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificate">
            <Card className="overflow-hidden border-none shadow-lg">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1">
                <CardContent className="p-0">
                  <div className="bg-white p-8">
                    {/* Artist Info */}
                    <div className="mb-8 flex items-center">
                      <Avatar className="h-12 w-12 border-2 border-gray-200">
                        <AvatarImage src="/contemplative-artist.png" alt={certificate.product.vendor} />
                        <AvatarFallback>{certificate.product.vendor.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <h3 className="font-semibold">{certificate.product.vendor}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Instagram className="h-3.5 w-3.5 mr-1" />
                          <span>@{certificate.product.vendor.toLowerCase().replace(/\s+/g, "")}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <User className="h-4 w-4 mr-1" />
                        Follow Artist
                      </Button>
                    </div>

                    {/* Product Image */}
                    {certificate.product.images && certificate.product.images.length > 0 && (
                      <div className="mb-8 aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={certificate.product.images[0].src || "/placeholder.svg"}
                          alt={certificate.product.images[0].alt || certificate.product.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}

                    {/* Certificate Header */}
                    <div className="mb-8 text-center">
                      <h2 className="text-2xl font-bold">{certificate.product.title}</h2>
                      <p className="text-gray-500">{certificate.product.vendor}</p>
                    </div>

                    {/* Certificate Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start">
                          <Certificate className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Edition Details</h3>
                            <p className="text-indigo-600 font-bold text-lg">
                              #{certificate.lineItem.editionNumber} of {certificate.lineItem.editionTotal}
                            </p>
                            <p className="text-sm text-gray-500">Limited Edition</p>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Authentication Date</h3>
                            <p className="text-gray-600">
                              {formatDate(certificate.lineItem.updatedAt || certificate.lineItem.createdAt)}
                            </p>
                            <p className="text-sm text-gray-500">Last verified edition number</p>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-start">
                          <ShoppingBag className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Purchase Information</h3>
                            <p className="text-gray-600">{certificate.order.orderName}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(certificate.order.processedAt || certificate.order.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-start">
                          <User className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Ownership</h3>
                            {certificate.order.customer ? (
                              <p className="text-gray-600">
                                {certificate.order.customer.firstName} {certificate.order.customer.lastName}
                              </p>
                            ) : (
                              <p className="text-gray-600">Verified Owner</p>
                            )}
                            <p className="text-sm text-gray-500">Original Purchaser</p>
                          </div>
                        </div>
                      </div>

                      {certificate.lineItem.certificateGeneratedAt && (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-start">
                            <Certificate className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                            <div>
                              <h3 className="font-semibold text-gray-900">Certificate Details</h3>
                              <p className="text-gray-600">
                                Generated on {formatDate(certificate.lineItem.certificateGeneratedAt)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Certificate ID: {certificate.lineItem.accessToken?.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Certificate Description */}
                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
                      <div className="text-gray-600 prose prose-sm max-w-none">
                        {certificate.product.description ? (
                          <div dangerouslySetInnerHTML={{ __html: certificate.product.description }} />
                        ) : (
                          <p>{certificate.product.title}</p>
                        )}
                      </div>
                    </div>

                    {/* Verification Information */}
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">
                            Verification URL:
                            <span className="ml-1 text-indigo-600 break-all">{certificate.verificationUrl}</span>
                          </p>
                          <p className="text-xs text-gray-500">Line Item ID: {certificate.lineItem.id}</p>
                          <p className="text-xs text-gray-500">Product ID: {certificate.product.id}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleShare}>
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.print()}>
                            <Download className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Artist Stories</h2>
                    <p className="text-sm text-gray-500">Follow the artist's journey and creative process</p>
                  </div>
                  <div className="flex items-center">
                    <Instagram className="h-5 w-5 mr-2 text-pink-600" />
                    <span className="font-medium">@{certificate.product.vendor.toLowerCase().replace(/\s+/g, "")}</span>
                  </div>
                </div>

                {instagramStories.length === 0 ? (
                  <div className="text-center py-12">
                    <Instagram className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Stories Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      The artist hasn't shared any stories recently. Check back later for updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {instagramStories.map((story, index) => (
                      <div key={story.id} className="border rounded-lg overflow-hidden">
                        <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src="/contemplative-artist.png" alt={certificate.product.vendor} />
                              <AvatarFallback>
                                {certificate.product.vendor.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{certificate.product.vendor}</p>
                              <p className="text-xs text-gray-500">{getTimeAgo(story.timestamp)}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Exclusive
                          </Badge>
                        </div>
                        <div className="aspect-[9/16] relative">
                          <Image
                            src={story.imageUrl || "/placeholder.svg"}
                            alt={`Artist story ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-sm">{story.caption}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
                                <Heart className="h-4 w-4" />
                                <span>Like</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>Comment</span>
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">{new Date(story.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Collector Benefits</h2>
                  <p className="text-sm text-gray-500">Exclusive perks for owning this limited edition</p>
                </div>

                {benefits.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Benefits Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      No collector benefits are available for this edition yet. Check back later for exclusive perks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {benefits.map((benefit) => (
                      <div key={benefit.id} className="border rounded-lg overflow-hidden">
                        <div className="p-4 flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {benefit.icon === "video" && <Video className="h-5 w-5 text-red-500" />}
                            {benefit.icon === "file-text" && <FileText className="h-5 w-5 text-blue-500" />}
                            {benefit.icon === "percent" && <Percent className="h-5 w-5 text-green-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{benefit.title}</h3>
                              <Badge variant={benefit.claimed ? "outline" : "default"}>
                                {benefit.claimed ? "Claimed" : "Available"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                            {benefit.date && (
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{formatDateTime(benefit.date)}</span>
                              </div>
                            )}
                            {!benefit.claimed && (
                              <Button size="sm" className="mt-3" onClick={() => claimBenefit(benefit.id)}>
                                <Gift className="h-4 w-4 mr-1" />
                                Claim Benefit
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Artist Updates</h2>
                  <p className="text-sm text-gray-500">Latest news and content from the artist</p>
                </div>

                {artistUpdates.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Updates Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      The artist hasn't posted any updates yet. Check back later for news and content.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {artistUpdates.map((update) => (
                      <div key={update.id} className="border rounded-lg overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">{update.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getTimeAgo(update.date)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{update.content}</p>

                          {update.mediaUrl && (
                            <div className="mt-4 aspect-video relative rounded overflow-hidden">
                              <Image
                                src={update.mediaUrl || "/placeholder.svg"}
                                alt={update.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t flex justify-between items-center">
                            <p className="text-xs text-gray-500">{formatDate(update.date)}</p>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Heart className="h-4 w-4 mr-1" />
                                <span>Like</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Share2 className="h-4 w-4 mr-1" />
                                <span>Share</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            This certificate serves as proof of authenticity and ownership for the limited edition item. Each
            certificate is uniquely tied to the purchase record and cannot be transferred.
          </p>
          <div className="inline-flex items-center justify-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Verified Authentic</span>
          </div>
        </div>
      </div>
    </div>
  )
}
