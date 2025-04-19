"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function InstagramAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            <CardTitle>Instagram API Configuration</CardTitle>
            <CardDescription>Configure your Instagram API credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Settings coming soon!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
