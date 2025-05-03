"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestPayoutFunctionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    testFunctions()
  }, [])

  const testFunctions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/vendors/test-functions")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to test functions")
      }

      const result = await response.json()
      setTestResult(result)

      toast({
        title: "Test completed",
        description: result.functionExists
          ? "Payout functions exist in the database."
          : "Payout functions do not exist in the database.",
      })
    } catch (err: any) {
      console.error("Error testing functions:", err)
      setError(err.message || "An error occurred while testing functions")
      toast({
        variant: "destructive",
        title: "Test failed",
        description: err.message || "An error occurred while testing functions",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializeFunctions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/vendors/init-payout-functions", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initialize functions")
      }

      await testFunctions()

      toast({
        title: "Initialization complete",
        description: "Payout functions have been initialized successfully.",
      })
    } catch (err: any) {
      console.error("Error initializing functions:", err)
      setError(err.message || "An error occurred while initializing functions")
      toast({
        variant: "destructive",
        title: "Initialization failed",
        description: err.message || "An error occurred while initializing functions",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Payout Functions</CardTitle>
          <CardDescription>Check if the payout functions are properly set up in the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {testResult && (
                  <Tabs defaultValue="summary">
                    <TabsList>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary">
                      <Alert variant={testResult.functionExists ? "default" : "destructive"}>
                        {testResult.functionExists ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>Function Status</AlertTitle>
                        <AlertDescription>
                          {testResult.functionExists
                            ? "The payout functions exist in the database."
                            : "The payout functions do not exist in the database."}
                        </AlertDescription>
                      </Alert>

                      {testResult.functionError && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Function Error</AlertTitle>
                          <AlertDescription>{testResult.functionError}</AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>
                    <TabsContent value="details">
                      <div className="rounded-md bg-muted p-4">
                        <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(testResult, null, 2)}</pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={testFunctions} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Functions"
                    )}
                  </Button>
                  <Button onClick={initializeFunctions} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      "Initialize Functions"
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
