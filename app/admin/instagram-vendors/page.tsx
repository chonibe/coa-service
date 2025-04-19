"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Pencil, Save } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Vendor {
  vendor_id: string
  instagram_username: string | null
  created_at: string
  updated_at: string
}

export default function InstagramVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [newInstagramUsername, setNewInstagramUsername] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const fetchVendors = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/instagram/vendors")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch vendors`)
      }

      const data = await response.json()
      setVendors(data.vendors || [])
    } catch (err: any) {
      console.error("Error fetching vendors:", err)
      setError(err.message || "Failed to fetch vendors")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const handleEditClick = (vendor: Vendor) => {
    setEditingVendorId(vendor.vendor_id)
    setNewInstagramUsername(vendor.instagram_username || "")
  }

  const handleSaveClick = async (vendorId: string) => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch("/api/instagram/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          instagramUsername: newInstagramUsername,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: Failed to update vendor`)
      }

      // Update the local state
      setVendors((prev) =>
        prev.map((v) => (v.vendor_id === vendorId ? { ...v, instagram_username: newInstagramUsername } : v)),
      )

      setEditingVendorId(null)
      toast({
        title: "Success",
        description: "Instagram username updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating vendor:", err)
      setError(err.message || "Failed to update vendor")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelClick = () => {
    setEditingVendorId(null)
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instagram Vendor Management</h1>
          <p className="text-muted-foreground mt-2">Manage Instagram usernames for each vendor</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Vendor List</CardTitle>
            <CardDescription>View and manage Instagram usernames for each vendor</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No vendors found.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor ID</TableHead>
                      <TableHead>Instagram Username</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.vendor_id}>
                        <TableCell className="font-medium">{vendor.vendor_id}</TableCell>
                        <TableCell>
                          {editingVendorId === vendor.vendor_id ? (
                            <Input
                              type="text"
                              value={newInstagramUsername}
                              onChange={(e) => setNewInstagramUsername(e.target.value)}
                              disabled={isSaving}
                            />
                          ) : (
                            vendor.instagram_username || <span className="text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingVendorId === vendor.vendor_id ? (
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" onClick={() => handleSaveClick(vendor.vendor_id)} disabled={isSaving}>
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleCancelClick} disabled={isSaving}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditClick(vendor)}>
                                  Edit Instagram Username
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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
    </div>
  )
}
