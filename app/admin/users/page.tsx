"use client"

/**
 * Admin: User Role Management
 * 
 * Allows admins to:
 * - View all users and their roles
 * - Assign/revoke roles
 * - Grant permission overrides
 * - View role change audit log
 */

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
} from "@/components/ui"
import { Shield, Users, UserPlus, History, Search, AlertCircle } from "lucide-react"

interface User {
  id: string
  email: string
  roles: Array<{
    role: string
    resource_id?: number
    is_active: boolean
    granted_at: string
    vendor_name?: string
  }>
  created_at: string
}

interface AuditLog {
  id: string
  user_id: string
  user_email: string
  role: string
  action: string
  performed_by_email: string
  performed_at: string
  reason?: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedVendorId, setSelectedVendorId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
    loadAuditLogs()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/users/roles")
      if (!response.ok) throw new Error("Failed to load users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/users/audit-log")
      if (!response.ok) throw new Error("Failed to load audit logs")
      const data = await response.json()
      setAuditLogs(data.logs || [])
    } catch (err: any) {
      console.error("Failed to load audit logs:", err)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return

    try {
      const response = await fetch("/api/admin/users/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          role: selectedRole,
          resource_id: selectedVendorId ? parseInt(selectedVendorId) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to assign role")
      }

      // Reload data
      await loadUsers()
      await loadAuditLogs()

      // Close dialog and reset
      setIsAssignRoleDialogOpen(false)
      setSelectedUser(null)
      setSelectedRole("")
      setSelectedVendorId("")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRevokeRole = async (userId: string, role: string) => {
    if (!confirm(`Are you sure you want to revoke the ${role} role?`)) return

    try {
      const response = await fetch("/api/admin/users/revoke-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to revoke role")
      }

      // Reload data
      await loadUsers()
      await loadAuditLogs()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "vendor":
        return "default"
      case "collector":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "granted":
        return "text-green-600"
      case "revoked":
        return "text-red-600"
      case "modified":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            User Role Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions for the RBAC system
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Log ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    View and manage user roles across the platform
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((roleData, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <Badge variant={getRoleBadgeColor(roleData.role)}>
                                  {roleData.role}
                                  {roleData.vendor_name && ` (${roleData.vendor_name})`}
                                </Badge>
                                {roleData.is_active && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRevokeRole(user.id, roleData.role)}
                                    className="h-5 w-5 p-0"
                                  >
                                    ×
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsAssignRoleDialogOpen(true)
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Change Audit Log</CardTitle>
              <CardDescription>
                Track all role assignments and revocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No audit logs
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.user_email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeColor(log.role)}>
                            {log.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={getActionColor(log.action)}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>{log.performed_by_email}</TableCell>
                        <TableCell>
                          {new Date(log.performed_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.reason || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a role to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="collector">Collector</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "vendor" && (
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Vendor ID (optional)</Label>
                <Input
                  id="vendor_id"
                  type="number"
                  placeholder="Enter vendor ID"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRole}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
