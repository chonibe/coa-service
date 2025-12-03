"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Merge, X, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DuplicateContact {
  customer_id: string
  duplicate_customer_id: string
  match_score: number
  matching_identifiers: string[]
}

interface ContactDeduplicationProps {
  customerId?: string
  onMergeComplete?: () => void
}

export function ContactDeduplication({ customerId, onMergeComplete }: ContactDeduplicationProps) {
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [merging, setMerging] = useState<string | null>(null)
  const [merged, setMerged] = useState<string[]>([])

  useEffect(() => {
    fetchDuplicates()
  }, [customerId])

  const fetchDuplicates = async () => {
    try {
      setIsLoading(true)
      let url = "/api/crm/contacts/duplicates"
      if (customerId) {
        url += `?customer_id=${customerId}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch duplicates")
      }

      const data = await response.json()
      setDuplicates(data.duplicates || [])
    } catch (err) {
      console.error("Error fetching duplicates:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMerge = async (duplicate: DuplicateContact) => {
    if (!confirm(`Are you sure you want to merge these contacts? This cannot be undone.`)) {
      return
    }

    try {
      setMerging(duplicate.duplicate_customer_id)
      
      const response = await fetch("/api/crm/contacts/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merged_into_customer_id: duplicate.customer_id,
          merged_from_customer_id: duplicate.duplicate_customer_id,
          merge_reason: "User-initiated merge from deduplication UI",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to merge contacts")
      }

      setMerged([...merged, duplicate.duplicate_customer_id])
      setDuplicates(duplicates.filter(d => d.duplicate_customer_id !== duplicate.duplicate_customer_id))
      
      if (onMergeComplete) {
        onMergeComplete()
      }
    } catch (err: any) {
      console.error("Error merging contacts:", err)
      alert(err.message || "Failed to merge contacts")
    } finally {
      setMerging(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (duplicates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Duplicate Contacts
          </CardTitle>
          <CardDescription>
            No duplicate contacts found
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Group duplicates by customer_id
  const grouped = duplicates.reduce((acc, dup) => {
    if (!acc[dup.customer_id]) {
      acc[dup.customer_id] = []
    }
    acc[dup.customer_id].push(dup)
    return acc
  }, {} as Record<string, DuplicateContact[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Duplicate Contacts
        </CardTitle>
        <CardDescription>
          Found {duplicates.length} potential duplicate contact{duplicates.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            Review the suggested duplicates below. Merging will combine all data from both contacts into one.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {Object.entries(grouped).map(([customerId, dups]) => (
            <div key={customerId} className="border rounded-lg p-4 space-y-3">
              <div className="font-medium">Contact {customerId.slice(0, 8)}...</div>
              {dups.map((dup) => (
                <div
                  key={dup.duplicate_customer_id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {dup.match_score}% match
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Duplicate: {dup.duplicate_customer_id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Matching identifiers:</div>
                      <div className="flex flex-wrap gap-1">
                        {dup.matching_identifiers.map((identifier, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {identifier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {merged.includes(dup.duplicate_customer_id) ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Merged
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleMerge(dup)}
                        disabled={merging === dup.duplicate_customer_id}
                      >
                        {merging === dup.duplicate_customer_id ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Merging...
                          </>
                        ) : (
                          <>
                            <Merge className="mr-2 h-3 w-3" />
                            Merge
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

