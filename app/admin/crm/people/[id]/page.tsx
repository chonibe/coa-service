"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCRMShortcuts } from "@/hooks/use-keyboard-shortcuts"




import { Loader2, ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, DollarSign, Package, MessageSquare, Sparkles } from "lucide-react"
import Link from "next/link"
import { PropertyPanel } from "@/components/crm/property-panel"
import { CommentsPanel } from "@/components/crm/comments-panel"
import { RecordActions } from "@/components/crm/record-actions"
import { RecordWidgets } from "@/components/crm/record-widgets"
import { ActivityCreatorDialog } from "@/components/crm/activity-creator-dialog"

import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
interface Person {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  notes: string | null
  total_orders: number | null
  total_spent: number | null
  first_order_date: string | null
  last_order_date: string | null
  tags: string[] | null
  address: any
  company_id: string | null
  crm_companies?: {
    id: string
    name: string
    domain: string | null
    website: string | null
    industry: string | null
  } | null
  crm_contact_identifiers?: Array<{
    id: string
    identifier_type: string
    identifier_value: string
    platform: string | null
    verified: boolean
    is_primary: boolean
  }>
  crm_customer_orders?: Array<{
    id: string
    order_id: string
    order_source: string
    order_number: string | null
    order_date: string | null
    total_amount: number | null
    status: string | null
    products: any
  }>
}

interface Activity {
  id: string
  activity_type: string
  title: string
  description: string | null
  created_at: string
  platform: string | null
}

