"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Building2, Users, DollarSign, Package, Mail, Phone, Globe } from "lucide-react"
import Link from "next/link"
import { Timeline } from "@/components/crm/timeline"
import { CustomFieldsPanel } from "@/components/crm/custom-fields-panel"

interface Company {
  id: string
  name: string
  domain: string | null
  website: string | null
  industry: string | null
  company_size: string | null
  description: string | null
  phone: string | null
  email: string | null
  address: any
  tags: string[] | null
  total_people: number | null
  total_orders: number | null
  total_spent: number | null
  first_order_date: string | null
  last_order_date: string | null
  crm_customers?: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    total_orders: number | null
    total_spent: number | null
  }>
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string
  
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompany() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/crm/companies/${companyId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Company not found")
          }
          throw new Error(`Failed to fetch company: ${response.statusText}`)
        }

        const data = await response.json()
        setCompany(data.company)
      } catch (err: any) {
        console.error("Error fetching company:", err)
        setError(err.message || "Failed to load company")
      } finally {
        setIsLoading(false)
      }
    }

    if (companyId) {
      fetchCompany()
    }
  }, [companyId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive">{error || "Company not found"}</div>
            <Button onClick={() => router.push("/admin/crm/companies")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/crm/companies")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {company.name}
            </h1>
            {company.industry && (
              <Badge variant="outline" className="mt-2">
                {company.industry}
              </Badge>
            )}
          </div>
          <Button onClick={() => router.push(`/admin/crm/companies/${companyId}/edit`)}>Edit</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.total_people || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.total_orders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${company.total_spent ? parseFloat(company.total_spent.toString()).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {company.last_order_date
                ? new Date(company.last_order_date).toLocaleDateString()
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Custom Fields */}
          <CustomFieldsPanel entityType="company" entityId={companyId} />
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.domain && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{company.domain}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.company_size && (
                  <div className="text-sm text-muted-foreground">
                    Company Size: {company.company_size}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {company.description && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{company.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>People at {company.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {!company.crm_customers || company.crm_customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No people found for this company
                </div>
              ) : (
                <div className="space-y-2">
                  {company.crm_customers.map((person) => (
                    <Link
                      key={person.id}
                      href={`/admin/crm/people/${person.id}`}
                      className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {person.first_name || ""} {person.last_name || ""}
                          </div>
                          {person.email && (
                            <div className="text-sm text-muted-foreground">{person.email}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {person.total_orders && person.total_orders > 0 && (
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span>{person.total_orders} orders</span>
                            </div>
                          )}
                          {person.total_spent && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>${parseFloat(person.total_spent.toString()).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline companyId={companyId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

