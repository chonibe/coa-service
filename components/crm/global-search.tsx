"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Loader2, User, Building2, MessageSquare, Search, Clock, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle: string
  url: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RECENT_SEARCHES_KEY = "crm_recent_searches"
const MAX_RECENT_SEARCHES = 5

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [])

  // Load suggestions when dialog opens
  useEffect(() => {
    if (open && query.length === 0) {
      loadSuggestions()
    }
  }, [open])

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/crm/search?q=${encodeURIComponent(query)}`)
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
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query])

  const loadSuggestions = async () => {
    // Load popular/recently accessed items as suggestions
    try {
      const response = await fetch("/api/crm/search?q=&limit=5")
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.results || [])
      }
    } catch (err) {
      console.error("Error loading suggestions:", err)
    }
  }

  const saveRecentSearch = (searchQuery: string) => {
    if (typeof window === "undefined" || !searchQuery.trim()) return
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)]
      .slice(0, MAX_RECENT_SEARCHES)
    setRecentSearches(updated)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }

  const handleSelect = (url: string, searchQuery?: string) => {
    if (searchQuery) {
      saveRecentSearch(searchQuery)
    }
    router.push(url)
    onOpenChange(false)
    setQuery("")
    setResults([])
  }

  const handleRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery)
    // Trigger search
    const event = new Event("input", { bubbles: true })
    // The useEffect will handle the search
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
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search people, companies, conversations..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && query.length >= 2 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Recent Searches (when no query) */}
        {!isLoading && query.length === 0 && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((recent, idx) => (
              <CommandItem
                key={`recent-${idx}`}
                value={recent}
                onSelect={() => handleRecentSearch(recent)}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{recent}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Suggestions (when no query) */}
        {!isLoading && query.length === 0 && suggestions.length > 0 && (
          <>
            {recentSearches.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Suggestions">
              {suggestions.map((result) => {
                const ResultIcon = getIcon(result.type)
                return (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result.url)}
                  >
                    <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                    <ResultIcon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {/* Search Results */}
        {!isLoading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!isLoading && query.length >= 2 && query.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
        )}
        {!isLoading && query.length >= 2 && Object.entries(groupedResults).map(([type, items]) => {
          const Icon = getIcon(type)
          const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + "s"
          
          return (
            <CommandGroup key={type} heading={typeLabel}>
              {items.map((result) => {
                const ResultIcon = getIcon(result.type)
                return (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result.url, query)}
                  >
                    <ResultIcon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}

