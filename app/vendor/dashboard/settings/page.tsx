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
import { ProfileEdit } from '@/components/vendor/ProfileEdit'

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

const getVendorName = (profile: VendorProfile | null) => {
  return profile?.vendor_name || profile?.contact_name || 'Vendor'
}

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
        const response = await fetch("/api/vendor/profile")
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Vendor Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="payment">
            <DollarSign className="mr-2 h-4 w-4" /> Payment
          </TabsTrigger>
          <TabsTrigger value="tax">
            <FileText className="mr-2 h-4 w-4" /> Tax & Legal
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Manage your vendor profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileEdit />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Set up your payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StripeConnect vendorName={getVendorName(profile)} />
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paypal_email">PayPal Email</Label>
                      <Input 
                        id="paypal_email"
                        name="paypal_email"
                        type="email"
                        value={formState.paypal_email}
                        onChange={handleInputChange}
                        placeholder="Enter PayPal email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_account">Bank Account</Label>
                      <Input 
                        id="bank_account"
                        name="bank_account"
                        type="text"
                        value={formState.bank_account}
                        onChange={handleInputChange}
                        placeholder="Enter bank account details"
                      />
                    </div>
                  </div>
                </div>
                <CardFooter className="justify-between border-t pt-6 mt-6">
                  <div className="flex items-center space-x-2">
                    {completionSteps.payment ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span>
                      {completionSteps.payment 
                        ? "Payment methods configured" 
                        : "Complete payment setup"}
                    </span>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax & Legal Tab */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax & Legal Information</CardTitle>
              <CardDescription>Provide your tax and legal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Business Type</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id="is_company"
                          checked={formState.is_company}
                          onCheckedChange={handleCheckboxChange}
                        />
                        <Label htmlFor="is_company">Registered Company</Label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tax_country">Country</Label>
                      <Select 
                        value={formState.tax_country} 
                        onValueChange={handleSelectChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                      <Input 
                        id="tax_id"
                        name="tax_id"
                        type="text"
                        value={formState.tax_id}
                        onChange={handleInputChange}
                        placeholder="Enter tax ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input 
                        id="contact_name"
                        name="contact_name"
                        type="text"
                        value={formState.contact_name}
                        onChange={handleInputChange}
                        placeholder="Enter contact name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input 
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={formState.contact_email}
                        onChange={handleInputChange}
                        placeholder="Enter contact email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formState.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea 
                      id="address"
                      name="address"
                      value={formState.address}
                      onChange={handleInputChange}
                      placeholder="Enter full business address"
                      rows={3}
                    />
                  </div>
                </div>
                
                <CardFooter className="justify-between border-t pt-6 mt-6">
                  <div className="flex items-center space-x-2">
                    {completionSteps.tax ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span>
                      {completionSteps.tax 
                        ? "Tax information complete" 
                        : "Complete tax setup"}
                    </span>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
