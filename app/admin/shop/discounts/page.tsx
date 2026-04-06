"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Label,
  Button,
  Input,
} from "@/components/ui"
import { ArrowLeftIcon, TagIcon } from "@heroicons/react/24/outline"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type {
  ShopDiscountFlagId,
  ShopDiscountFlags,
  ShopDiscountRegistryEntry,
  FeaturedBundleDiscountMode,
  FeaturedBundleDiscountSettings,
} from "@/lib/shop/shop-discount-flags"

export default function AdminShopDiscountsPage() {
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<ShopDiscountFlags | null>(null)
  const [registry, setRegistry] = useState<ShopDiscountRegistryEntry[]>([])
  const [featuredBundle, setFeaturedBundle] = useState<FeaturedBundleDiscountSettings | null>(null)
  const [savingId, setSavingId] = useState<ShopDiscountFlagId | null>(null)
  const [savingBundle, setSavingBundle] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/shop/discount-flags")
      if (!res.ok) throw new Error("Failed to load discount flags")
      const data = (await res.json()) as {
        flags: ShopDiscountFlags
        featuredBundle: FeaturedBundleDiscountSettings
        registry: ShopDiscountRegistryEntry[]
      }
      setFlags(data.flags)
      setFeaturedBundle(data.featuredBundle)
      setRegistry(data.registry ?? [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = async (id: ShopDiscountFlagId, next: boolean) => {
    if (!flags) return
    const prev = flags[id]
    setFlags({ ...flags, [id]: next })
    setSavingId(id)
    try {
      const res = await fetch("/api/admin/shop/discount-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [id]: next }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || "Save failed")
      }
      const data = (await res.json()) as { flags: ShopDiscountFlags; featuredBundle?: FeaturedBundleDiscountSettings }
      setFlags(data.flags)
      if (data.featuredBundle) setFeaturedBundle(data.featuredBundle)
      toast.success("Saved")
    } catch (e: unknown) {
      setFlags({ ...flags, [id]: prev })
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSavingId(null)
    }
  }

  const saveFeaturedBundle = async () => {
    if (!featuredBundle) return
    setSavingBundle(true)
    try {
      const res = await fetch("/api/admin/shop/discount-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featuredBundleEnabled: featuredBundle.enabled,
          featuredBundleMode: featuredBundle.mode,
          featuredBundleValue: featuredBundle.value,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || "Save failed")
      }
      const data = (await res.json()) as { featuredBundle: FeaturedBundleDiscountSettings }
      setFeaturedBundle(data.featuredBundle)
      toast.success("Bundle settings saved")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSavingBundle(false)
    }
  }

  const valueLabel =
    featuredBundle?.mode === "percent_off"
      ? "Percent off regular bundle subtotal (0–100)"
      : featuredBundle?.mode === "amount_off"
        ? "Dollars off regular bundle subtotal"
        : "Fixed bundle total (USD, lamp + 2 spotlight prints)"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <TagIcon className="h-7 w-7 text-muted-foreground" />
          Shop discounts
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Toggle in-app promotional pricing for the public shop experience. Values are stored in
          Supabase <code className="text-xs bg-muted px-1 rounded">system_settings</code> under key{" "}
          <code className="text-xs bg-muted px-1 rounded">shop_discount_flags</code>.
        </p>
      </div>

      {loading && !flags ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : flags && registry.length > 0 ? (
        <div className="space-y-4 max-w-2xl">
          {registry.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{entry.label}</CardTitle>
                    <CardDescription>{entry.description}</CardDescription>
                    <p className="text-xs text-muted-foreground pt-1">
                      Default when unset: {entry.defaultEnabled ? "on" : "off"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {savingId === entry.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                    )}
                    <Label htmlFor={`discount-${entry.id}`} className="sr-only">
                      {entry.label}
                    </Label>
                    <Switch
                      id={`discount-${entry.id}`}
                      checked={flags[entry.id]}
                      disabled={savingId !== null}
                      onCheckedChange={(checked) => void toggle(entry.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Flag id: <code className="bg-muted px-1 rounded">{entry.id}</code>
              </CardContent>
            </Card>
          ))}

          {featuredBundle && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Featured artist bundle (lamp + 2 spotlight prints)</CardTitle>
                <CardDescription>
                  When the cart qualifies (one lamp and at least one of each spotlight print), the first unit of each
                  spotlight print is included in the bundle total. Extra copies of those prints use normal artwork
                  pricing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="featured-bundle-enabled">Enable bundle pricing</Label>
                  <Switch
                    id="featured-bundle-enabled"
                    checked={featuredBundle.enabled}
                    onCheckedChange={(checked) =>
                      setFeaturedBundle((b) => (b ? { ...b, enabled: checked } : b))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured-bundle-mode">Pricing mode</Label>
                  <select
                    id="featured-bundle-mode"
                    className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={featuredBundle.mode}
                    onChange={(e) =>
                      setFeaturedBundle((b) =>
                        b
                          ? { ...b, mode: e.target.value as FeaturedBundleDiscountMode }
                          : b
                      )
                    }
                  >
                    <option value="fixed_total">Fixed total (USD)</option>
                    <option value="percent_off">Percent off regular subtotal</option>
                    <option value="amount_off">Fixed dollars off regular subtotal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured-bundle-value">{valueLabel}</Label>
                  <Input
                    id="featured-bundle-value"
                    type="number"
                    step="0.01"
                    min={0}
                    className="max-w-xs"
                    value={Number.isFinite(featuredBundle.value) ? String(featuredBundle.value) : ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setFeaturedBundle((b) =>
                        b ? { ...b, value: Number.isFinite(v) ? v : 0 } : b
                      )
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => void saveFeaturedBundle()}
                  disabled={savingBundle || savingId !== null}
                >
                  {savingBundle && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save bundle settings
                </Button>
                <p className="text-xs text-muted-foreground">
                  API fields: <code className="bg-muted px-1 rounded">featuredBundleEnabled</code>,{" "}
                  <code className="bg-muted px-1 rounded">featuredBundleMode</code>,{" "}
                  <code className="bg-muted px-1 rounded">featuredBundleValue</code>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">No discount definitions configured.</p>
      )}
    </div>
  )
}
