"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CreditCard, 
  Loader2,
  AlertCircle,
  Plus,
  X
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Subscription {
  id: string
  collector_identifier: string
  subscription_status: string
  monthly_credit_amount: number
  subscription_tier?: string
  billing_amount_usd: number
  payment_method: string
  payment_subscription_id?: string
  started_at: string
  next_billing_date: string
  last_credited_at?: string
  paused_at?: string
  cancelled_at?: string
}

interface SubscriptionManagerProps {
  collectorIdentifier: string
}

export function SubscriptionManager({ collectorIdentifier }: SubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [monthlyCredits, setMonthlyCredits] = useState("")
  const [billingAmount, setBillingAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("stripe")
  const [subscriptionTier, setSubscriptionTier] = useState("")

  useEffect(() => {
    fetchSubscriptions()
  }, [collectorIdentifier])

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/banking/subscriptions/manage?collector_identifier=${encodeURIComponent(collectorIdentifier)}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions")
      }

      const result = await response.json()
      if (result.success) {
        setSubscriptions(result.subscriptions || [])
      }
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to load subscriptions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSubscription = async () => {
    if (!monthlyCredits || !billingAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch("/api/banking/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          collector_identifier: collectorIdentifier,
          monthly_credit_amount: parseFloat(monthlyCredits),
          billing_amount_usd: parseFloat(billingAmount),
          payment_method: paymentMethod,
          subscription_tier: subscriptionTier || null,
          account_type: "vendor",
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create subscription")
      }

      toast({
        title: "Success",
        description: "Subscription created successfully",
      })

      setIsDialogOpen(false)
      setMonthlyCredits("")
      setBillingAmount("")
      setPaymentMethod("stripe")
      setSubscriptionTier("")
      fetchSubscriptions()
    } catch (err: any) {
      console.error("Error creating subscription:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create subscription",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return
    }

    try {
      const response = await fetch("/api/banking/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to cancel subscription")
      }

      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      })

      fetchSubscriptions()
    } catch (err: any) {
      console.error("Error cancelling subscription:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to cancel subscription",
        variant: "destructive",
      })
    }
  }

  const formatCredits = (credits: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(credits)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      paused: "secondary",
      cancelled: "destructive",
      expired: "destructive",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const activeSubscriptions = subscriptions.filter((s) => s.subscription_status === "active")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Subscriptions
            </CardTitle>
            <CardDescription>Monthly credit subscriptions</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subscription</DialogTitle>
                <DialogDescription>
                  Set up a monthly credit subscription
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyCredits">Monthly Credits</Label>
                  <Input
                    id="monthlyCredits"
                    type="number"
                    placeholder="1000"
                    value={monthlyCredits}
                    onChange={(e) => setMonthlyCredits(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAmount">Monthly Billing (USD)</Label>
                  <Input
                    id="billingAmount"
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Subscription Tier (Optional)</Label>
                  <Input
                    id="tier"
                    placeholder="basic, premium, custom"
                    value={subscriptionTier}
                    onChange={(e) => setSubscriptionTier(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateSubscription}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Subscription
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {activeSubscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active subscriptions</p>
            <p className="text-sm">Create a subscription to receive monthly credits</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCredits(subscription.monthly_credit_amount)} credits/month
                      </span>
                      {getStatusBadge(subscription.subscription_status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(subscription.billing_amount_usd)}/month
                      {subscription.subscription_tier && ` • ${subscription.subscription_tier}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelSubscription(subscription.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Next billing: {formatDate(subscription.next_billing_date)}
                  {subscription.last_credited_at && (
                    <> • Last credited: {formatDate(subscription.last_credited_at)}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

