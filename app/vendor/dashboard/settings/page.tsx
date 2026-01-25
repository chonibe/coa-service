"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle, Save, DollarSign, FileText, User, Sparkles, Clock, Zap } from "lucide-react"

interface VendorProfile {
  id: string
  vendor_name: string
  paypal_email: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
  address: string | null
  delivery_address1: string | null
  delivery_address2: string | null
  delivery_city: string | null
  delivery_province: string | null
  delivery_country: string | null
  delivery_zip: string | null
  delivery_phone: string | null
  delivery_name: string | null
  phone: string | null
  contact_name: string | null
  contact_email: string | null
  created_at: string
}

interface FormState {
  paypal_email: string
  tax_id: string
  tax_country: string
  is_company: boolean
  address: string
  delivery_address1: string
  delivery_address2: string
  delivery_city: string
  delivery_province: string
  delivery_country: string
  delivery_zip: string
  delivery_phone: string
  delivery_name: string
  phone: string
  contact_name: string
  contact_email: string
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "South Africa",
  "Other",
]

export default function VendorSettingsPage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [completionSteps, setCompletionSteps] = useState({
    profile: false,
    payment: false,
    tax: false,
  })
  const { toast } = useToast()

  const [formState, setFormState] = useState<FormState>({
    paypal_email: "",
    tax_id: "",
    tax_country: "",
    is_company: false,
    address: "",
    delivery_address1: "",
    delivery_address2: "",
    delivery_city: "",
    delivery_province: "",
    delivery_country: "",
    delivery_zip: "",
    delivery_phone: "",
    delivery_name: "",
    phone: "",
    contact_name: "",
    contact_email: "",
  })

  const [notificationPrefs, setNotificationPrefs] = useState({
    notify_on_collector_auth: true,
    weekly_auth_digest: false,
  })

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/vendor/profile", {
          credentials: "include",
        })
        if (!response.ok) {
          throw new Error("Failed to fetch vendor profile")
        }
        const data = await response.json()
        setProfile(data.vendor)

        // Initialize form state with vendor data
        if (data.vendor) {
          setFormState({
            paypal_email: data.vendor.paypal_email || "",
            tax_id: data.vendor.tax_id || "",
            tax_country: data.vendor.tax_country || "",
            is_company: data.vendor.is_company || false,
            address: data.vendor.address || "",
            delivery_address1: data.vendor.delivery_address1 || "",
            delivery_address2: data.vendor.delivery_address2 || "",
            delivery_city: data.vendor.delivery_city || "",
            delivery_province: data.vendor.delivery_province || "",
            delivery_country: data.vendor.delivery_country || "",
            delivery_zip: data.vendor.delivery_zip || "",
            delivery_phone: data.vendor.delivery_phone || "",
            delivery_name: data.vendor.delivery_name || "",
            phone: data.vendor.phone || "",
            contact_name: data.vendor.contact_name || "",
            contact_email: data.vendor.contact_email || "",
          })

          // Check completion steps
          updateCompletionSteps(data.vendor)
        }
      } catch (err) {
        console.error("Error fetching vendor profile:", err)
        setError(err instanceof Error ? err.message : "Failed to load vendor profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorProfile()
  }, [])

  const updateCompletionSteps = (vendor: VendorProfile) => {
    setCompletionSteps({
      profile: !!(vendor.contact_name && vendor.contact_email && vendor.phone && vendor.address),
      payment: !!vendor.paypal_email,
      tax: !!(vendor.tax_id && vendor.tax_country),
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormState((prev) => ({ ...prev, is_company: checked }))
  }

  const handleSelectChange = (value: string) => {
    setFormState((prev) => ({ ...prev, tax_country: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/vendor/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formState),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }

      const result = await response.json()
      
      if (result.vendor) {
        setProfile(result.vendor)
        updateCompletionSteps(result.vendor)
        // Update form state with fresh data from server
        setFormState((prev) => ({
          ...prev,
          contact_name: result.vendor.contact_name || "",
          contact_email: result.vendor.contact_email || "",
          phone: result.vendor.phone || "",
          address: result.vendor.address || "",
          delivery_address1: result.vendor.delivery_address1 || "",
          delivery_address2: result.vendor.delivery_address2 || "",
          delivery_city: result.vendor.delivery_city || "",
          delivery_province: result.vendor.delivery_province || "",
          delivery_country: result.vendor.delivery_country || "",
          delivery_zip: result.vendor.delivery_zip || "",
          delivery_phone: result.vendor.delivery_phone || "",
          delivery_name: result.vendor.delivery_name || "",
          paypal_email: result.vendor.paypal_email || "",
          tax_id: result.vendor.tax_id || "",
          tax_country: result.vendor.tax_country || "",
          is_company: result.vendor.is_company || false,
        }))
      }

      toast({
        title: "Settings updated",
        description: "Your vendor profile has been successfully updated.",
      })
    } catch (err) {
      console.error("Error updating settings:", err)
      setError(err instanceof Error ? err.message : "Failed to update settings")
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update settings",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getCompletionPercentage = () => {
    const steps = Object.values(completionSteps)
    const completed = steps.filter(Boolean).length
    return Math.round((completed / steps.length) * 100)
  }

  const handleSwitchToCollector = async () => {
    try {
      setIsSwitching(true)
      const res = await fetch("/api/auth/collector/switch", { method: "POST", credentials: "include" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Unable to switch to collector view")
      }
      toast({
        title: "Collector view ready",
        description: "Redirecting to your collector dashboard.",
      })
      window.location.href = "/collector/dashboard"
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Switch failed",
        description: err.message || "Could not start collector view",
      })
    } finally {
      setIsSwitching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Payout Settings Component
  function PayoutSettings({ profile }: { profile: VendorProfile | null }) {
    const [instantPayoutsEnabled, setInstantPayoutsEnabled] = useState(false)
    const [instantPayoutFeePercent, setInstantPayoutFeePercent] = useState(0)
    const [minimumPayoutAmount, setMinimumPayoutAmount] = useState(10)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
      // Fetch current payout schedule settings
      const fetchPayoutSettings = async () => {
        if (!profile) return
        try {
          const response = await fetch("/api/admin/payouts/schedules")
          if (response.ok) {
            const data = await response.json()
            const vendorSchedule = data.schedules?.find((s: any) => s.vendor_name === profile.vendor_name)
            if (vendorSchedule) {
              setInstantPayoutsEnabled(vendorSchedule.instant_payouts_enabled || false)
              setInstantPayoutFeePercent(vendorSchedule.instant_payout_fee_percent || 0)
              setMinimumPayoutAmount(vendorSchedule.minimum_amount || 10)
            }
          }
        } catch (error) {
          console.error("Error fetching payout settings:", error)
        }
      }
      fetchPayoutSettings()
    }, [profile])

    const handleSavePayoutSettings = async () => {
      if (!profile) return
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/payouts/schedules/${profile.vendor_name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instant_payouts_enabled: instantPayoutsEnabled,
            instant_payout_fee_percent: instantPayoutFeePercent,
            minimum_amount: minimumPayoutAmount,
          }),
        })

        if (!response.ok) throw new Error("Failed to update payout settings")

        toast({
          title: "Payout settings updated",
          description: "Your payout preferences have been saved.",
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update payout settings",
        })
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Payout Preferences</CardTitle>
          <CardDescription>Configure your payout schedule and instant payout options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payout Schedule Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Payout Schedule</h3>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Automated Payouts</AlertTitle>
              <AlertDescription>
                Your payouts are processed automatically according to your schedule. Contact support if you need to modify your payout frequency or minimum amounts.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Instant Payouts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Instant Payouts</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Instant Payouts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get paid immediately for any available balance above your minimum threshold
                  </p>
                </div>
                <Switch
                  checked={instantPayoutsEnabled}
                  onCheckedChange={setInstantPayoutsEnabled}
                />
              </div>

              {instantPayoutsEnabled && (
                <div className="space-y-4 ml-4 border-l-2 border-muted pl-4">
                  <div className="space-y-2">
                    <Label>Minimum Instant Payout Amount ($)</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={minimumPayoutAmount}
                      onChange={(e) => setMinimumPayoutAmount(parseFloat(e.target.value) || 10)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum amount required for instant payout requests
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Instant Payout Fee (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={instantPayoutFeePercent}
                      onChange={(e) => setInstantPayoutFeePercent(parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Fee charged for instant payouts (set by admin, usually 1-3%)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Method Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Payment Methods</h3>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Method Setup</AlertTitle>
              <AlertDescription>
                Configure your PayPal email in the Payment tab. PayPal is used by default for all vendor payouts.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSavePayoutSettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Payout Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-lg">Your account settings and preferences</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              View as Collector
            </CardTitle>
            <CardDescription>Switch into your own collector profile (matches your vendor email).</CardDescription>
          </div>
          <Button onClick={handleSwitchToCollector} disabled={isSwitching}>
            {isSwitching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            View collector dashboard
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
                {completionSteps.profile && <CheckCircle className="h-3 w-3 text-green-500 ml-1" />}
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Payment</span>
                {completionSteps.payment && <CheckCircle className="h-3 w-3 text-green-500 ml-1" />}
              </TabsTrigger>
              <TabsTrigger value="tax" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Tax Info</span>
                {completionSteps.tax && <CheckCircle className="h-3 w-3 text-green-500 ml-1" />}
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Payouts</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="profile" className="space-y-4 mt-4">
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Keep your contact details current so we can stay in touch</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">Contact Name</Label>
                        <Input
                          id="contact_name"
                          name="contact_name"
                          placeholder="Full Name"
                          value={formState.contact_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Contact Email</Label>
                        <Input
                          id="contact_email"
                          name="contact_email"
                          type="email"
                          placeholder="email@example.com"
                          value={formState.contact_email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+1 (555) 123-4567"
                        value={formState.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Business Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        placeholder="Enter your full business address"
                        value={formState.address}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-4 border-t pt-4 mt-4">
                      <div>
                        <Label className="text-base font-semibold">Delivery Address</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          This address will be used for shipping store purchases (Lamps and proof prints). 
                          Structured format matches Shopify order requirements.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_name">Full Name</Label>
                        <Input
                          id="delivery_name"
                          name="delivery_name"
                          placeholder="John Doe"
                          value={formState.delivery_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_address1">Street Address</Label>
                        <Input
                          id="delivery_address1"
                          name="delivery_address1"
                          placeholder="123 Main Street"
                          value={formState.delivery_address1}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_address2">Apartment, Suite, etc. (Optional)</Label>
                        <Input
                          id="delivery_address2"
                          name="delivery_address2"
                          placeholder="Apt 4B"
                          value={formState.delivery_address2}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="delivery_city">City</Label>
                          <Input
                            id="delivery_city"
                            name="delivery_city"
                            placeholder="New York"
                            value={formState.delivery_city}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delivery_province">State/Province</Label>
                          <Input
                            id="delivery_province"
                            name="delivery_province"
                            placeholder="NY"
                            value={formState.delivery_province}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="delivery_zip">ZIP/Postal Code</Label>
                          <Input
                            id="delivery_zip"
                            name="delivery_zip"
                            placeholder="10001"
                            value={formState.delivery_zip}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delivery_country">Country</Label>
                          <Select 
                            value={formState.delivery_country} 
                            onValueChange={(value) => setFormState((prev) => ({ ...prev, delivery_country: value }))}
                          >
                            <SelectTrigger id="delivery_country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_phone">Phone Number</Label>
                        <Input
                          id="delivery_phone"
                          name="delivery_phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formState.delivery_phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 mt-4">
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Tell us how you'd like to receive your earnings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paypal_email" className={!formState.paypal_email ? "text-amber-600 dark:text-amber-400 font-bold" : ""}>
                        PayPal Email {!formState.paypal_email && "(Required for Payouts)"}
                      </Label>
                      <Input
                        id="paypal_email"
                        name="paypal_email"
                        type="email"
                        placeholder="paypal@example.com"
                        value={formState.paypal_email}
                        onChange={handleInputChange}
                        className={!formState.paypal_email ? "border-amber-500 ring-amber-500" : ""}
                      />
                      {!formState.paypal_email ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                          You must provide a PayPal email address to receive payouts.
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          We primarily use PayPal for vendor payments. Please ensure this is correct.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tax" className="space-y-4 mt-4">
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>Tax Information</CardTitle>
                    <CardDescription>Help us keep everything compliant by sharing your tax details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox id="is_company" checked={formState.is_company} onCheckedChange={handleCheckboxChange} />
                      <label
                        htmlFor="is_company"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I am registering as a business/company (not an individual)
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax_id">
                        {formState.is_company
                          ? "Business Tax ID / VAT Number"
                          : "Tax ID / SSN / National Insurance Number"}
                      </Label>
                      <Input
                        id="tax_id"
                        name="tax_id"
                        placeholder={formState.is_company ? "e.g. 123456789" : "e.g. XXX-XX-XXXX"}
                        value={formState.tax_id}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax_country">Tax Residence Country</Label>
                      <Select value={formState.tax_country} onValueChange={handleSelectChange}>
                        <SelectTrigger id="tax_country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important Tax Information</AlertTitle>
                      <AlertDescription>
                        <p className="text-sm mt-2">
                          We are required to collect tax information for all vendors. This information will be used for
                          tax reporting purposes and may be shared with tax authorities.
                        </p>
                        <p className="text-sm mt-2">
                          For US vendors: We will issue a 1099 form if your earnings exceed $600 in a calendar year.
                        </p>
                        <p className="text-sm mt-2">
                          For non-US vendors: We may be required to withhold taxes based on tax treaties between your
                          country and the United States.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payouts" className="space-y-4 mt-4">
                <PayoutSettings profile={profile} />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4 mt-4">
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose how you want to be notified about collector activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Notify me when collectors authenticate</Label>
                        <p className="text-sm text-muted-foreground">
                          Get real-time notifications when collectors authenticate your artworks
                        </p>
                      </div>
                      <Checkbox
                        checked={notificationPrefs.notify_on_collector_auth}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs((prev) => ({
                            ...prev,
                            notify_on_collector_auth: checked === true,
                          }))
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Weekly authentication digest</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive a weekly email summary of all collector authentications
                        </p>
                      </div>
                      <Checkbox
                        checked={notificationPrefs.weekly_auth_digest}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs((prev) => ({
                            ...prev,
                            weekly_auth_digest: checked === true,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/vendor/notification-preferences", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(notificationPrefs),
                          })
                          if (response.ok) {
                            toast({
                              title: "Preferences saved",
                              description: "Your notification preferences have been updated.",
                            })
                          }
                        } catch (err) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Failed to save notification preferences",
                          })
                        }
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <div className="mt-6 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSaving} 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
            </form>
          </Tabs>
        </div>

        <div className="md:col-span-2">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Complete your profile to get paid faster and unlock all features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Overall completion</span>
                    <span>{getCompletionPercentage()}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center">
                    {completionSteps.profile ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2"></div>
                    )}
                    <span className={completionSteps.profile ? "text-green-700" : "text-gray-600"}>
                      Profile Information
                    </span>
                  </div>

                  <div className="flex items-center">
                    {completionSteps.payment ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2"></div>
                    )}
                    <span className={completionSteps.payment ? "text-green-700" : "text-gray-600"}>
                      PayPal Email
                    </span>
                  </div>

                  <div className="flex items-center">
                    {completionSteps.tax ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2"></div>
                    )}
                    <span className={completionSteps.tax ? "text-green-700" : "text-gray-600"}>Tax Information</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <p className="text-sm text-muted-foreground mb-2">
                Complete all sections to ensure you receive your payments on time and comply with tax regulations.
              </p>
              {!completionSteps.profile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("profile")}
                  className="text-blue-600 p-0 hover:bg-transparent hover:underline"
                >
                  Complete profile information →
                </Button>
              )}
              {completionSteps.profile && !completionSteps.payment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("payment")}
                  className="text-blue-600 p-0 hover:bg-transparent hover:underline"
                >
                  Add payment details →
                </Button>
              )}
              {completionSteps.profile && completionSteps.payment && !completionSteps.tax && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("tax")}
                  className="text-blue-600 p-0 hover:bg-transparent hover:underline"
                >
                  Provide tax information →
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
