"use client"

import { useState } from "react"

import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui"
export function OnboardingSetup() {
  const [isLoading, setIsLoading] = useState(false)

  const handleInitializeOnboarding = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendors/init-onboarding-fields", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to initialize onboarding fields")
      }

      toast({
        title: "Success",
        description: "Vendor onboarding fields initialized successfully",
      })
    } catch (error) {
      console.error("Error initializing onboarding fields:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize onboarding fields",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Onboarding Setup</CardTitle>
        <CardDescription>Initialize the database fields required for vendor onboarding</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This will add the necessary fields to the vendors table to support the onboarding wizard. Only run this once
          when setting up the vendor onboarding feature.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleInitializeOnboarding} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...
            </>
          ) : (
            "Initialize Onboarding Fields"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
