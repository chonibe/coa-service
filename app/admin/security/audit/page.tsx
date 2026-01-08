"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/app/admin/admin-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, ShieldAlert, Search, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface AuditLog {
  id: string
  executed_at: string
  executed_by: string
  sql_query: string
  query_type: string
  allowed: boolean
  error_message: string | null
}

export default function SecurityAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchBy] = useState("")

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/security/audit?limit=50")
      if (!response.ok) throw new Error("Failed to fetch logs")
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => 
    log.executed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.sql_query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.query_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor all manual SQL executions and security events.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, query, or type..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchBy(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SQL Execution History</CardTitle>
            <CardDescription>
              A detailed log of all queries processed through the secure exec_sql function.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Executed By</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="max-w-[400px]">Query</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(log.executed_at), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-medium">{log.executed_by}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.query_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.allowed ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">Allowed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive font-bold">
                            <ShieldAlert className="h-4 w-4" />
                            <span className="text-xs">Blocked</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] max-w-[400px] truncate" title={log.sql_query}>
                        {log.sql_query}
                        {log.error_message && (
                          <p className="text-destructive mt-1 text-[9px] italic">
                            Error: {log.error_message}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}

