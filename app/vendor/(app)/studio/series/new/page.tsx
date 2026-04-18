"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Upload, X, Lock, ArrowRight, Crown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { UnlockType } from "@/types/artwork-series"

const unlockTypes = [
  {
    value: "any_purchase" as UnlockType,
    label: "Open Collection",
    description: "All artworks unlock immediately with purchase.",
    icon: Lock,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-300 dark:border-blue-700",
    selectedBg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    value: "sequential" as UnlockType,
    label: "Finish the Set",
    description: "Each purchase unlocks the next artwork in order.",
    icon: ArrowRight,
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-300 dark:border-purple-700",
    selectedBg: "bg-purple-100 dark:bg-purple-900/40",
  },
  {
    value: "vip" as UnlockType,
    label: "VIP Unlocks",
    description: "Exclusive pieces unlock for collectors who own all earlier works.",
    icon: Crown,
    gradient: "from-orange-500 to-red-500",
    bgGradient: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-300 dark:border-orange-700",
    selectedBg: "bg-orange-100 dark:bg-orange-900/40",
  },
]

export default function CreateSeriesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedType, setSelectedType] = useState<UnlockType>("any_purchase")
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const uploadCover = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/vendor/media-library/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || json.message || "Upload failed")
      setCoverUrl(json.file?.url || json.url)
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give your series a name.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/vendor/series", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          unlock_type: selectedType,
          thumbnail_url: coverUrl,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to create series")
      toast({ title: "Series created", description: `"${name.trim()}" is ready.` })
      router.push(`/vendor/studio/series/${json.series?.id || json.id}`)
    } catch (err: any) {
      toast({ title: "Could not create series", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#390000]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
        <Link
          href="/vendor/studio/series"
          className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-body transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Series
        </Link>

        <h1 className="font-heading text-3xl font-semibold text-white tracking-[-0.02em] mb-1">
          Create a Series
        </h1>
        <p className="text-white/60 text-sm font-body">
          Curate your works into a journey.
        </p>
        <p className="mt-3 text-xs font-body text-white/45">
          Add a name (required), optional cover and description, choose an unlock style, then use{" "}
          <span className="font-semibold text-white/70">Create series</span> at the bottom of the form.
        </p>
      </div>

      {/* Form card — sticky footer keeps primary action visible (no separate “Next”; one step = Create). */}
      <div className="mx-4 mb-6 max-w-2xl mx-auto flex flex-col rounded-3xl bg-white shadow-sm">
        <div className="space-y-6 p-6 md:p-8">
        {/* Cover image upload */}
        <div>
          <label className="block text-sm font-semibold font-body text-[#1a1a1a] mb-2">
            Cover Image
          </label>
          <div
            className={cn(
              "relative h-44 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-colors",
              coverUrl
                ? "border-transparent"
                : "border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40"
            )}
            onClick={() => {
              if (!coverUrl) {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = "image/*"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) void uploadCover(file)
                }
                input.click()
              }
            }}
          >
            {coverUrl ? (
              <>
                <Image src={coverUrl} alt="Cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCoverUrl(null) }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#1a1a1a]/40">
                <div className="h-12 w-12 rounded-full border-2 border-current flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium">1920 x 400 recommended</p>
                <p className="text-[10px] opacity-60">PNG, JPG, WebP up to 10MB</p>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-[#1a1a1a]/20 border-t-[#1a1a1a] animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Series name */}
        <div>
          <label className="block text-sm font-semibold font-body text-[#1a1a1a] mb-2" htmlFor="series-name">
            Series Name <span className="text-red-500">*</span>
          </label>
          <input
            id="series-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Collection 2026"
            className="w-full h-11 px-4 rounded-lg border border-[#1a1a1a]/20 text-sm font-body focus:border-impact-primary focus:outline-none focus:ring-1 focus:ring-impact-primary placeholder:text-[#1a1a1a]/40"
            maxLength={120}
          />
        </div>

        {/* Unlock type selector */}
        <div>
          <p className="mb-3 text-sm font-semibold font-body text-[#1a1a1a]">
            How should collectors unlock artworks?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {unlockTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedType === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all",
                    isSelected
                      ? `${type.borderColor} ${type.selectedBg} shadow-sm`
                      : "border-[#1a1a1a]/15 bg-white hover:border-[#1a1a1a]/30"
                  )}
                >
                  {isSelected && (
                    <div className={cn(
                      "absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center bg-gradient-to-r text-white shadow-sm",
                      type.gradient
                    )}>
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-white shadow-sm bg-gradient-to-br",
                    type.gradient
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-[#1a1a1a] mb-1">{type.label}</p>
                  <p className="text-xs text-[#1a1a1a]/60 leading-relaxed">{type.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold font-body text-[#1a1a1a] mb-2" htmlFor="series-desc">
            Description <span className="text-[#1a1a1a]/40 font-normal">(optional)</span>
          </label>
          <textarea
            id="series-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description for your series..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[#1a1a1a]/20 text-sm font-body focus:border-impact-primary focus:outline-none focus:ring-1 focus:ring-impact-primary placeholder:text-[#1a1a1a]/40 resize-none"
            maxLength={500}
          />
        </div>

        {/* Primary CTA — sticky above vendor bottom tabs on small screens; sticks to viewport on desktop when form is tall */}
        <div
          className={cn(
            "shrink-0 border-t border-[#1a1a1a]/10 bg-white/95 p-4 backdrop-blur-md md:p-6",
            "sticky z-20",
            "bottom-[calc(var(--app-tab-height)+var(--app-safe-bottom)+0.75rem)] md:bottom-0",
          )}
        >
          <p className="mb-3 text-center text-[11px] font-medium text-[#1a1a1a]/50 md:hidden">
            This page has one step — when you&apos;re ready, tap below to create the series.
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-impact-primary font-body text-sm font-bold text-white",
              "transition-opacity hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </>
            ) : (
              <>Create series</>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}