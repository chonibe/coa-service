"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Camera,
  Instagram,
  User,
  Edit2,
  X,
  DollarSign,
  FileText,
  CreditCard,
  Copy,
  ExternalLink,
  Upload,
  Eye,
  HelpCircle,
  Info,
  LogOut,
  PenTool,
  Image as ImageIcon,
} from "lucide-react"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useDirtyFormGuard, useRefreshRegistry } from "../../components/sidebar-layout"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"

interface VendorProfile {
  id: number | string
  vendor_name: string
  profile_image?: string | null
  bio?: string | null
  artist_history?: string | null
  instagram_url?: string | null
  signature_url?: string | null
  signature_uploaded_at?: string | null
  contact_name?: string | null
  contact_email?: string | null
  phone?: string | null
  address?: string | null
  paypal_email?: string | null
  tax_id?: string | null
  tax_country?: string | null
  is_company?: boolean
  created_at?: string
}

interface SettingsFormState {
  contact_name: string
  contact_email: string
  phone: string
  address: string
  paypal_email: string
  tax_id: string
  tax_country: string
  is_company: boolean
}

interface ProfileFormState {
  bio: string
  artist_history: string
  instagram_url: string
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

export default function VendorProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState("public-profile")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [validationState, setValidationState] = useState<Record<string, "valid" | "invalid" | "pending">>({})
  const [completionSteps, setCompletionSteps] = useState({
    profile: false,
    payment: false,
    tax: false,
  })
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [showSignatureLibrary, setShowSignatureLibrary] = useState(false)
  const { isDirty, setDirty } = useDirtyFormGuard()
  const { register } = useRefreshRegistry()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST", credentials: "include" })
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again.",
      })
    }
  }

  const [profileFormState, setProfileFormState] = useState<ProfileFormState>({
    bio: "",
    artist_history: "",
    instagram_url: "",
  })

  const [settingsFormState, setSettingsFormState] = useState<SettingsFormState>({
    contact_name: "",
    contact_email: "",
    phone: "",
    address: "",
    paypal_email: "",
    tax_id: "",
    tax_country: "",
    is_company: false,
  })

  // Update completion steps - must be defined first as it has no dependencies
  const updateCompletionSteps = useCallback((vendor: VendorProfile) => {
    setCompletionSteps({
      profile: !!(vendor.contact_name && vendor.contact_email && vendor.phone && vendor.address),
      payment: !!vendor.paypal_email,
      tax: !!(vendor.tax_id && vendor.tax_country),
    })
  }, [])

  // Fetch profile - depends on updateCompletionSteps
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/profile", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await response.json()
      const vendor = data.vendor
      setProfile(vendor)

      // Initialize profile form state
      setProfileFormState({
        bio: vendor.bio || "",
        artist_history: vendor.artist_history || "",
        instagram_url: vendor.instagram_url || "",
      })

      // Initialize settings form state
        setSettingsFormState({
          contact_name: vendor.contact_name || "",
          contact_email: vendor.contact_email || "",
          phone: vendor.phone || "",
          address: vendor.address || "",
          paypal_email: vendor.paypal_email || "",
          tax_id: vendor.tax_id || "",
          tax_country: vendor.tax_country || "",
          is_company: vendor.is_company || false,
        })

      // Check completion steps
      updateCompletionSteps(vendor)
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err.message || "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }, [updateCompletionSteps])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    return register(() => fetchProfile())
  }, [fetchProfile, register])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (isEditingProfile && !isSaving) {
          handleProfileSave()
        } else if (activeTab.startsWith("settings-") && !isSaving) {
          const form = document.querySelector("form")
          if (form) {
            form.requestSubmit()
          }
        }
      }
      // Escape to cancel
      if (e.key === "Escape" && isEditingProfile) {
        handleProfileCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isEditingProfile, activeTab, isSaving])

  // Auto-save for settings forms (debounced) - disabled for now, can be enabled later
  // useEffect(() => {
  //   if (!isEditingProfile && activeTab.startsWith("settings-") && hasUnsavedChanges && !isSaving) {
  //     // Clear existing timeout
  //     if (autoSaveTimeoutRef.current) {
  //       clearTimeout(autoSaveTimeoutRef.current)
  //     }

  //     // Set new timeout for auto-save (3 seconds after last change)
  //     autoSaveTimeoutRef.current = setTimeout(async () => {
  //       setIsSaving(true)
  //       setError(null)

  //       try {
  //         const response = await fetch("/api/vendor/update-profile", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           credentials: "include",
  //           body: JSON.stringify(settingsFormState),
  //         })

  //         if (response.ok) {
  //           const result = await response.json()
  //           if (result.vendor) {
  //             setProfile(result.vendor)
  //             updateCompletionSteps(result.vendor)
  //             setHasUnsavedChanges(false)
  //             setLastSaved(new Date())
  //           }
  //         }
  //       } catch (err) {
  //         console.error("Auto-save failed:", err)
  //       } finally {
  //         setIsSaving(false)
  //       }
  //     }, 3000)

  //     return () => {
  //       if (autoSaveTimeoutRef.current) {
  //         clearTimeout(autoSaveTimeoutRef.current)
  //       }
  //     }
  //   }
  // }, [settingsFormState, isEditingProfile, activeTab, hasUnsavedChanges, isSaving])

  // Real-time validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateInstagramUrl = (url: string): boolean => {
    if (!url) return true // Optional field
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/.+/
    return instagramRegex.test(url)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Optional field
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10
  }

  const validateField = (name: string, value: string) => {
    let isValid = true
    let error = ""

    switch (name) {
      case "contact_email":
        if (value && !validateEmail(value)) {
          isValid = false
          error = "Please enter a valid email address"
        }
        break
      case "paypal_email":
        if (value && !validateEmail(value)) {
          isValid = false
          error = "Please enter a valid PayPal email address"
        }
        break
      case "instagram_url":
        if (value && !validateInstagramUrl(value)) {
          isValid = false
          error = "Please enter a valid Instagram URL (e.g., https://instagram.com/username)"
        }
        break
      case "phone":
        if (value && !validatePhone(value)) {
          isValid = false
          error = "Please enter a valid phone number"
        }
        break
    }

    setValidationState((prev) => ({ ...prev, [name]: isValid ? "valid" : "invalid" }))
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [name]: error }))
    } else {
      setFieldErrors((prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      }))
    }
  }

  // Format Instagram URL helper
  const formatInstagramUrl = (url: string): string => {
    if (!url) return ""
    // If just username, add full URL
    if (!url.startsWith("http")) {
      if (url.startsWith("@")) {
        return `https://instagram.com/${url.substring(1)}`
      }
      return `https://instagram.com/${url}`
    }
    return url
  }

  // Handle image upload - depends on fetchProfile and toast
  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploadingImage(true)
    setError(null)

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file")
      }

      const MAX_SIZE = 5 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        throw new Error(`Image is too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`)
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "profile_image")

      const uploadResponse = await fetch("/api/vendor/profile/upload-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(errorData.error || "Failed to upload image")
      }

      const uploadData = await uploadResponse.json()

      const updateResponse = await fetch("/api/vendor/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          profile_image: uploadData.url,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: "Update failed" }))
        throw new Error(errorData.message || errorData.error || "Failed to update profile with image")
      }

      await fetchProfile()

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      })
    } catch (err: any) {
      console.error("Error uploading image:", err)
      setError(err.message || "Failed to upload image")
      toast({
        title: "Error",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }, [toast, fetchProfile])

  // Handle signature upload
  const handleSignatureUpload = useCallback(async (file: File) => {
    setIsUploadingSignature(true)
    setError(null)

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file")
      }

      const MAX_SIZE = 5 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        throw new Error(`Image is too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`)
      }

      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/vendor/profile/upload-signature", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(errorData.error || "Failed to upload signature")
      }

      await fetchProfile()

      toast({
        title: "Success",
        description: "Signature uploaded successfully",
      })
    } catch (err: any) {
      console.error("Error uploading signature:", err)
      setError(err.message || "Failed to upload signature")
      toast({
        title: "Error",
        description: err.message || "Failed to upload signature",
        variant: "destructive",
      })
    } finally {
      setIsUploadingSignature(false)
    }
  }, [toast, fetchProfile])

  // Handle signature deletion
  const handleSignatureDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to remove your signature? This will remove it from all artwork pages.")) {
      return
    }

    setIsUploadingSignature(true)
    setError(null)

    try {
      const deleteResponse = await fetch("/api/vendor/profile/upload-signature", {
        method: "DELETE",
        credentials: "include",
      })

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => ({ error: "Delete failed" }))
        throw new Error(errorData.error || "Failed to delete signature")
      }

      await fetchProfile()

      toast({
        title: "Success",
        description: "Signature removed successfully",
      })
    } catch (err: any) {
      console.error("Error deleting signature:", err)
      setError(err.message || "Failed to delete signature")
      toast({
        title: "Error",
        description: err.message || "Failed to delete signature",
        variant: "destructive",
      })
    } finally {
      setIsUploadingSignature(false)
    }
  }, [toast, fetchProfile])

  const handleImageLibrarySelect = async (media: MediaItem | MediaItem[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media
    
    try {
      const updateResponse = await fetch("/api/vendor/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          profile_image: selectedMedia.url,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: "Update failed" }))
        throw new Error(errorData.message || errorData.error || "Failed to update profile with image")
      }

      await fetchProfile()
      setShowImageLibrary(false)

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating profile image:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update profile image",
        variant: "destructive",
      })
    }
  }

  const handleSignatureLibrarySelect = async (media: MediaItem | MediaItem[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media
    
    try {
      // We'll use the signature URL directly from library
      const updateResponse = await fetch("/api/vendor/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          signature_url: selectedMedia.url,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: "Update failed" }))
        throw new Error(errorData.message || errorData.error || "Failed to update signature")
      }

      await fetchProfile()
      setShowSignatureLibrary(false)

      toast({
        title: "Success",
        description: "Signature updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating signature:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update signature",
        variant: "destructive",
      })
    }
  }

  // Drag & Drop handlers - must be defined after handleImageUpload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file)
      } else {
        toast({
          title: "Invalid file",
          description: "Please drop an image file",
          variant: "destructive",
        })
      }
    },
    [toast, handleImageUpload],
  )

  const handleProfileSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/vendor/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          bio: profileFormState.bio,
          artist_history: profileFormState.artist_history,
          instagram_url: profileFormState.instagram_url,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Update failed" }))
        throw new Error(errorData.error || "Failed to update profile")
      }

      await fetchProfile()
      setIsEditingProfile(false)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      setDirty(false)

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "Failed to update profile")
      toast({
        title: "Error",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check for validation errors
    const hasErrors = Object.keys(fieldErrors).length > 0
    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors before saving",
      })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/vendor/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(settingsFormState),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }

      const result = await response.json()

      if (result.vendor) {
        setProfile(result.vendor)
        updateCompletionSteps(result.vendor)
        setSettingsFormState({
          contact_name: result.vendor.contact_name || "",
          contact_email: result.vendor.contact_email || "",
          phone: result.vendor.phone || "",
          address: result.vendor.address || "",
          paypal_email: result.vendor.paypal_email || "",
          tax_id: result.vendor.tax_id || "",
          tax_country: result.vendor.tax_country || "",
          is_company: result.vendor.is_company || false,
        })
        setHasUnsavedChanges(false)
        setLastSaved(new Date())
        setDirty(false)
      }

      toast({
        title: "Settings updated",
        description: "Your vendor profile has been successfully updated.",
      })
    } catch (err: any) {
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

  const handleProfileCancel = () => {
    if (profile) {
      setProfileFormState({
        bio: profile.bio || "",
        artist_history: profile.artist_history || "",
        instagram_url: profile.instagram_url || "",
      })
    }
    setIsEditingProfile(false)
    setError(null)
    setHasUnsavedChanges(false)
    setDirty(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettingsFormState((prev) => ({ ...prev, [name]: value }))
    setHasUnsavedChanges(true)
    setDirty(true)
    // Real-time validation
    validateField(name, value)
  }

  const handleProfileInputChange = (field: keyof ProfileFormState, value: string) => {
    setProfileFormState((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    setDirty(true)
    if (field === "instagram_url") {
      validateField("instagram_url", value)
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setSettingsFormState((prev) => ({ ...prev, is_company: checked }))
    setHasUnsavedChanges(true)
    setDirty(true)
  }

  const handleSelectChange = (value: string) => {
    setSettingsFormState((prev) => ({ ...prev, tax_country: value }))
    setHasUnsavedChanges(true)
    setDirty(true)
  }

  const extractInstagramHandle = (url: string): string => {
    if (!url) return ""
    const match = url.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._]+)/)
    return match && match[1] ? `@${match[1]}` : url
  }

  const getCompletionPercentage = () => {
    const steps = Object.values(completionSteps)
    const completed = steps.filter(Boolean).length
    return Math.round((completed / steps.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load profile. Please try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Quick actions
  const buildProfileUrl = () => {
    if (typeof window === "undefined") return ""
    const slug = profile?.vendor_name ? encodeURIComponent(profile.vendor_name) : profile?.id
    return `${window.location.origin}/artist/${slug}`
  }

  const handleCopyProfileLink = async () => {
    const link = buildProfileUrl()
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Profile link copied",
        description: link,
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePreviewProfile = () => {
    const link = buildProfileUrl()
    if (!link) return
    window.open(link, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Manage your public profile and account settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && !isSaving && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Unsaved changes
            </Badge>
          )}
          {lastSaved && !hasUnsavedChanges && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewProfile}
                  className="hidden sm:flex"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview your public profile</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="public-profile">Public Profile</TabsTrigger>
          <TabsTrigger value="settings-profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Contact</span>
            {completionSteps.profile && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="settings-payment" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Payment</span>
            {completionSteps.payment && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="settings-tax" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Tax</span>
            {completionSteps.tax && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
        </TabsList>

        {/* Public Profile Tab */}
        <TabsContent value="public-profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Artist Profile</CardTitle>
              <CardDescription>
                This is how collectors will see you - make it shine! Your profile appears on all your product pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instagram-style Profile Header */}
              <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-start pb-6 border-b">
                <div
                  ref={dropZoneRef}
                  className="relative group mx-auto sm:mx-0"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div
                    className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 transition-all ${
                      isDragOver
                        ? "border-primary ring-4 ring-primary/20 scale-105"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {profile.profile_image ? (
                      <Image
                        src={profile.profile_image}
                        alt={profile.vendor_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <User className="h-16 w-16 text-white" />
                      </div>
                    )}
                    {isDragOver && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10 rounded-full">
                        <div className="text-center text-white">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs font-medium">Drop image here</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isEditingProfile && !isDragOver && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Upload profile image"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <Camera className="h-8 w-8 text-white" />
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file)
                      }
                      // Reset input to allow selecting the same file again
                      e.target.value = ""
                    }}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 shadow-lg border">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click or drag & drop an image to upload</p>
                        <p className="text-xs mt-1">Max 5MB, recommended: square image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImageLibrary(true)}
                      disabled={isUploadingImage}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Select from Library
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-light">{profile.vendor_name}</h2>
                      {!isEditingProfile && (
                        <Button
                          onClick={() => setIsEditingProfile(true)}
                          variant="outline"
                          size="sm"
                          className="text-sm"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>

                    {!isEditingProfile && (
                      <div className="space-y-3">
                        {profile.bio && (
                          <p className="text-sm leading-relaxed whitespace-pre-line">
                            {profile.bio}
                          </p>
                        )}
                        {profile.instagram_url && (
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            <a
                              href={profile.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-primary hover:underline"
                            >
                              {extractInstagramHandle(profile.instagram_url)}
                            </a>
                          </div>
                        )}
                        {profile.artist_history && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                              Artist History
                            </h3>
                            <p className="text-sm leading-relaxed whitespace-pre-line">
                              {profile.artist_history}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Signature Upload Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Artist Signature</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your signature will appear on all artwork pages after collectors authenticate with NFC.
                        PNG with transparency is recommended.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    {profile.signature_url ? (
                      <div className="relative group">
                        <div className="relative w-48 h-24 border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center">
                          <Image
                            src={profile.signature_url}
                            alt="Artist signature"
                            width={192}
                            height={96}
                            className="object-contain max-w-full max-h-full"
                          />
                        </div>
                        {profile.signature_uploaded_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Uploaded {new Date(profile.signature_uploaded_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="w-48 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <div className="text-center">
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">No signature</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => signatureInputRef.current?.click()}
                        disabled={isUploadingSignature}
                      >
                        {isUploadingSignature ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {profile.signature_url ? "Replace" : "Upload"} Signature
                          </>
                        )}
                      </Button>
                      {profile.signature_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSignatureDelete}
                          disabled={isUploadingSignature}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSignatureLibrary(true)}
                        disabled={isUploadingSignature}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Select from Library
                      </Button>
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleSignatureUpload(file)
                          }
                          e.target.value = ""
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              {isEditingProfile && (
                <div className="space-y-4 pt-6 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram URL
                    </Label>
                    <div className="relative">
                      <Input
                        id="instagram_url"
                        placeholder="https://instagram.com/yourusername or @username"
                        value={profileFormState.instagram_url}
                        onChange={(e) => {
                          const value = e.target.value
                          handleProfileInputChange("instagram_url", value)
                        }}
                        onBlur={(e) => {
                          // Auto-format on blur
                          const formatted = formatInstagramUrl(e.target.value)
                          if (formatted !== e.target.value) {
                            handleProfileInputChange("instagram_url", formatted)
                          }
                          validateField("instagram_url", formatted)
                        }}
                        className={
                          validationState.instagram_url === "invalid"
                            ? "border-red-500 focus:border-red-500"
                            : validationState.instagram_url === "valid"
                            ? "border-green-500 focus:border-green-500"
                            : ""
                        }
                      />
                      {validationState.instagram_url === "valid" && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {validationState.instagram_url === "invalid" && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {fieldErrors.instagram_url && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.instagram_url}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You can enter the full URL or just your username (e.g., @username)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio / Description</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell people about yourself and your work..."
                      value={profileFormState.bio}
                      onChange={(e) => setProfileFormState({ ...profileFormState, bio: e.target.value })}
                      rows={6}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profileFormState.bio.length}/500 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artist_history">Artist History</Label>
                    <Textarea
                      id="artist_history"
                      placeholder="Share your artistic journey, background, achievements..."
                      value={profileFormState.artist_history}
                      onChange={(e) =>
                        setProfileFormState({ ...profileFormState, artist_history: e.target.value })
                      }
                      rows={8}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profileFormState.artist_history.length}/2000 characters
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleProfileSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleProfileCancel} disabled={isSaving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings - Profile Information Tab */}
        <TabsContent value="settings-profile" className="space-y-4">
          <form onSubmit={handleSettingsSave}>
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Keep your contact details up to date so we can reach you when needed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      name="contact_name"
                      placeholder="Full Name"
                      value={settingsFormState.contact_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <div className="relative">
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        placeholder="email@example.com"
                        value={settingsFormState.contact_email}
                        onChange={handleInputChange}
                        onBlur={(e) => validateField("contact_email", e.target.value)}
                        className={
                          validationState.contact_email === "invalid"
                            ? "border-red-500 focus:border-red-500 pr-10"
                            : validationState.contact_email === "valid"
                            ? "border-green-500 focus:border-green-500 pr-10"
                            : ""
                        }
                        required
                      />
                      {validationState.contact_email === "valid" && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {validationState.contact_email === "invalid" && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {fieldErrors.contact_email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.contact_email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+1 (555) 123-4567"
                      value={settingsFormState.phone}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField("phone", e.target.value)}
                      className={
                        validationState.phone === "invalid"
                          ? "border-red-500 focus:border-red-500 pr-10"
                          : validationState.phone === "valid"
                          ? "border-green-500 focus:border-green-500 pr-10"
                          : ""
                      }
                    />
                    {validationState.phone === "valid" && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {validationState.phone === "invalid" && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter your full business address"
                    value={settingsFormState.address}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving} className="ml-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* Settings - Payment Tab */}
        <TabsContent value="settings-payment" className="space-y-4">
          <form onSubmit={handleSettingsSave}>
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Tell us how you'd like to get paid - we'll make sure your earnings reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paypal_email" className="flex items-center gap-2">
                    PayPal Email *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your PayPal email address for receiving payments. This is required for all payouts.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="relative">
                    <Input
                      id="paypal_email"
                      name="paypal_email"
                      type="email"
                      placeholder="paypal@example.com"
                      value={settingsFormState.paypal_email}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField("paypal_email", e.target.value)}
                      className={
                        validationState.paypal_email === "invalid"
                          ? "border-red-500 focus:border-red-500 pr-10"
                          : validationState.paypal_email === "valid"
                          ? "border-green-500 focus:border-green-500 pr-10"
                          : ""
                      }
                      required
                    />
                    {validationState.paypal_email === "valid" && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {validationState.paypal_email === "invalid" && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {fieldErrors.paypal_email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.paypal_email}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    All vendor payouts are processed via PayPal. Please ensure this is the correct email address for your PayPal account.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving} className="ml-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* Settings - Tax Tab */}
        <TabsContent value="settings-tax" className="space-y-4">
          <form onSubmit={handleSettingsSave}>
            <Card>
              <CardHeader>
                <CardTitle>Tax Information</CardTitle>
                <CardDescription>Help us keep everything compliant by sharing your tax details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="is_company"
                    checked={settingsFormState.is_company}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label
                    htmlFor="is_company"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I am registering as a business/company (not an individual)
                  </label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id">
                    {settingsFormState.is_company
                      ? "Business Tax ID / VAT Number"
                      : "Tax ID / SSN / National Insurance Number"}
                  </Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    placeholder={settingsFormState.is_company ? "e.g. 123456789" : "e.g. XXX-XX-XXXX"}
                    value={settingsFormState.tax_id}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_country">Tax Residence Country</Label>
                  <Select value={settingsFormState.tax_country} onValueChange={handleSelectChange}>
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
              <CardFooter>
                <Button type="submit" disabled={isSaving} className="ml-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>

      {/* Profile Completion Card - Only show if not 100% complete */}
      {getCompletionPercentage() < 100 && (
        <Card className="max-w-2xl">
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
              <button
                onClick={() => {
                  setActiveTab("settings-profile")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center w-full text-left transition-colors hover:bg-muted/50 p-2 rounded-md -ml-2 ${
                  completionSteps.profile ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {completionSteps.profile ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2 flex-shrink-0"></div>
                )}
                <span className="font-medium">Contact Information</span>
                {!completionSteps.profile && (
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings-payment")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center w-full text-left transition-colors hover:bg-muted/50 p-2 rounded-md -ml-2 ${
                  completionSteps.payment ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {completionSteps.payment ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2 flex-shrink-0"></div>
                )}
                <span className="font-medium">Payment Details</span>
                {!completionSteps.payment && (
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings-tax")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center w-full text-left transition-colors hover:bg-muted/50 p-2 rounded-md -ml-2 ${
                  completionSteps.tax ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {completionSteps.tax ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2 flex-shrink-0"></div>
                )}
                <span className="font-medium">Tax Information</span>
                {!completionSteps.tax && (
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Settings Section - Theme & Logout */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your account preferences and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sign Out</Label>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Library Modals */}
      <MediaLibraryModal
        open={showImageLibrary}
        onOpenChange={setShowImageLibrary}
        onSelect={handleImageLibrarySelect}
        mode="single"
        allowedTypes={["image"]}
        title="Select Profile Image"
      />
      <MediaLibraryModal
        open={showSignatureLibrary}
        onOpenChange={setShowSignatureLibrary}
        onSelect={handleSignatureLibrarySelect}
        mode="single"
        allowedTypes={["image"]}
        title="Select Signature"
      />
    </div>
  )
}
