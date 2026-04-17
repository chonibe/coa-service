'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContentCard } from '@/components/app-shell'
import { SettingsPageHeader } from '@/components/vendor/SettingsPageHeader'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /vendor/profile/address — Dedicated delivery address page.
 *
 * Artists need a delivery address for returns, physical COAs and any
 * warehouse-routed shipments. All fields are optional; we only ask for
 * what the fulfilment team actually needs.
 */

interface AddressForm {
  deliveryName: string
  deliveryPhone: string
  deliveryAddress1: string
  deliveryAddress2: string
  deliveryCity: string
  deliveryProvince: string
  deliveryCountry: string
  deliveryZip: string
}

interface AddressFieldProps {
  id: keyof AddressForm
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  full?: boolean
  type?: string
}

// Module-level component so React keeps input identity across renders.
// (Defining it inside the page component was causing focus loss on every
// keystroke — the input was being unmounted/remounted each render.)
function AddressField({ id, label, placeholder, value, onChange, full, type = 'text' }: AddressFieldProps) {
  return (
    <div className={full ? 'col-span-2' : undefined}>
      <label htmlFor={id} className="text-[11px] font-body text-gray-500 mb-1 block">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-impact-block-xs text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20 focus:border-impact-primary"
      />
    </div>
  )
}

const EMPTY: AddressForm = {
  deliveryName: '',
  deliveryPhone: '',
  deliveryAddress1: '',
  deliveryAddress2: '',
  deliveryCity: '',
  deliveryProvince: '',
  deliveryCountry: '',
  deliveryZip: '',
}

export default function VendorAddressPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AddressForm>(EMPTY)
  const [initial, setInitial] = useState<AddressForm>(EMPTY)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const v = json.vendor || {}
          const next: AddressForm = {
            deliveryName: v.delivery_name || '',
            deliveryPhone: v.delivery_phone || '',
            deliveryAddress1: v.delivery_address1 || '',
            deliveryAddress2: v.delivery_address2 || '',
            deliveryCity: v.delivery_city || '',
            deliveryProvince: v.delivery_province || '',
            deliveryCountry: v.delivery_country || '',
            deliveryZip: v.delivery_zip || '',
          }
          setForm(next)
          setInitial(next)
        }
      } catch (err) {
        console.error('[profile/address] load', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/vendor/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          delivery_name: form.deliveryName || null,
          delivery_phone: form.deliveryPhone || null,
          delivery_address1: form.deliveryAddress1 || null,
          delivery_address2: form.deliveryAddress2 || null,
          delivery_city: form.deliveryCity || null,
          delivery_province: form.deliveryProvince || null,
          delivery_country: form.deliveryCountry || null,
          delivery_zip: form.deliveryZip || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || json.error || `Save failed (${res.status})`)
      }
      setInitial(form)
      toast({ title: 'Address saved' })
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

  const dirty = (Object.keys(form) as Array<keyof AddressForm>).some((k) => form[k] !== initial[k])

  function update<K extends keyof AddressForm>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  return (
    <div>
      <SettingsPageHeader
        title="Delivery address"
        subtitle="Used for returns, physical COAs and warehouse shipments."
      />

      <div className="px-4 pb-28 space-y-4">
        <ContentCard padding="md">
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AddressField id="deliveryName" label="Recipient name" value={form.deliveryName} onChange={(v) => update('deliveryName', v)} full />
              <AddressField id="deliveryAddress1" label="Address line 1" value={form.deliveryAddress1} onChange={(v) => update('deliveryAddress1', v)} full />
              <AddressField id="deliveryAddress2" label="Address line 2 (optional)" value={form.deliveryAddress2} onChange={(v) => update('deliveryAddress2', v)} full />
              <AddressField id="deliveryCity" label="City" value={form.deliveryCity} onChange={(v) => update('deliveryCity', v)} />
              <AddressField id="deliveryProvince" label="State / Province" value={form.deliveryProvince} onChange={(v) => update('deliveryProvince', v)} />
              <AddressField id="deliveryZip" label="Postal code" value={form.deliveryZip} onChange={(v) => update('deliveryZip', v)} />
              <AddressField id="deliveryCountry" label="Country" value={form.deliveryCountry} onChange={(v) => update('deliveryCountry', v)} />
              <AddressField id="deliveryPhone" label="Phone (optional)" type="tel" value={form.deliveryPhone} onChange={(v) => update('deliveryPhone', v)} full />
            </div>
          )}
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
