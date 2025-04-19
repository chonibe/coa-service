"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface VendorInstagramUrls {
  [vendor: string]: string
}

export default function InstagramAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vendorInstagramUrls, setVendorInstagramUrls] = useState<VendorInstagramUrls>({})
  const [newVendor, setNewVendor] = useState("")
  const [newInstagramUrl, setNewInstagramUrl] = useState("")

  const handleAddVendorInstagramUrl = async () => {
    if (newVendor && newInstagramUrl) {
      try {
        const response = await fetch("/api/settings/instagram-urls", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vendor: newVendor, instagramUrl: newInstagramUrl }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add vendor Instagram URL")
        }

        setVendorInstagramUrls((prev) => ({ ...prev, [newVendor]: newInstagramUrl }))
        setNewVendor("")
        setNewInstagramUrl("")
      } catch (error: any) {
        console.error("Error adding vendor Instagram URL:", error)
        setError(error.message || "Failed to add vendor Instagram URL")
      }
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin" className="flex items-center text-sm mb-2 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Instagram Admin</h1>
          <p className="text-muted-foreground mt-2">Manage Instagram integration settings</p>
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
            <CardTitle>Add Vendor Instagram URLs</CardTitle>
            <CardDescription>Manually add Instagram URLs for each vendor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-vendor">New Vendor</Label>
              <Input
                id="new-vendor"
                placeholder="Enter vendor name"
                value={newVendor}
                onChange={(e) => setNewVendor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-instagram-url">Instagram URL</Label>
              <Input
                id="new-instagram-url"
                type="url"
                placeholder="Enter Instagram URL"
                value={newInstagramUrl}
                onChange={(e) => setNewInstagramUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleAddVendorInstagramUrl} disabled={!newVendor || !newInstagramUrl}>
              Add Vendor URL
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
