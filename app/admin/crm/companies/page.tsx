"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Plus, Building2, Users, DollarSign, Package } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/crm/empty-state"
import { PersonListSkeleton } from "@/components/crm/loading-skeleton"
import { ExportDialog } from "@/components/crm/export-dialog"

interface Company {
  id: string
  name: string
  domain: string | null
  website: string | null
  industry: string | null
  company_size: string | null
  total_people: number | null
  total_orders: number | null
  total_spent: number | null
  tags: string[] | null
  crm_customers?: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    total_orders: number | null
    total_spent: number | null
  }>
}

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const limit = 50

  const fetchCompanies = async (search = "", offset = 0) => {
    try {
      setIsLoading(true)
      setError(null)
      
      let url = `/api/crm/companies?limit=${limit}&offset=${offset}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`)
      }

      const data = await response.json()
      setCompanies(data.companies || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error("Error fetching companies:", err)
      setError(err.message || "Failed to load companies")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleSearch = () => {
    setPage(0)
    fetchCompanies(searchQuery, 0)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Companies
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage company and organization records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDialog entityType="companies" />
          <Button onClick={() => router.push("/admin/crm/companies/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, domain, or website..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
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

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Companies {total > 0 && <Badge variant="secondary" className="ml-2">{total}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PersonListSkeleton />
          ) : companies.length === 0 ? (
            <EmptyState
              type="companies"
              actionHref="/admin/crm/companies/new"
            />
          ) : (
            <div className="space-y-2">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/admin/crm/companies/${company.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{company.name}</h3>
                        {company.industry && (
                          <Badge variant="outline" className="text-xs">
                            {company.industry}
                          </Badge>
                        )}
                        {company.tags && company.tags.length > 0 && (
                          company.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {company.domain && <span>{company.domain}</span>}
                        {company.website && <span>{company.website}</span>}
                        {company.company_size && <span>{company.company_size} employees</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      {company.total_people !== null && company.total_people > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{company.total_people}</span>
                        </div>
                      )}
                      {company.total_orders !== null && company.total_orders > 0 && (
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{company.total_orders}</span>
                        </div>
                      )}
                      {company.total_spent !== null && company.total_spent > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>${parseFloat(company.total_spent.toString()).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
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
                    fetchCompanies(searchQuery, newPage * limit)
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
                    fetchCompanies(searchQuery, newPage * limit)
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

