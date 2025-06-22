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
import { ProfileEdit } from '@/components/vendor/ProfileEdit';
import { Toaster } from '@/components/ui/toaster';

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
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Profile</h2>
          <ProfileEdit />
        </div>

        {/* Additional Settings Placeholder */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
          {/* Future: Add account-related settings */}
          <p className="text-muted-foreground">More settings coming soon</p>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
