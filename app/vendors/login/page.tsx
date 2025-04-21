"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VendorLoginPage() {
  const [vendorName, setVendorName] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // Basic validation
    if (!vendorName.trim()) {
      alert("Please enter your vendor name.")
      return
    }

    // Store vendor name in local storage or cookie for simple session management
    localStorage.setItem("vendorName", vendorName)

    // Redirect to vendor dashboard
    router.push("/vendors/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Vendor Login</CardTitle>
          <CardDescription className="text-center">Enter your vendor name to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="vendor-name">Vendor Name</Label>
              <Input
                type="text"
                id="vendor-name"
                placeholder="Your Vendor Name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
