"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Store } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

export default function VendorLoginPage() {
  const [vendorName, setVendorName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routerLoading, setRouterLoading] = useState(false)
  const [availableVendors, setAvailableVendors] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchVendors = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("vendor_name")
          .order("vendor_name", { ascending: true })

        if (error) {
          throw new Error(error.message || "Failed to fetch vendors")
        }

        setAvailableVendors(data.map((vendor) => vendor.vendor_name))
      } catch (err: any) {
        console.error("Error fetching vendors:", err)
        setError(err.message || "Failed to fetch available vendors")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendors()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vendorName.trim()) {
      setError("Please select your vendor name")
      return
    }

    setRouterLoading(true)
    setError(null)

    try {
      // Simulate login process
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to vendor dashboard
      router.push(`/vendor/dashboard?vendorName=${vendorName}`)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to log in. Please check your vendor name and try again.")
    } finally {
      setRouterLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Vendor Portal</CardTitle>
          <CardDescription className="text-center">Select your vendor name to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Select value={vendorName} onValueChange={setVendorName} disabled={isLoading}>
                  <SelectTrigger id="vendor-name">
                    <SelectValue placeholder="Select your vendor name" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={routerLoading || isLoading}>
                {routerLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Contact the administrator if you need assistance.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
