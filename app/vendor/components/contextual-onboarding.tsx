"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Info, CheckCircle, Wallet, AlertCircle, Loader2, Minimize2, Maximize2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContextualOnboardingProps {
  context: "payouts" | "settings" | "products"
  onComplete?: () => void
}

interface MissingFields {
  paypal_email?: boolean
  tax_id?: boolean
  tax_country?: boolean
  address?: boolean
  phone?: boolean
  contact_name?: boolean
  contact_email?: boolean
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

export function ContextualOnboarding({ context, onComplete }: ContextualOnboardingProps) {
  const router = useRouter()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [missingFields, setMissingFields] = useState<MissingFields>({})
  const [formData, setFormData] = useState<any>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
    
    // Check if dismissed in localStorage
    const dismissedKey = `onboarding_dismissed_${context}`
    const wasDismissed = localStorage.getItem(dismissedKey)
    if (wasDismissed === "true") {
      setIsDismissed(true)
    }
  }, [context])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/profile", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data.vendor)
        
        // Initialize form data
        setFormData({
          paypal_email: data.vendor?.paypal_email || "",
          bank_account: data.vendor?.bank_account || "",
          tax_id: data.vendor?.tax_id || "",
          tax_country: data.vendor?.tax_country || "",
          is_company: data.vendor?.is_company || false,
          address: data.vendor?.address || "",
          phone: data.vendor?.phone || "",
          contact_name: data.vendor?.contact_name || "",
          contact_email: data.vendor?.contact_email || "",
        })

        // Determine missing fields based on context
        const missing: MissingFields = {}
        
        if (context === "payouts") {
          if (!data.vendor?.paypal_email) {
            missing.paypal_email = true
          }
          if (!data.vendor?.tax_id) missing.tax_id = true
          if (!data.vendor?.tax_country) missing.tax_country = true
        } else if (context === "settings") {
          if (!data.vendor?.paypal_email) {
            missing.paypal_email = true
          }
          if (!data.vendor?.tax_id) missing.tax_id = true
          if (!data.vendor?.tax_country) missing.tax_country = true
          if (!data.vendor?.contact_name) missing.contact_name = true
          if (!data.vendor?.contact_email) missing.contact_email = true
          if (!data.vendor?.phone) missing.phone = true
          if (!data.vendor?.address) missing.address = true
        }
        
        setMissingFields(missing)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, [name]: checked }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (context === "payouts" || context === "settings") {
      if (missingFields.paypal_email) {
        if (!formData.paypal_email?.trim()) {
          errors.paypal_email = "PayPal email is required for payouts"
        }
        if (formData.paypal_email?.trim() && !/\S+@\S+\.\S+/.test(formData.paypal_email)) {
          errors.paypal_email = "Please enter a valid email address"
        }
      }
      
      if (missingFields.tax_id && !formData.tax_id?.trim()) {
        errors.tax_id = "Tax ID is required"
      }
      if (missingFields.tax_country && !formData.tax_country) {
        errors.tax_country = "Tax country is required"
      }
      
      if (context === "settings") {
        if (missingFields.contact_name && !formData.contact_name?.trim()) {
          errors.contact_name = "Contact name is required"
        }
        if (missingFields.contact_email && !formData.contact_email?.trim()) {
          errors.contact_email = "Contact email is required"
        } else if (formData.contact_email?.trim() && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
          errors.contact_email = "Please enter a valid email address"
        }
        if (missingFields.phone && !formData.phone?.trim()) {
          errors.phone = "Phone number is required"
        }
        if (missingFields.address && !formData.address?.trim()) {
          errors.address = "Business address is required"
        }
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors before saving.",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your information has been saved successfully.",
        })
        await fetchProfile() // Refresh to check if fields are still missing
        if (onComplete) onComplete()
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your information. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    const dismissedKey = `onboarding_dismissed_${context}`
    localStorage.setItem(dismissedKey, "true")
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  // Don't render if dismissed or loading
  if (isDismissed || isLoading) {
    return null
  }

  // Show if onboarding is not completed OR if there are missing fields
  const shouldShow = !profile?.onboarding_completed || Object.keys(missingFields).length > 0
  if (!shouldShow) {
    return null
  }

  const missingCount = Object.keys(missingFields).length
  const isOnboardingIncomplete = !profile?.onboarding_completed
  const contextTitle = isOnboardingIncomplete 
    ? "Complete Your Profile" 
    : context === "payouts" 
    ? "Payment Setup" 
    : context === "settings" 
    ? "Profile Setup" 
    : "Setup Required"
  
  // If onboarding is incomplete but no specific missing fields, show a link to the full wizard
  const showWizardLink = isOnboardingIncomplete && missingCount === 0

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative overflow-hidden">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
        
        {/* Glow effect */}
        <div className="absolute -top-1 -right-1 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
        
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur-md opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {contextTitle}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {isOnboardingIncomplete 
                    ? "Complete your profile to get started" 
                    : `${missingCount} ${missingCount === 1 ? "field" : "fields"} required`}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMinimize}
                className="h-8 w-8"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="relative z-10 space-y-4 max-h-[60vh] overflow-y-auto">
            {showWizardLink ? (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Complete your vendor profile to get started with payouts and product management.
                </p>
                <Button
                  onClick={() => router.push("/vendor/onboarding")}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Onboarding Wizard
                </Button>
              </div>
            ) : (context === "payouts" || context === "settings") && (
              <>
                {/* Payment Information */}
                {missingFields.paypal_email && (
                  <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-medium text-sm">Payment Information</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="paypal_email" className="text-sm">
                          PayPal Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="paypal_email"
                          name="paypal_email"
                          type="email"
                          placeholder="your@paypal.com"
                          value={formData.paypal_email || ""}
                          onChange={handleInputChange}
                          className={cn(
                            "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                            validationErrors.paypal_email && "border-red-500"
                          )}
                        />
                        {validationErrors.paypal_email && (
                          <p className="text-xs text-red-500">{validationErrors.paypal_email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tax Information */}
                {(missingFields.tax_id || missingFields.tax_country) && (
                  <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-medium text-sm">Tax Information</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <Checkbox
                          id="is_company"
                          checked={formData.is_company || false}
                          onCheckedChange={(checked) => handleCheckboxChange("is_company", checked === true)}
                        />
                        <label htmlFor="is_company" className="text-xs font-medium cursor-pointer">
                          Registering as a business/company
                        </label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_id" className="text-sm">
                          {formData.is_company ? "Business Tax ID / VAT Number" : "Tax ID / SSN / National Insurance Number"}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tax_id"
                          name="tax_id"
                          placeholder={formData.is_company ? "e.g. 123456789" : "e.g. XXX-XX-XXXX"}
                          value={formData.tax_id || ""}
                          onChange={handleInputChange}
                          className={cn(
                            "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                            validationErrors.tax_id && "border-red-500"
                          )}
                        />
                        {validationErrors.tax_id && (
                          <p className="text-xs text-red-500">{validationErrors.tax_id}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_country" className="text-sm">
                          Tax Residence Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.tax_country || ""}
                          onValueChange={(value) => handleSelectChange("tax_country", value)}
                        >
                          <SelectTrigger
                            id="tax_country"
                            className={cn(
                              "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                              validationErrors.tax_country && "border-red-500"
                            )}
                          >
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
                        {validationErrors.tax_country && (
                          <p className="text-xs text-red-500">{validationErrors.tax_country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information (for settings context) */}
                {context === "settings" && (missingFields.contact_name || missingFields.contact_email || missingFields.phone || missingFields.address) && (
                  <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-medium text-sm">Contact Information</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {missingFields.contact_name && (
                        <div className="space-y-2">
                          <Label htmlFor="contact_name" className="text-sm">
                            Contact Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="contact_name"
                            name="contact_name"
                            placeholder="John Doe"
                            value={formData.contact_name || ""}
                            onChange={handleInputChange}
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                          />
                        </div>
                      )}

                      {missingFields.contact_email && (
                        <div className="space-y-2">
                          <Label htmlFor="contact_email" className="text-sm">
                            Contact Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="contact_email"
                            name="contact_email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.contact_email || ""}
                            onChange={handleInputChange}
                            className={cn(
                              "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                              validationErrors.contact_email && "border-red-500"
                            )}
                          />
                          {validationErrors.contact_email && (
                            <p className="text-xs text-red-500">{validationErrors.contact_email}</p>
                          )}
                        </div>
                      )}

                      {missingFields.phone && (
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">
                            Phone Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone || ""}
                            onChange={handleInputChange}
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                          />
                        </div>
                      )}

                      {missingFields.address && (
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm">
                            Business Address <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="address"
                            name="address"
                            placeholder="123 Main Street, City, State, ZIP Code"
                            value={formData.address || ""}
                            onChange={handleInputChange}
                            rows={3}
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save & Continue
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
