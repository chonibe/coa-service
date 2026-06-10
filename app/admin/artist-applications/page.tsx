"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
} from "@/components/ui"
import { Loader2, RefreshCw } from "lucide-react"

type Application = {
  id: string
  created_at: string
  updated_at: string
  email: string
  name: string
  instagram: string | null
  portfolio_url: string | null
  bio: string | null
  status: string
  notes: string | null
  reviewed_at: string | null
}

export default function ArtistApplicationsPage() {
  const [rows, setRows] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/artist-applications", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to load")
      }
      setRows(data.applications || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artist applications</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Submissions from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/shop/artist-submissions</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/for-artists/apply</code>. Shop submissions
            include a prefix in the message field so you can tell the source apart.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All applications</CardTitle>
          <CardDescription>Newest first (up to 300).</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {loading && !rows.length ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Submitted</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Portfolio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[240px]">Message / bio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${r.email}`} className="text-primary hover:underline text-sm">
                          {r.email}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">{r.instagram || "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {r.portfolio_url ? (
                          <a
                            href={r.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Link
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-pre-wrap text-sm text-muted-foreground">
                        {r.bio || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