export default function PersonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  
  const [person, setPerson] = useState<Person | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [isEnriching, setIsEnriching] = useState(false)

  useEffect(() => {
    async function fetchPerson() {
      try {
        setIsLoading(true)
        setError(null)

        const [personRes, activitiesRes] = await Promise.all([
          fetch(`/api/crm/people/${personId}`),
          fetch(`/api/crm/activities?customer_id=${personId}&limit=50`)
        ])

        if (!personRes.ok) {
          throw new Error(`Failed to fetch person: ${personRes.statusText}`)
        }

        const personData = await personRes.json()
        setPerson(personData.person)

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json()
          setActivities(activitiesData.activities || [])
        }

        // Fetch AI insights
        const insightsRes = await fetch(`/api/crm/ai/insights?entity_type=person&entity_id=${personId}`)
        if (insightsRes.ok) {
          const insightsData = await insightsRes.json()
          setAiInsights(insightsData.insights || [])
        }
      } catch (err: any) {
        console.error("Error fetching person:", err)
        setError(err.message || "Failed to load person")
      } finally {
        setIsLoading(false)
      }
    }

    if (personId) {
      fetchPerson()
    }
  }, [personId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive">{error || "Person not found"}</div>
            <Button onClick={() => router.push("/admin/crm/people")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to People
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const name = `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email || "Unknown"

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/crm/people")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            {person.crm_companies && (
              <Link
                href={`/admin/crm/companies/${person.crm_companies.id}`}
                className="text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1"
              >
                <Building2 className="h-4 w-4" />
                {person.crm_companies.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <RecordActions entityType="person" recordId={personId} />
            <Button onClick={() => router.push(`/admin/crm/people/${personId}/edit`)}>Edit</Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{person.total_orders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${person.total_spent ? parseFloat(person.total_spent.toString()).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">First Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {person.first_order_date
                ? new Date(person.first_order_date).toLocaleDateString()
                : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {person.last_order_date
                ? new Date(person.last_order_date).toLocaleDateString()
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Record Widgets */}
          <RecordWidgets entityType="person" recordId={personId} />
          
          {/* Contact Deduplication */}
          <ContactDeduplication customerId={personId} />
          
          {/* Custom Fields */}
          <CustomFieldsPanel entityType="person" entityId={personId} />
          
          {/* AI Insights */}
          {aiInsights.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiInsights.map((insight) => (
                    <div key={insight.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.insight_type}
                        </Badge>
                        {insight.confidence_score && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(insight.confidence_score * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        {insight.insight_type === "summary" && insight.insight_data?.summary && (
                          <p>{insight.insight_data.summary}</p>
                        )}
                        {insight.insight_type === "segmentation" && (
                          <div>
                            <p className="font-medium">Segment: {insight.insight_data?.segment}</p>
                            {insight.insight_data?.reasoning && (
                              <p className="text-muted-foreground mt-1">{insight.insight_data.reasoning}</p>
                            )}
                          </div>
                        )}
                        {insight.insight_type === "scoring" && (
                          <div>
                            <p className="font-medium">Score: {insight.insight_data?.score}/100</p>
                            {insight.insight_data?.factors && (
                              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                {insight.insight_data.factors.map((factor: string, idx: number) => (
                                  <li key={idx}>{factor}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        {insight.insight_type === "recommendation" && insight.insight_data?.recommendations && (
                          <ul className="list-disc list-inside">
                            {insight.insight_data.recommendations.map((rec: string, idx: number) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={async () => {
                    setIsEnriching(true)
                    try {
                      await fetch("/api/crm/ai/enrich", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ customer_id: personId }),
                      })
                      // Refresh insights
                      const insightsRes = await fetch(`/api/crm/ai/insights?entity_type=person&entity_id=${personId}`)
                      if (insightsRes.ok) {
                        const insightsData = await insightsRes.json()
                        setAiInsights(insightsData.insights || [])
                      }
                    } catch (err) {
                      console.error("Error enriching:", err)
                    } finally {
                      setIsEnriching(false)
                    }
                  }}
                  disabled={isEnriching}
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insights
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {aiInsights.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate AI-powered insights about this person
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsEnriching(true)
                    try {
                      await fetch("/api/crm/ai/enrich", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ customer_id: personId }),
                      })
                      // Generate insights
                      await fetch("/api/crm/ai/insights", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          entity_type: "person",
                          entity_id: personId,
                          insight_type: "summary",
                        }),
                      })
                      // Refresh insights
                      const insightsRes = await fetch(`/api/crm/ai/insights?entity_type=person&entity_id=${personId}`)
                      if (insightsRes.ok) {
                        const insightsData = await insightsRes.json()
                        setAiInsights(insightsData.insights || [])
                      }
                    } catch (err) {
                      console.error("Error generating insights:", err)
                    } finally {
                      setIsEnriching(false)
                    }
                  }}
                  disabled={isEnriching}
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insights
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{person.email}</span>
                  </div>
                )}
                {person.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{person.phone}</span>
                  </div>
                )}
                {person.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {typeof person.address === "string" ? (
                        <span>{person.address}</span>
                      ) : (
                        <div>
                          {person.address.street && <div>{person.address.street}</div>}
                          {person.address.city && person.address.state && (
                            <div>
                              {person.address.city}, {person.address.state} {person.address.zip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Identifiers & Platforms */}
            <Card>
              <CardHeader>
                <CardTitle>Identifiers & Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {person.crm_contact_identifiers && person.crm_contact_identifiers.length > 0 ? (
                  person.crm_contact_identifiers.map((identifier) => (
                    <div key={identifier.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{identifier.identifier_type}</Badge>
                        <span className="text-sm">{identifier.identifier_value}</span>
                      </div>
                      {identifier.platform && (
                        <Badge variant="secondary" className="text-xs">
                          {identifier.platform}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No identifiers found</div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {person.tags && person.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {person.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {person.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{person.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity Timeline</CardTitle>
                <ActivityCreatorDialog
                  entityType="person"
                  entityId={personId}
                  onActivityCreated={() => {
                    // Refresh activities
                    fetch(`/api/crm/activities?customer_id=${personId}&limit=50`)
                      .then((res) => res.json())
                      .then((data) => setActivities(data.activities || []))
                      .catch(console.error)
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-l-2 pl-4 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{activity.activity_type}</Badge>
                        {activity.platform && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.platform}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-medium">{activity.title}</h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {!person.crm_customer_orders || person.crm_customer_orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              ) : (
                <div className="space-y-4">
                  {person.crm_customer_orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">
                            {order.order_number || order.order_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.order_source} • {order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                        <div className="text-right">
                          {order.total_amount && (
                            <div className="font-medium">
                              ${parseFloat(order.total_amount.toString()).toFixed(2)}
                            </div>
                          )}
                          {order.status && (
                            <Badge variant="outline" className="text-xs">
                              {order.status}
                            </Badge>
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

        <TabsContent value="conversations" className="space-y-4">
          <CommentsPanel parentType="person" parentId={personId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

