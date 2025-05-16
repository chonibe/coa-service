"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function InitPayoutsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<Record<string, { success: boolean; message: string }>>({})
  const { toast } = useToast()

  useEffect(() => {
    initializePayouts()
  }, [])

  const initializePayouts = async () => {
    setIsLoading(true)
    setStatus({})

    try {
      // Initialize payout tables
      await initStep("tables", "Initializing payout tables", "/api/vendors/init-payout-tables")

      // Initialize payout functions
      await initStep("functions", "Initializing payout functions", "/api/vendors/init-payout-functions")

      // Initialize vendor data
      await initStep("vendors", "Initializing vendor data", "/api/vendors/sync")

      toast({
        title: "Initialization complete",
        description: "Payout system has been initialized successfully.",
      })
    } catch (err: any) {
      console.error("Error during initialization:", err)
      toast({
        variant: "destructive",
        title: "Initialization failed",
        description: err.message || "An error occurred during initialization.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initStep = async (key: string, description: string, endpoint: string) => {
    setStatus((prev) => ({
      ...prev,
      [key]: { success: false, message: `${description}...` },
    }))

    try {
      const response = await fetch(endpoint, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${description.toLowerCase()}`)
      }

      setStatus((prev) => ({
        ...prev,
        [key]: { success: true, message: `${description} completed successfully.` },
      }))
    } catch (err: any) {
      setStatus((prev) => ({
        ...prev,
        [key]: { success: false, message: err.message || `Failed to ${description.toLowerCase()}` },
      }))
      throw err
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Initialize Payout System</CardTitle>
          <CardDescription>Set up the database tables and functions for the vendor payout system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoading && Object.keys(status).length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {Object.entries(status).map(([key, { success, message }]) => (
                    <Alert key={key} variant={success ? "default" : "destructive"}>
                      {success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertTitle>{key.charAt(0).toUpperCase() + key.slice(1)}</AlertTitle>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button onClick={initializePayouts} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      "Reinitialize"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
