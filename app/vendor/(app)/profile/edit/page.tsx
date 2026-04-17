'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ContentCard } from '@/components/app-shell'
import { SettingsPageHeader } from '@/components/vendor/SettingsPageHeader'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Camera, Trash2, Globe, Instagram, Pen, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * /vendor/profile/edit — Public identity editor (AppShell-native).
 *
 * This is the "how collectors see you" page: bio, profile image,
 * website, Instagram handle, signature. Money, tax, address and
 * notifications live on dedicated sibling pages so each surface stays
 * focused and small.
 *
 * Replaces the earlier wrapper that re-rendered the 1900-line legacy
 * /vendor/dashboard/profile editor.
 */

interface VendorPublicIdentity {
  vendorName: string
  bio: string
  instagramUrl: string
  website: string
  profileImage: string
  signatureUrl: string
}

export default function VendorProfileEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<VendorPublicIdentity>({
    vendorName: '',
    bio: '',
    instagramUrl: '',
    website: '',
    profileImage: '',
    signatureUrl: '',
  })
  const [uploading, setUploading] = useState<'profile' | 'signature' | null>(null)
  const profileFileRef = useRef<HTMLInputElement | null>(null)
  const signatureFileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const v = json.vendor || {}
          setForm({
            vendorName: v.vendor_name || '',
            bio: v.bio || '',
            instagramUrl: v.instagram_url || '',
            website: v.website || '',
            profileImage: v.profile_image || '',
            signatureUrl: v.signature_url || '',
          })
        }
      } catch (err) {
        console.error('[profile/edit] load', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function uploadFile(file: File, kind: 'profile' | 'signature'): Promise<string | null> {
    const endpoint =
      kind === 'profile'
        ? '/api/vendor/profile/upload-image'
        : '/api/vendor/profile/upload-signature'

    const fd = new FormData()
    fd.append('file', file)
    setUploading(kind)
    try {
      const res = await fetch(endpoint, { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Upload failed (${res.status})`)
      }
      const json = await res.json()
      return json.url || json.fileUrl || json.publicUrl || null
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setUploading(null)
    }
  }

  async function handleProfileFile(file: File | null) {
    if (!file) return
    const url = await uploadFile(file, 'profile')
    if (url) {
      setForm((prev) => ({ ...prev, profileImage: url }))
      toast({ title: 'Image uploaded', description: 'Don’t forget to save.' })
    }
    if (profileFileRef.current) profileFileRef.current.value = ''
  }

  async function handleSignatureFile(file: File | null) {
    if (!file) return
    const url = await uploadFile(file, 'signature')
    if (url) {
      setForm((prev) => ({ ...prev, signatureUrl: url }))
      toast({ title: 'Signature uploaded', description: 'Don’t forget to save.' })
    }
    if (signatureFileRef.current) signatureFileRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Uses /api/vendor/profile/update (surgical endpoint) — only touches
      // bio, instagram_url, profile_image, signature_url. Payment/tax
      // never go through here.
      const res = await fetch('/api/vendor/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bio: form.bio,
          instagram_url: form.instagramUrl,
          profile_image: form.profileImage || null,
          signature_url: form.signatureUrl || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || json.error || `Save failed (${res.status})`)
      }
      // website is saved through /api/vendor/update-profile which also
      // carries the heavier onboarding side-effects; we only hit it if the
      // vendor actually edited website. Keeps the common path cheap.
      if (form.website) {
        await fetch('/api/vendor/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ website: form.website }),
        }).catch(() => null)
      }

      toast({
        title: 'Profile saved',
        description: 'Your public identity is up to date.',
      })
    } catch (err: any) {
      toast({
        title: 'Could not save',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <SettingsPageHeader
          title="Public profile"
          subtitle="Loading…"
          backHref="/vendor/profile"
          backLabel="Profile"
        />
        <div className="px-4 pb-8 space-y-3">
          <div className="h-40 bg-gray-100 rounded-impact-block-xs animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-impact-block-xs animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <SettingsPageHeader
        title="Public profile"
        subtitle="How collectors see you — bio, photo, links."
        backHref="/vendor/profile"
        backLabel="Profile"
        right={
          <Link
            href="/vendor/profile/public-preview"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-body font-semibold hover:bg-gray-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Preview
          </Link>
        }
      />

      <div className="px-4 pb-28 space-y-4">
        {/* Profile image */}
        <ContentCard padding="md">
          <p className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider mb-3">
            Profile photo
          </p>
          <div className="flex items-center gap-4">
            {form.profileImage ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 shrink-0">
                <Image
                  src={form.profileImage}
                  alt={form.vendorName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-gray-600 font-body">
                  {form.vendorName.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                ref={profileFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleProfileFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => profileFileRef.current?.click()}
                disabled={uploading === 'profile'}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white text-xs font-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {uploading === 'profile' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
                {form.profileImage ? 'Change photo' : 'Upload photo'}
              </button>
              {form.profileImage && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, profileImage: '' }))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-body font-semibold hover:bg-red-100 transition-colors ml-2"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
              <p className="text-[11px] text-gray-500 font-body">Square photo, min 400×400px, max 5 MB.</p>
            </div>
          </div>
        </ContentCard>

        {/* Bio */}
        <ContentCard padding="md">
          <label htmlFor="bio" className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider mb-2 block">
            Bio
          </label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={5}
            maxLength={500}
            placeholder="A short bio collectors see on your profile page."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-impact-block-xs text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20 focus:border-impact-primary resize-none"
          />
          <p className="text-[11px] text-gray-500 font-body mt-1 text-right">
            {form.bio.length}/500
          </p>
        </ContentCard>

        {/* Links */}
        <ContentCard padding="md">
          <p className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider mb-3">
            Links
          </p>
          <div className="space-y-3">
            <div>
              <label htmlFor="website" className="text-[11px] font-body text-gray-500 mb-1 block">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://yourstudio.com"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-impact-block-xs text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20 focus:border-impact-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="instagram" className="text-[11px] font-body text-gray-500 mb-1 block">
                Instagram
              </label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="instagram"
                  type="text"
                  value={form.instagramUrl}
                  onChange={(e) => setForm((p) => ({ ...p, instagramUrl: e.target.value }))}
                  placeholder="@handle or full URL"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-impact-block-xs text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20 focus:border-impact-primary"
                />
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Signature */}
        <ContentCard padding="md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider">
                Signature
              </p>
              <p className="text-[11px] text-gray-500 font-body mt-0.5">
                Printed on the certificate of authenticity. PNG with transparency looks best.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {form.signatureUrl ? (
              <div className="relative w-24 h-20 rounded-impact-block-xs overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                <Image
                  src={form.signatureUrl}
                  alt="Signature"
                  fill
                  className="object-contain p-1"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="w-24 h-20 rounded-impact-block-xs bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center shrink-0">
                <Pen className="w-5 h-5 text-gray-300" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                ref={signatureFileRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => handleSignatureFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => signatureFileRef.current?.click()}
                  disabled={uploading === 'signature'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white text-xs font-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {uploading === 'signature' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                  {form.signatureUrl ? 'Replace' : 'Upload signature'}
                </button>
                {form.signatureUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, signatureUrl: '' }))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-body font-semibold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </ContentCard>
      </div>

      {/* Sticky save bar — sits just above the AppShell bottom tab bar. */}
      <div className="fixed bottom-[calc(var(--app-tab-height)+var(--app-safe-bottom))] inset-x-0 border-t border-gray-100 bg-white/90 backdrop-blur px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/vendor/profile')}
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-body font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-1 px-5 py-2 rounded-full bg-impact-primary text-white text-sm font-body font-bold hover:opacity-90 transition-opacity',
              saving && 'opacity-60 cursor-not-allowed'
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
