"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, User, Building2, MessageSquare } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle: string
  url: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(query)

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/crm/search?q=${encodeURIComponent(q)}`)
      
      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      console.error("Search error:", err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/admin/crm/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "person":
        return User
      case "company":
        return Building2
      case "conversation":
        return MessageSquare
      default:
        return Search
    }
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-1">
          Search across all CRM entities
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search people, companies, conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {query && (
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedResults).map(([type, items]) => {
                  const Icon = getIcon(type)
                  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + "s"
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{typeLabel}</h3>
                        <Badge variant="secondary">{items.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {items.map((result) => {
                          const ResultIcon = getIcon(result.type)
                          return (
                            <Link
                              key={result.id}
                              href={result.url}
                              className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <ResultIcon className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">{result.title}</div>
                                  {result.subtitle && (
                                    <div className="text-sm text-muted-foreground">
                                      {result.subtitle}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!query && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Enter a search query to find people, companies, and conversations
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

