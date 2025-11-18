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
import { Loader2, AlertCircle, CheckCircle, Save, DollarSign, FileText, User, CreditCard } from "lucide-react"
import { StripeConnect } from "../components/stripe-connect"

interface VendorProfile {
  id: string
  vendor_name: string
  paypal_email: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
  bank_account: string | null
  address: string | null
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
  bank_account: string
  address: string
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
    bank_account: "",
    address: "",
    phone: "",
    contact_name: "",
    contact_email: "",
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
            bank_account: data.vendor.bank_account || "",
            address: data.vendor.address || "",
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
      payment: !!(vendor.paypal_email || vendor.bank_account),
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
      const response = await fetch("/api/vendor/update-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        },
        body: JSON.stringify(formState),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile.vendor)
      updateCompletionSteps(updatedProfile.vendor)

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Settings</h1>
        <p className="text-muted-foreground">Manage your vendor profile and payment information</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
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
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Stripe</span>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="profile" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your contact information and business details</CardDescription>
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Set up how you would like to receive payments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paypal_email">PayPal Email</Label>
                      <Input
                        id="paypal_email"
                        name="paypal_email"
                        type="email"
                        placeholder="paypal@example.com"
                        value={formState.paypal_email}
                        onChange={handleInputChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        We primarily use PayPal for vendor payments. Please ensure this is correct.
                      </p>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <Label htmlFor="bank_account">Bank Account Details (Alternative)</Label>
                      <Textarea
                        id="bank_account"
                        name="bank_account"
                        placeholder="Bank name, Account number, Sort code/Routing number, etc."
                        value={formState.bank_account}
                        onChange={handleInputChange}
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground">
                        Only provide bank details if you cannot use PayPal. Additional verification may be required.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tax" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Information</CardTitle>
                    <CardDescription>Provide your tax details for compliance and reporting</CardDescription>
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

              <TabsContent value="stripe" className="space-y-4 mt-4">
                {profile && <StripeConnect vendorName={profile.vendor_name} />}
              </TabsContent>

              {activeTab !== "stripe" && (
                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
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
              )}
            </form>
          </Tabs>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Complete your profile to ensure timely payouts</CardDescription>
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
                      Payment Details
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
