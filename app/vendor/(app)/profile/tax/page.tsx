'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ContentCard } from '@/components/app-shell'
import { SettingsPageHeader } from '@/components/vendor/SettingsPageHeader'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, FileText, Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /vendor/profile/tax — Dedicated tax information page.
 *
 * Collects the minimum info needed for 1099 / tax reporting:
 *   - Tax ID (SSN/EIN/foreign equivalent — we never log the raw value).
 *   - Tax country (where the artist is tax-resident).
 *   - Whether the account is a registered company (affects W-9 vs W-8).
 *
 * Actual document uploads (W-9, W-8BEN) live on /insights/taxes, which
 * we link to from here. This page intentionally stays narrow.
 */

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'South Africa',
  'Israel',
  'Argentina',
  'Netherlands',
  'Belgium',
  'Portugal',
  'Other',
]

interface TaxForm {
  taxId: string
  taxCountry: string
  isCompany: boolean
}

export default function VendorTaxPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TaxForm>({ taxId: '', taxCountry: '', isCompany: false })
  const [initial, setInitial] = useState<TaxForm>({ taxId: '', taxCountry: '', isCompany: false })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const v = json.vendor || {}
          const next: TaxForm = {
            taxId: v.tax_id || '',
            taxCountry: v.tax_country || '',
            isCompany: !!v.is_company,
          }
          setForm(next)
          setInitial(next)
        }
      } catch (err) {
        console.error('[profile/tax] load', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!form.taxCountry) {
      toast({
        title: 'Country required',
        description: 'Select your tax residence country to continue.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/vendor/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tax_id: form.taxId || null,
          tax_country: form.taxCountry,
          is_company: form.isCompany,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || json.error || `Save failed (${res.status})`)
      }
      setInitial(form)
      toast({
        title: 'Tax info saved',
        description: 'Thanks — this keeps your 1099 paperwork accurate.',
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

  const dirty =
    form.taxId !== initial.taxId ||
    form.taxCountry !== initial.taxCountry ||
    form.isCompany !== initial.isCompany

  return (
    <div>
      <SettingsPageHeader
        title="Tax information"
        subtitle="Needed for payouts, 1099 reporting and international compliance."
      />

      <div className="px-4 pb-28 space-y-4">
        {/* Account type */}
        <ContentCard padding="md">
          <p className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider mb-3">
            Account type
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isCompany: false }))}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-impact-block-xs border text-left transition-colors',
                !form.isCompany
                  ? 'border-impact-primary bg-impact-primary/5'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              )}
            >
              <User className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-900 font-body">Individual</p>
                <p className="text-[10px] text-gray-500 font-body">Sole proprietor / artist</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isCompany: true }))}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-impact-block-xs border text-left transition-colors',
                form.isCompany
                  ? 'border-impact-primary bg-impact-primary/5'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              )}
            >
              <Building2 className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-900 font-body">Company</p>
                <p className="text-[10px] text-gray-500 font-body">LLC / corporation / studio</p>
              </div>
            </button>
          </div>
        </ContentCard>

        {/* Tax ID */}
        <ContentCard padding="md">
          <label
            htmlFor="tax_id"
            className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider mb-2 block"
          >
            Tax ID {form.isCompany ? '(EIN)' : '(SSN or foreign equivalent)'}
          </label>
          {loading ? (
            <div className="h-10 bg-gray-100 rounded-impact-block-xs animate-pulse" />
          ) : (
            <input
              id="tax_id"
              type="text"
              value={form.taxId}
              onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))}
              placeholder={form.isCompany ? '12-3456789' : '123-45-6789'}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-impact-block-xs text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20 focus:border-impact-primary"
            />
          )}
          <p className="text-[11px] text-gray-500 font-body mt-2">
            Encrypted at rest. Only surfaced to our accounting team for
            1099 preparation — never shown to collectors.
          </p>
        </ContentCard>

        {/* Tax country */}
        <ContentCard padding="md">
          <label
            htmlFor="tax_country"
            className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider mb-2 block"
          >
            Tax residence country
          </label>
          {loading ? (
            <div className="h-10 bg-gray-100 rounded-impact-block-xs animate-pulse" />
          ) : (
            <select
              id="tax_country"
              value={form.taxCountry}
              onChange={(e) => setForm((p) => ({ ...p, taxCountry: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-impact-block-xs text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-impact-primary/20 focus:border-impact-primary appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center]"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-gray-500 font-body mt-2">
            Non-US artists may need to submit a W-8BEN instead of a W-9.
          </p>
        </ContentCard>

        {/* Documents shortcut */}
        <ContentCard padding="none">
          <Link
            href="/vendor/insights/taxes"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 font-body">
                Tax documents
              </p>
              <p className="text-xs text-gray-500 font-body">
                Upload your W-9 or W-8BEN and view 1099 forms
              </p>
            </div>
          </Link>
        </ContentCard>
      </div>

      {/* Sticky save bar — sits just above the AppShell bottom tab bar. */}
      <div className="fixed bottom-[calc(var(--app-tab-height)+var(--app-safe-bottom))] inset-x-0 border-t border-gray-100 bg-white/90 backdrop-blur px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/vendor/profile/settings')}
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-body font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={cn(
              'inline-flex items-center gap-1 px-5 py-2 rounded-full bg-impact-primary text-white text-sm font-body font-bold hover:opacity-90 transition-opacity',
              (saving || !dirty) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
