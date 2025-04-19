"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Instagram, Loader2, PlusCircle, RefreshCw, Save, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface InstagramVendor {
  id?: string
  vendor_id: string
  vendor_name: string
  instagram_username: string
  instagram_account_id: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export default function InstagramVendorsPage() {
  const [vendors, setVendors] = useState<InstagramVendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentVendor, setCurrentVendor] = useState<InstagramVendor | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({})

  // Form state
  const [formData, setFormData] = useState<InstagramVendor>({
    vendor_id: "",
    vendor_name: "",
    instagram_username: "",
    instagram_account_id: "",
    is_active: true,
  })

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("instagram_vendors")
        .select("*")
        .order("vendor_name", { ascending: true })

      if (error) throw error

      setVendors(data || [])
    } catch (err: any) {
      console.error("Error fetching Instagram vendors:", err)
      setError(err.message || "Failed to fetch Instagram vendors")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleAddVendor = () => {
    setFormData({
      vendor_id: "",
      vendor_name: "",
      instagram_username: "",
      instagram_account_id: "",
      is_active: true,
    })
    setCurrentVendor(null)
    setIsDialogOpen(true)
  }

  const handleEditVendor = (vendor: InstagramVendor) => {
    setFormData(vendor)
    setCurrentVendor(vendor)
    setIsDialogOpen(true)
  }

  const handleSaveVendor = async () => {
    // Validate form data
    if (!formData.vendor_id || !formData.vendor_name) {
      toast({
        title: "Validation Error",
        description: "Vendor ID and Vendor Name are required fields",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // If we have an ID, update the existing record, otherwise insert a new one
      const { data, error } = currentVendor?.id
        ? await supabase
            .from("instagram_vendors")
            .update({
              vendor_id: formData.vendor_id,
              vendor_name: formData.vendor_name,
              instagram_username: formData.instagram_username,
              instagram_account_id: formData.instagram_account_id,
              is_active: formData.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentVendor.id)
            .select()
        : await supabase
            .from("instagram_vendors")
            .insert({
              vendor_id: formData.vendor_id,
              vendor_name: formData.vendor_name,
              instagram_username: formData.instagram_username,
              instagram_account_id: formData.instagram_account_id,
              is_active: formData.is_active,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()

      if (error) throw error

      toast({
        title: "Success",
        description: currentVendor?.id ? "Vendor updated successfully" : "Vendor added successfully",
      })

      // Refresh the vendor list
      fetchVendors()
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("Error saving Instagram vendor:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to save Instagram vendor",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteVendor = async (vendor: InstagramVendor) => {
    if (!confirm(`Are you sure you want to delete ${vendor.vendor_name}?`)) {
      return
    }

    try {
      const { error } = await supabase.from("instagram_vendors").delete().eq("id", vendor.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      })

      // Refresh the vendor list
      fetchVendors()
    } catch (err: any) {
      console.error("Error deleting Instagram vendor:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete Instagram vendor",
        variant: "destructive",
      })
    }
  }

  const refreshInstagramData = async (vendor: InstagramVendor) => {
    if (!vendor.instagram_account_id) {
      toast({
        title: "Error",
        description: "Instagram Account ID is required to refresh data",
        variant: "destructive",
      })
      return
    }

    setIsRefreshing({ ...isRefreshing, [vendor.id!]: true })

    try {
      // Fetch profile data
      const profileResponse = await fetch(
        `/api/instagram/profile?vendorId=${vendor.vendor_id}&accountId=${vendor.instagram_account_id}`,
      )

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch Instagram profile: ${profileResponse.statusText}`)
      }

      const profileData = await profileResponse.json()

      // Fetch media data
      const mediaResponse = await fetch(
        `/api/instagram/media?vendorId=${vendor.vendor_id}&accountId=${vendor.instagram_account_id}`,
      )

      if (!mediaResponse.ok) {
        throw new Error(`Failed to fetch Instagram media: ${mediaResponse.statusText}`)
      }

      const mediaData = await mediaResponse.json()

      toast({
        title: "Success",
        description: `Refreshed Instagram data for ${vendor.vendor_name}. Found ${mediaData.media?.length || 0} media items.`,
      })
    } catch (err: any) {
      console.error("Error refreshing Instagram data:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to refresh Instagram data",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing({ ...isRefreshing, [vendor.id!]: false })
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instagram Vendors</h1>
            <p className="text-muted-foreground mt-2">Manage Instagram connections for your vendors</p>
          </div>
          <Button onClick={handleAddVendor}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor List</CardTitle>
            <CardDescription>
              Connect your vendors to their Instagram accounts to display their content on your store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-8">
                <Instagram className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Instagram vendors found</h3>
                <p className="text-muted-foreground mt-2">
                  Add your first vendor to start connecting Instagram accounts.
                </p>
                <Button onClick={handleAddVendor} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Vendor
                </Button>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Vendor ID</TableHead>
                      <TableHead>Instagram Username</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                        <TableCell>{vendor.vendor_id}</TableCell>
                        <TableCell>
                          {vendor.instagram_username ? (
                            <a
                              href={`https://instagram.com/${vendor.instagram_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:underline"
                            >
                              @{vendor.instagram_username}
                              <Instagram className="ml-1 h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vendor.instagram_account_id || <span className="text-muted-foreground">Not set</span>}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              vendor.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {vendor.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refreshInstagramData(vendor)}
                              disabled={!vendor.instagram_account_id || isRefreshing[vendor.id!]}
                            >
                              {isRefreshing[vendor.id!] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              <span className="sr-only">Refresh</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditVendor(vendor)}>
                              <Save className="h-3 w-3" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteVendor(vendor)}>
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
            <DialogDescription>
              {currentVendor
                ? "Update the Instagram connection details for this vendor."
                : "Connect a vendor to their Instagram account."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendor_id" className="text-right">
                Vendor ID*
              </Label>
              <Input
                id="vendor_id"
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendor_name" className="text-right">
                Vendor Name*
              </Label>
              <Input
                id="vendor_name"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instagram_username" className="text-right">
                Instagram Username
              </Label>
              <Input
                id="instagram_username"
                name="instagram_username"
                value={formData.instagram_username}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="without @ symbol"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instagram_account_id" className="text-right">
                Account ID
              </Label>
              <Input
                id="instagram_account_id"
                name="instagram_account_id"
                value={formData.instagram_account_id}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Instagram Business Account ID"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_active" className="text-sm font-normal">
                  Show this vendor's Instagram content on the store
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVendor} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
