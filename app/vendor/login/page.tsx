"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Store } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function VendorLoginPage() {
  const [vendorName, setVendorName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendors, setVendors] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchVendors = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/vendors/names")

        if (!response.ok) {
          throw new Error("Failed to fetch vendors")
        }

        const data = await response.json()
        setVendors(data.vendors)
      } catch (err: any) {
        console.error("Error fetching vendors:", err)
        setError(err.message || "Failed to fetch vendors")
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

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/vendor/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Redirect to vendor dashboard
      router.push("/vendor/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to log in. Please check your vendor name and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Artist Portal</CardTitle>
          <CardDescription className="text-center">Select your artist name to access your dashboard</CardDescription>
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
                <Label htmlFor="vendor-name">Artist Name</Label>
                <Select value={vendorName} onValueChange={setVendorName} disabled={isLoading}>
                  <SelectTrigger id="vendor-name">
                    <SelectValue placeholder="Select your artist name" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
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
