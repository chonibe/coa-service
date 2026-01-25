"use client"

import { useState, useEffect } from "react"




 // Using label as placeholder if Input is not available
import { Search, Shield, ShieldAlert, ShieldCheck, Clock, User, Database } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button, Input } from "@/components/ui"
interface AuditLog {
  id: string
  executed_at: string
  executed_by: string
  sql_query: string
  query_type: string
  allowed: boolean
  error_message?: string
}

export default function SecurityAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 })

  useEffect(() => {
    fetchLogs()
  }, [pagination.offset])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/security/audit?limit=${pagination.limit}&offset=${pagination.offset}`)
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs")
      }
      const data = await response.json()
      setLogs(data.logs)
      setPagination(prev => ({ ...prev, total: data.pagination.total }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))
    }
  }

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Audit Logs</h1>
            <p className="text-muted-foreground">Monitor all raw SQL executions and security-critical events.</p>
          </div>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.allowed && !l.error_message).length} (Current Page)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked/Failed</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {logs.filter(l => !l.allowed || l.error_message).length} (Current Page)
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent SQL Operations</CardTitle>
          <CardDescription>A list of all raw SQL queries executed via the exec_sql function.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[300px]">Query Snippet</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.executed_at), "MMM d, HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {log.executed_by}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.query_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <code className="text-xs block bg-muted p-1 rounded truncate" title={log.sql_query}>
                          {log.sql_query}
                        </code>
                      </TableCell>
                      <TableCell>
                        {!log.allowed ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : log.error_message ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : (
                          <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
                            Allowed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handlePrevPage} 
                disabled={pagination.offset === 0 || loading} 
                variant="outline" 
                size="sm"
              >
                Previous
              </Button>
              <Button 
                onClick={handleNextPage} 
                disabled={pagination.offset + pagination.limit >= pagination.total || loading} 
                variant="outline" 
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
