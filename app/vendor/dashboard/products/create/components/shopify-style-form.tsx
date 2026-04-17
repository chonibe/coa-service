"use client"

import { useState, useEffect, useRef } from "react"

// Local-storage autosave for the artwork creation form. We keep this scoped
// per submission (`new` for unsaved drafts, `<id>` for in-flight edits) so
// concurrent tabs don't trample each other. Hydration restores the snapshot
// on next mount and we offer a one-click discard to start fresh.
const AUTOSAVE_PREFIX = "vendor_artwork_draft_v1:"
const AUTOSAVE_DEBOUNCE_MS = 800
const AUTOSAVE_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14 days

interface AutosaveSnapshot {
  savedAt: number
  formData: Record<string, unknown>
}






import { Separator } from "@/components/ui"


import { Loader2, Save, X, Plus, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"
import { BasicInfoStep } from "./basic-info-step"
import { ImagesStep } from "./images-step"
import { VariantsStep } from "./variants-step"
import { PrintFilesStep } from "./print-files-step"
import { SeriesStep } from "./series-step"

import { Card, CardContent, CardHeader, CardTitle, Button, Label, Input, Textarea, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription, AlertTitle } from "@/components/ui"
interface ShopifyStyleFormProps {
  initialData?: ProductSubmissionData
  submissionId?: string
  onComplete: (result?: { submissionId: string; status: string; isDraft: boolean }) => void
  onCancel: () => void
}

export function ShopifyStyleArtworkForm({
  initialData,
  submissionId,
  onComplete,
  onCancel,
}: ShopifyStyleFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [fieldsConfig, setFieldsConfig] = useState<ProductCreationFields | null>(null)
  const [loadingFields, setLoadingFields] = useState(true)
  const [maskSaved, setMaskSaved] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const autosaveKey = `${AUTOSAVE_PREFIX}${submissionId || "new"}`
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hydratedFromAutosaveRef = useRef(false)
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [autosaveAt, setAutosaveAt] = useState<number | null>(null)
  const [autosaveRestoredAt, setAutosaveRestoredAt] = useState<number | null>(null)

  const [formData, setFormData] = useState<ProductSubmissionData>(() => {
    const base: ProductSubmissionData = {
      title: initialData?.title || "",
      description: initialData?.description || "",
      product_type: initialData?.product_type || "Art Prints",
      vendor: "",
      handle: initialData?.handle || "",
      tags: initialData?.tags || [],
      variants: initialData?.variants || [
        {
          price: "",
          sku: "",
          requires_shipping: true,
        },
      ],
      images: initialData?.images || [],
      metafields: initialData?.metafields || [],
    }

    if (typeof window === "undefined") return base
    try {
      const raw = window.localStorage.getItem(`${AUTOSAVE_PREFIX}${submissionId || "new"}`)
      if (!raw) return base
      const snap = JSON.parse(raw) as AutosaveSnapshot
      if (!snap?.formData || typeof snap.savedAt !== "number") return base
      if (Date.now() - snap.savedAt > AUTOSAVE_TTL_MS) {
        window.localStorage.removeItem(`${AUTOSAVE_PREFIX}${submissionId || "new"}`)
        return base
      }
      // Only restore for the new-artwork flow. Edits should always trust the
      // server-authoritative initialData; otherwise an old autosave could
      // silently revert recent server-side admin moderation changes.
      if (submissionId) return base
      hydratedFromAutosaveRef.current = true
      return { ...base, ...(snap.formData as ProductSubmissionData) }
    } catch {
      return base
    }
  })

  useEffect(() => {
    if (hydratedFromAutosaveRef.current) {
      try {
        const raw = window.localStorage.getItem(autosaveKey)
        if (raw) {
          const snap = JSON.parse(raw) as AutosaveSnapshot
          setAutosaveRestoredAt(snap.savedAt)
        }
      } catch {
        // ignore
      }
    }
  }, [autosaveKey])

  // Debounced autosave. We snapshot only the user-controlled form payload —
  // not transient UI state — so restoring is deterministic.
  useEffect(() => {
    if (typeof window === "undefined") return
    // Skip the very first paint to avoid persisting the empty initial state.
    if (autosaveStatus === "idle" && !formData.title && (formData.variants[0]?.price || "") === "") {
      return
    }
    setAutosaveStatus("saving")
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      try {
        const snap: AutosaveSnapshot = { savedAt: Date.now(), formData: formData as unknown as Record<string, unknown> }
        window.localStorage.setItem(autosaveKey, JSON.stringify(snap))
        setAutosaveAt(snap.savedAt)
        setAutosaveStatus("saved")
      } catch {
        setAutosaveStatus("idle")
      }
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [formData, autosaveKey])

  const clearAutosave = () => {
    try {
      window.localStorage.removeItem(autosaveKey)
    } catch {
      // ignore
    }
    setAutosaveAt(null)
    setAutosaveStatus("idle")
    setAutosaveRestoredAt(null)
  }

  const discardRestoredDraft = () => {
    clearAutosave()
    setFormData({
      title: initialData?.title || "",
      description: initialData?.description || "",
      product_type: initialData?.product_type || "Art Prints",
      vendor: formData.vendor,
      handle: initialData?.handle || "",
      tags: initialData?.tags || [],
      variants: initialData?.variants || [
        {
          price: "",
          sku: "",
          requires_shipping: true,
        },
      ],
      images: initialData?.images || [],
      metafields: initialData?.metafields || [],
    })
  }

  // Fetch field configuration
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/vendor/products/create/fields", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setFieldsConfig(data)
          if (!formData.vendor && data.vendor_collections?.[0]) {
            setFormData((prev) => ({ ...prev, vendor: data.vendor_collections[0].vendor_name }))
          }
        }
      } catch (err) {
        console.error("Error fetching fields:", err)
      } finally {
        setLoadingFields(false)
      }
    }

    fetchFields()
  }, [])

  // Initialize tags from formData
  useEffect(() => {
    if (formData.tags) {
      setTags(formData.tags)
    }
  }, [formData.tags])

  const canSubmit = () => {
    return (
      !!formData.title &&
      formData.title.trim().length > 0 &&
      formData.variants.length > 0 &&
      formData.variants.every((v) => v.price && parseFloat(v.price) > 0) &&
      (!formData.images || formData.images.length === 0 || maskSaved)
    )
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag]
      setTags(newTags)
      setFormData((prev) => ({ ...prev, tags: newTags }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove)
    setTags(newTags)
    setFormData((prev) => ({ ...prev, tags: newTags }))
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !canSubmit()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields",
        variant: "destructive",
      })
      return
    }

    const setLoading = isDraft ? setIsSavingDraft : setIsSubmitting
    setLoading(true)

    try {
      const url = submissionId
        ? `/api/vendor/products/submissions/${submissionId}`
        : "/api/vendor/products/submit"
      const method = submissionId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_data: formData,
          status: isDraft ? "draft" : "pending",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit artwork")
      }

      const responseData = await response.json().catch(() => ({} as any))
      const newSubmissionId: string | undefined =
        responseData?.submission_id || responseData?.id || submissionId

      toast({
        title: "Success",
        description: isDraft
          ? "Draft saved successfully"
          : "Artwork submitted for review successfully",
      })

      // Server now owns this draft — drop the local snapshot so re-entering
      // the form pulls the canonical record instead of an offline draft.
      clearAutosave()
      onComplete(
        newSubmissionId
          ? { submissionId: newSubmissionId, status: responseData?.status || (isDraft ? "draft" : "pending"), isDraft }
          : undefined
      )
    } catch (error: any) {
      console.error("Error submitting artwork:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit artwork",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingFields) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const formatAutosaveTime = (ts: number | null) => {
    if (!ts) return null
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
    if (diffSec < 5) return "just now"
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {autosaveRestoredAt && !submissionId && (
        <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-700">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Restored unsaved draft</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3 text-xs">
            <span>
              We loaded the draft you started{" "}
              <span className="font-medium">{formatAutosaveTime(autosaveRestoredAt) || "earlier"}</span>{" "}
              in this browser. Your work was waiting for you.
            </span>
            <button
              type="button"
              onClick={discardRestoredDraft}
              className="shrink-0 underline underline-offset-2 hover:text-blue-700"
            >
              Discard and start fresh
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 border-b">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold">
            {submissionId ? "Edit Artwork" : "Add Artwork"}
          </h1>
          {!submissionId && autosaveStatus !== "idle" && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {autosaveStatus === "saving"
                ? "Saving draft locally…"
                : `Draft autosaved ${formatAutosaveTime(autosaveAt) || ""}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting || isSavingDraft}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || isSavingDraft}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isSubmitting || isSavingDraft || !canSubmit()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* On mobile: Series first (after title), then main content */}
        {/* On desktop: Main content first (2/3 width) */}
        <div className="lg:col-span-2 lg:order-1 order-2 space-y-6">
          {/* Title & Description */}
          <Card>
            <CardContent className="pt-6">
              <BasicInfoStep
                formData={formData}
                setFormData={setFormData}
                fieldsConfig={fieldsConfig}
              />
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagesStep
                formData={formData}
                setFormData={setFormData}
                onMaskSavedStatusChange={setMaskSaved}
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantsStep formData={formData} setFormData={setFormData} />
            </CardContent>
          </Card>

          {/* Print Files */}
          <Card>
            <CardHeader>
              <CardTitle>Print Files</CardTitle>
            </CardHeader>
            <CardContent>
              <PrintFilesStep formData={formData} setFormData={setFormData} />
            </CardContent>
          </Card>

          {/* Removed: Series step moved to right sidebar */}
        </div>

        {/* Right Sidebar - Organization */}
        <div className="lg:order-2 order-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">
                {submissionId ? "Draft" : "Not Submitted"}
              </Badge>
            </CardContent>
          </Card>

          {/* Series Selection - Desktop: in sidebar, Mobile: after title */}
          <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <CardTitle>Series (Collection)</CardTitle>
              </CardHeader>
              <CardContent>
                <SeriesStep formData={formData} setFormData={setFormData} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_type">Type</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, product_type: value }))
                  }
                >
                  <SelectTrigger id="product_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Art Prints">Art Prints</SelectItem>
                    <SelectItem value="Original Art">Original Art</SelectItem>
                    <SelectItem value="Digital Art">Digital Art</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Add a tag"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {formData.vendor && (
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input value={formData.vendor} disabled className="bg-muted" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
