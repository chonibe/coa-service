"use client"

import { CardDescription } from "@/components/ui/card"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@chakra-ui/react"
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from "@chakra-ui/react"
import { Input } from "@/components/ui/input"
import { FormControl, FormLabel } from "@chakra-ui/react"
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { Lock } from "lucide-react"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Invalid password")
      }

      // Set a cookie to indicate the user is logged in
      document.cookie = "admin_session=true; path=/; max-age=86400; SameSite=Lax" // 24 hours

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (err: any) {
      setError(err.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">Enter your password to access the admin area</CardDescription>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert status="error" className="mb-4">
              <AlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-2">
                <FormControl>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </FormControl>
              </div>
            </div>
          </form>
        </CardBody>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
