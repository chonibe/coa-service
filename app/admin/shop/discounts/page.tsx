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
} from "@/components/ui"
import { ArrowLeftIcon, TagIcon } from "@heroicons/react/24/outline"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type {
  ShopDiscountFlagId,
  ShopDiscountFlags,
  ShopDiscountRegistryEntry,
} from "@/lib/shop/shop-discount-flags"

export default function AdminShopDiscountsPage() {
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<ShopDiscountFlags | null>(null)
  const [registry, setRegistry] = useState<ShopDiscountRegistryEntry[]>([])
  const [savingId, setSavingId] = useState<ShopDiscountFlagId | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/shop/discount-flags")
      if (!res.ok) throw new Error("Failed to load discount flags")
      const data = (await res.json()) as {
        flags: ShopDiscountFlags
        registry: ShopDiscountRegistryEntry[]
      }
      setFlags(data.flags)
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
      const data = (await res.json()) as { flags: ShopDiscountFlags }
      setFlags(data.flags)
      toast.success("Saved")
    } catch (e: unknown) {
      setFlags({ ...flags, [id]: prev })
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSavingId(null)
    }
  }

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
        </div>
      ) : (
        <p className="text-muted-foreground">No discount definitions configured.</p>
      )}
    </div>
  )
}
