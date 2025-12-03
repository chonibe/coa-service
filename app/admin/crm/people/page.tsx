"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Plus, Mail, Instagram, Facebook, MessageCircle, ShoppingBag, Filter } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { FilterBuilder } from "@/components/crm/filter-builder"
import { BulkActionsToolbar } from "@/components/crm/bulk-actions-toolbar"
import { SavedViews } from "@/components/crm/saved-views"
import { ExportDialog } from "@/components/crm/export-dialog"
import { PersonListSkeleton } from "@/components/crm/loading-skeleton"
import { EmptyState } from "@/components/crm/empty-state"
import { ColumnCustomizer } from "@/components/crm/column-customizer"
import { useCRMShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Person {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  instagram_username: string | null
  total_orders: number | null
  total_spent: number | null
  last_order_date: string | null
  tags: string[] | null
  company_id: string | null
  crm_companies?: {
    id: string
    name: string
  } | null
  crm_contact_identifiers?: Array<{
    identifier_type: string
    identifier_value: string
    platform: string | null
  }>
}

export default function PeoplePage() {
  const router = useRouter()
  useCRMShortcuts() // Enable keyboard shortcuts
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentSort, setCurrentSort] = useState<Array<{ field: string; direction: "asc" | "desc" }>>([])
  const [columns, setColumns] = useState([
    { key: "name", label: "Name", visible: true },
    { key: "email", label: "Email", visible: true },
    { key: "phone", label: "Phone", visible: true },
    { key: "company", label: "Company", visible: true },
    { key: "tags", label: "Tags", visible: true },
    { key: "total_orders", label: "Orders", visible: true },
    { key: "total_spent", label: "Total Spent", visible: true },
  ])
  const limit = 50

  const fetchPeople = async (search = "", offset = 0) => {
    try {
      setIsLoading(true)
      setError(null)
      
      let url = `/api/crm/people?limit=${limit}&offset=${offset}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch people: ${response.status}`)
      }

      const data = await response.json()
      setPeople(data.people || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error("Error fetching people:", err)
      setError(err.message || "Failed to load people")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPeople()
  }, [])

  const handleSearch = () => {
    setPage(0)
    fetchPeople(searchQuery, 0)
  }

  const getPlatformIcons = (person: Person) => {
    const platforms = []
    if (person.email) platforms.push({ icon: Mail, label: "Email" })
    if (person.instagram_username) platforms.push({ icon: Instagram, label: "Instagram" })
    if (person.crm_contact_identifiers?.some(id => id.platform === "facebook")) {
      platforms.push({ icon: Facebook, label: "Facebook" })
    }
    if (person.crm_contact_identifiers?.some(id => id.platform === "whatsapp")) {
      platforms.push({ icon: MessageCircle, label: "WhatsApp" })
    }
    if (person.total_orders && person.total_orders > 0) {
      platforms.push({ icon: ShoppingBag, label: "Shopify" })
    }
    return platforms
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            People
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage contacts and customer relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnCustomizer columns={columns} onColumnsChange={setColumns} entityType="person" />
          <ExportDialog 
            entityType="people" 
            filters={filters.length > 0 ? { $and: filters } : undefined} 
            selectedIds={selectedIds.length > 0 ? selectedIds : undefined} 
          />
          <Button onClick={() => router.push("/admin/crm/people/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </div>
      </div>

      {/* Search Bar and Saved Views */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, email, or Instagram username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            {showFilters && (
              <div className="border-t pt-4">
                <FilterBuilder
                  entityType="person"
                  filters={filters.length > 0 ? { $and: filters } : {}}
                  onFiltersChange={(newFilters) => {
                    if (newFilters.$and) {
                      setFilters(newFilters.$and)
                    } else {
                      setFilters([])
                    }
                  }}
                />
              </div>
            )}
            <div className="border-t pt-4">
              <SavedViews
                entityType="person"
                currentFilters={filters.length > 0 ? { $and: filters } : {}}
                currentSort={currentSort}
                onViewSelect={(view) => {
                  setFilters(view.filters?.$and || [])
                  setCurrentSort(view.sort || [])
                  fetchPeople(searchQuery, 0)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-4">
          <BulkActionsToolbar
            selectedIds={selectedIds}
            entityType="person"
            onActionComplete={() => {
              setSelectedIds([])
              fetchPeople(searchQuery, page * limit)
            }}
          />
        </div>
      )}

      {/* People List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All People {total > 0 && <Badge variant="secondary" className="ml-2">{total}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PersonListSkeleton />
          ) : people.length === 0 ? (
            <EmptyState
              type="people"
              actionHref="/admin/crm/people/new"
            />
          ) : (
            <div className="space-y-2">
              {people.map((person) => {
                const platforms = getPlatformIcons(person)
                const name = `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email || "Unknown"
                
                const isSelected = selectedIds.includes(person.id)
                
                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all duration-200 group"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds([...selectedIds, person.id])
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== person.id))
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Link
                      href={`/admin/crm/people/${person.id}`}
                      className="flex-1"
                    >
                      <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{name}</h3>
                          {person.crm_companies && (
                            <Badge variant="outline" className="text-xs">
                              {person.crm_companies.name}
                            </Badge>
                          )}
                          {person.tags && person.tags.length > 0 && (
                            person.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {person.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {person.email}
                            </span>
                          )}
                          {person.phone && <span>{person.phone}</span>}
                          {person.total_orders && person.total_orders > 0 && (
                            <span>{person.total_orders} orders</span>
                          )}
                          {person.total_spent && (
                            <span>${parseFloat(person.total_spent.toString()).toFixed(2)} spent</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platforms.map((platform, idx) => {
                          const Icon = platform.icon
                          return (
                            <div 
                              key={idx} 
                              className="p-1.5 rounded bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors" 
                              title={platform.label}
                            >
                              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && total > limit && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(0, page - 1)
                    setPage(newPage)
                    fetchPeople(searchQuery, newPage * limit)
                  }}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = page + 1
                    setPage(newPage)
                    fetchPeople(searchQuery, newPage * limit)
                  }}
                  disabled={(page + 1) * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

