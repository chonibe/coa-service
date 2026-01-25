"use client"

import { useState, useEffect } from "react"




import { Loader2, AlertCircle, CheckCircle, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Alert, AlertDescription, AlertTitle, Badge } from "@/components/ui"
interface StripeConnectProps {
  vendorName: string
}

export function StripeConnect({ vendorName }: StripeConnectProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountStatus, setAccountStatus] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAccountStatus()
  }, [vendorName])

  const checkAccountStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/stripe/account-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check account status")
      }

      setAccountStatus(data)
    } catch (err: any) {
      console.error("Error checking Stripe account status:", err)
      setError(err.message || "Failed to check account status")
    } finally {
      setIsLoading(false)
    }
  }

  const createStripeAccount = async () => {
    try {
      setIsCreating(true)
      setError(null)

      const response = await fetch("/api/stripe/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create Stripe account")
      }

      toast({
        title: "Stripe account created",
        description: "Your Stripe account has been created successfully.",
      })

      // Refresh account status
      await checkAccountStatus()
    } catch (err: any) {
      console.error("Error creating Stripe account:", err)
      setError(err.message || "Failed to create Stripe account")
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create Stripe account",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const connectStripeAccount = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      const response = await fetch("/api/stripe/onboarding-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create onboarding link")
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (err: any) {
      console.error("Error connecting Stripe account:", err)
      setError(err.message || "Failed to connect Stripe account")
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to connect Stripe account",
      })
      setIsConnecting(false)
    }
  }

  const handleRefresh = () => {
    checkAccountStatus()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Connect your Stripe account to receive payouts</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // No Stripe account yet
  if (!accountStatus?.hasStripeAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Connect your Stripe account to receive payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                You need to connect a Stripe account to receive payouts directly to your bank account.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createStripeAccount} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Stripe Account"
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Has Stripe account but onboarding not complete
  if (!accountStatus?.isOnboardingComplete) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Stripe Connect</CardTitle>
            <CardDescription>Complete your Stripe account setup</CardDescription>
          </div>
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Setup Incomplete
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Onboarding Required</AlertTitle>
              <AlertDescription>
                Your Stripe account has been created, but you need to complete the onboarding process to receive
                payouts.
              </AlertDescription>
            </Alert>

            {accountStatus?.requirements?.currently_due?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Required Information:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {accountStatus.requirements.currently_due.map((item: string, index: number) => (
                    <li key={index}>{item.replace(/_/g, " ")}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
          <Button onClick={connectStripeAccount} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Complete Setup
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Stripe account fully set up
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Your payment account is connected</CardDescription>
        </div>
        <Badge variant="outline" className="text-green-500 border-green-500">
          Connected
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Your Stripe account is fully set up and ready to receive payouts</span>
          </div>

          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Account ID:</div>
              <div className="font-mono">{accountStatus.accountId.slice(0, 8)}...</div>

              <div className="text-muted-foreground">Business Type:</div>
              <div className="capitalize">{accountStatus.accountDetails.business_type}</div>

              <div className="text-muted-foreground">Country:</div>
              <div>{accountStatus.accountDetails.country}</div>

              <div className="text-muted-foreground">Currency:</div>
              <div className="uppercase">{accountStatus.accountDetails.default_currency}</div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
        <Button variant="outline" onClick={() => window.open("https://dashboard.stripe.com/", "_blank")}>
          Stripe Dashboard
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
