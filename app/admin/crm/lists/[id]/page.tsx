"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Plus, Users, Building2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const listId = params.id as string
  
  const [list, setList] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (listId) {
      fetchList()
      fetchEntries()
    }
  }, [listId])

  const fetchList = async () => {
    try {
      const response = await fetch(`/api/crm/lists/${listId}`)
      if (!response.ok) throw new Error("Failed to fetch list")
      const data = await response.json()
      setList(data.list)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const fetchEntries = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/crm/lists/${listId}/entries`)
      if (!response.ok) throw new Error("Failed to fetch entries")
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !list) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!list) {
    return <div className="p-6">List not found</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/crm/lists")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lists
        </Button>
        <h1 className="text-3xl font-bold">{list.name}</h1>
        {list.description && <p className="text-muted-foreground mt-1">{list.description}</p>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Entries ({entries.length})</CardTitle>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No entries in this list
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  {entry.record ? (
                    <Link
                      href={`/admin/crm/${list.object_type === "person" ? "people" : "companies"}/${entry.record_id}`}
                      className="hover:underline"
                    >
                      {list.object_type === "person" ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{entry.record.first_name} {entry.record.last_name}</span>
                          {entry.record.email && (
                            <span className="text-muted-foreground text-sm">({entry.record.email})</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{entry.record.name}</span>
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div>Loading record...</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

