"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  TrendingUp, 
  Eye, 
  Clock, 
  DollarSign,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight
} from "lucide-react"
import { format } from "date-fns"

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge, 
  Button, 
  Input,
  Skeleton,
  Alert,
  AlertDescription
} from "@/components/ui"

interface CollectorData {
  id: string
  displayName: string
  email?: string
  totalPurchases: number
  totalValue: number
  currency: string
  lastPurchaseDate: string
  artworksPurchased: Array<{
    id: string
    name: string
    imgUrl: string
    purchaseDate: string
    price: number
  }>
  engagementScore: number
  lastViewedDate?: string
}

export default function CollectorsPage() {
  const router = useRouter()
  const [collectors, setCollectors] = useState<CollectorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "value" | "engagement">("recent")

  useEffect(() => {
    fetchCollectors()
  }, [])

  const fetchCollectors = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch("/api/vendor/collectors", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load collector data")
      }

      const data = await response.json()
      setCollectors(data.collectors || [])
    } catch (err: any) {
      console.error("Error fetching collectors:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort collectors
  const filteredCollectors = collectors
    .filter(collector => 
      collector.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collector.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "value":
          return b.totalValue - a.totalValue
        case "engagement":
          return b.engagementScore - a.engagementScore
        case "recent":
        default:
          return new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime()
      }
    })

  // Calculate summary stats
  const totalCollectors = collectors.length
  const totalRevenue = collectors.reduce((sum, c) => sum + c.totalValue, 0)
  const avgPurchaseValue = totalCollectors > 0 ? totalRevenue / totalCollectors : 0
  const currency = collectors[0]?.currency || "USD"

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Collectors</h1>
        <p className="text-muted-foreground">
          See who owns your work and understand their engagement
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Collectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCollectors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totalRevenue.toFixed(2)} {currency}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Purchase Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${avgPurchaseValue.toFixed(2)} {currency}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                onClick={() => setSortBy("recent")}
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </Button>
              <Button
                variant={sortBy === "value" ? "default" : "outline"}
                onClick={() => setSortBy("value")}
                size="sm"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Value
              </Button>
              <Button
                variant={sortBy === "engagement" ? "default" : "outline"}
                onClick={() => setSortBy("engagement")}
                size="sm"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Engagement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collectors List */}
      {filteredCollectors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No collectors found" : "No collectors yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Start building your collector community"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCollectors.map((collector) => (
            <Card key={collector.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {collector.displayName}
                      </h3>
                      <Badge variant="secondary">
                        {collector.totalPurchases} {collector.totalPurchases === 1 ? "artwork" : "artworks"}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${collector.totalValue.toFixed(2)} {collector.currency}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Last purchase: {format(new Date(collector.lastPurchaseDate), "MMM d, yyyy")}
                      </div>
                      {collector.engagementScore > 0 && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Engagement: {collector.engagementScore}/100
                        </div>
                      )}
                    </div>

                    {/* Artworks Preview */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {collector.artworksPurchased.slice(0, 5).map((artwork) => (
                        <div
                          key={artwork.id}
                          className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border"
                          title={artwork.name}
                        >
                          <img
                            src={artwork.imgUrl}
                            alt={artwork.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {collector.artworksPurchased.length > 5 && (
                        <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-sm font-medium bg-muted flex-shrink-0">
                          +{collector.artworksPurchased.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Future: Navigate to collector detail page
                    }}
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
