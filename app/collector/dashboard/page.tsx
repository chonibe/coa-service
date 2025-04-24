"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircle,
  BadgeIcon as Certificate,
  Gift,
  Search,
  Filter,
  ArrowRight,
  Bell,
  Settings,
  Instagram,
  Heart,
  Clock,
} from "lucide-react"

export default function CollectorDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [certificates, setCertificates] = useState<any[]>([])
  const [benefits, setBenefits] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setIsLoading(true)

      // In a real implementation, you would fetch this data from your API
      // For demo purposes, we'll use mock data

      // Mock certificates
      const mockCertificates = [
        {
          id: "cert-001",
          title: "Abstract Composition #42",
          artist: "Jane Smith",
          editionNumber: 3,
          editionTotal: 50,
          imageUrl: "/placeholder.svg?height=600&width=800&query=abstract painting blue",
          purchaseDate: "2023-09-15",
          hasUpdates: true,
        },
        {
          id: "cert-002",
          title: "Urban Landscape",
          artist: "Michael Johnson",
          editionNumber: 7,
          editionTotal: 25,
          imageUrl: "/placeholder.svg?height=600&width=800&query=urban landscape painting",
          purchaseDate: "2023-10-22",
          hasUpdates: false,
        },
        {
          id: "cert-003",
          title: "Serenity",
          artist: "Emma Davis",
          editionNumber: 12,
          editionTotal: 100,
          imageUrl: "/placeholder.svg?height=600&width=800&query=serene nature painting",
          purchaseDate: "2023-11-05",
          hasUpdates: true,
        },
      ]

      // Mock benefits
      const mockBenefits = [
        {
          id: "benefit-001",
          title: "Exclusive Artist Livestream",
          artist: "Jane Smith",
          type: "Virtual Event",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
          claimed: false,
          icon: "video",
          certificateId: "cert-001",
        },
        {
          id: "benefit-002",
          title: "Digital Sketchbook",
          artist: "Jane Smith",
          type: "Digital Content",
          claimed: true,
          icon: "file-text",
          certificateId: "cert-001",
        },
        {
          id: "benefit-003",
          title: "Collector-Only Discount",
          artist: "Michael Johnson",
          type: "Discount",
          claimed: false,
          icon: "percent",
          certificateId: "cert-002",
        },
        {
          id: "benefit-004",
          title: "Behind the Scenes Studio Tour",
          artist: "Emma Davis",
          type: "Virtual Event",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days from now
          claimed: false,
          icon: "video",
          certificateId: "cert-003",
        },
      ]

      // Mock artists
      const mockArtists = [
        {
          id: "artist-001",
          name: "Jane Smith",
          instagramHandle: "janesmith",
          avatarUrl: "/placeholder.svg?height=200&width=200&query=female artist portrait",
          isFollowing: true,
          hasNewContent: true,
        },
        {
          id: "artist-002",
          name: "Michael Johnson",
          instagramHandle: "mjohnsonart",
          avatarUrl: "/placeholder.svg?height=200&width=200&query=male artist portrait",
          isFollowing: false,
          hasNewContent: false,
        },
        {
          id: "artist-003",
          name: "Emma Davis",
          instagramHandle: "emmadavisart",
          avatarUrl: "/placeholder.svg?height=200&width=200&query=female artist portrait young",
          isFollowing: true,
          hasNewContent: true,
        },
      ]

      setCertificates(mockCertificates)
      setBenefits(mockBenefits)
      setArtists(mockArtists)

      setIsLoading(false)
    }

    loadData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const viewCertificate = (certificateId: string) => {
    router.push(`/certificate/${certificateId}`)
  }

  const toggleFollowArtist = (artistId: string) => {
    setArtists(
      artists.map((artist) => (artist.id === artistId ? { ...artist, isFollowing: !artist.isFollowing } : artist)),
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Collector Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=100&width=100&query=person portrait" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="certificates" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificates">My Certificates</TabsTrigger>
            <TabsTrigger value="benefits">Collector Benefits</TabsTrigger>
            <TabsTrigger value="artists">Following Artists</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Certificates</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="search" placeholder="Search certificates..." className="pl-8 w-[250px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <Card key={certificate.id} className="overflow-hidden">
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={certificate.imageUrl || "/placeholder.svg"}
                      alt={certificate.title}
                      fill
                      className="object-cover"
                    />
                    {certificate.hasUpdates && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500">New Updates</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{certificate.title}</CardTitle>
                    <CardDescription>by {certificate.artist}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <Certificate className="h-4 w-4 mr-1 text-indigo-600" />
                        <span>
                          Edition #{certificate.editionNumber} of {certificate.editionTotal}
                        </span>
                      </div>
                      <div className="text-gray-500">{formatDate(certificate.purchaseDate)}</div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => viewCertificate(certificate.id)}>
                      View Certificate
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Collector Benefits</h2>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  <input type="checkbox" className="mr-2" />
                  Show claimed benefits
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits
                .filter((b) => !b.claimed)
                .map((benefit) => (
                  <Card key={benefit.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="mb-2">{benefit.type}</Badge>
                          <CardTitle className="text-lg">{benefit.title}</CardTitle>
                          <CardDescription>by {benefit.artist}</CardDescription>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {benefit.icon === "video" && <Clock className="h-5 w-5 text-red-500" />}
                          {benefit.icon === "file-text" && <Certificate className="h-5 w-5 text-blue-500" />}
                          {benefit.icon === "percent" && <Gift className="h-5 w-5 text-green-500" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {benefit.date && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatDate(benefit.date)}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        Related to:{" "}
                        <span className="font-medium">
                          {certificates.find((c) => c.id === benefit.certificateId)?.title}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">
                        <Gift className="h-4 w-4 mr-2" />
                        Claim Benefit
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

              {benefits.filter((b) => !b.claimed).length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Available Benefits</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    You don't have any unclaimed benefits at the moment. Check back later for new perks from your
                    collected artists.
                  </p>
                </div>
              )}
            </div>

            {benefits.filter((b) => b.claimed).length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Claimed Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits
                    .filter((b) => b.claimed)
                    .map((benefit) => (
                      <Card key={benefit.id} className="bg-gray-50">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {benefit.type}
                              </Badge>
                              <CardTitle className="text-lg">{benefit.title}</CardTitle>
                              <CardDescription>by {benefit.artist}</CardDescription>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-sm">
                            Related to:{" "}
                            <span className="font-medium">
                              {certificates.find((c) => c.id === benefit.certificateId)?.title}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="artists" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Following Artists</h2>
              <Button variant="outline">Discover More Artists</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {artists.map((artist) => (
                <Card key={artist.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-3">
                        <AvatarImage src={artist.avatarUrl || "/placeholder.svg"} alt={artist.name} />
                        <AvatarFallback>{artist.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{artist.name}</CardTitle>
                        <div className="flex items-center text-sm text-gray-500">
                          <Instagram className="h-3.5 w-3.5 mr-1" />
                          <span>@{artist.instagramHandle}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium">3</span> editions in your collection
                      </div>
                      {artist.hasNewContent && <Badge className="bg-red-500">New Content</Badge>}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <Instagram className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      variant={artist.isFollowing ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFollowArtist(artist.id)}
                    >
                      {artist.isFollowing ? (
                        <>
                          <Heart className="h-4 w-4 mr-1 fill-current" />
                          Following
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
