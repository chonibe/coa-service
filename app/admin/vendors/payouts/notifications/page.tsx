"use client"

import { useState, useEffect } from "react"







import { toast } from "sonner"
import { Bell, Mail, Settings } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Switch, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/components/ui"
interface NotificationPreferences {
  vendor_name: string
  email_enabled: boolean
  payout_processed: boolean
  payout_failed: boolean
  payout_pending: boolean
  refund_deduction: boolean
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Record<string, NotificationPreferences>>({})
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [vendors, setVendors] = useState<Array<{ vendor_name: string }>>([])

  useEffect(() => {
    fetchVendors()
    fetchPreferences()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/admin/vendors")
      if (!response.ok) throw new Error("Failed to fetch vendors")
      const data = await response.json()
      setVendors(data.vendors || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load vendors")
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/admin/payouts/notification-preferences")
      if (!response.ok) throw new Error("Failed to fetch preferences")
      const data = await response.json()
      const prefsMap: Record<string, NotificationPreferences> = {}
      data.preferences?.forEach((pref: NotificationPreferences) => {
        prefsMap[pref.vendor_name] = pref
      })
      setPreferences(prefsMap)
    } catch (error: any) {
      toast.error(error.message || "Failed to load preferences")
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (
    vendorName: string,
    field: keyof NotificationPreferences,
    value: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/payouts/notification-preferences/${vendorName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update preference")
      }

      setPreferences((prev) => ({
        ...prev,
        [vendorName]: {
          ...prev[vendorName],
          [field]: value,
        },
      }))

      toast.success("Preference updated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update preference")
    }
  }

  const getVendorPreferences = (vendorName: string): NotificationPreferences => {
    return (
      preferences[vendorName] || {
        vendor_name: vendorName,
        email_enabled: true,
        payout_processed: true,
        payout_failed: true,
        payout_pending: true,
        refund_deduction: true,
      }
    )
  }

  if (loading) {
    return <div className="p-6">Loading preferences...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground mt-1">
            Manage email notification preferences for vendors
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedVendor || "all"} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.vendor_name} value={vendor.vendor_name}>
                  {vendor.vendor_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {(selectedVendor === null || selectedVendor === "all"
          ? vendors
          : vendors.filter((v) => v.vendor_name === selectedVendor)
        ).map((vendor) => {
          const prefs = getVendorPreferences(vendor.vendor_name)
          return (
            <Card key={vendor.vendor_name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {vendor.vendor_name}
                </CardTitle>
                <CardDescription>Email notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`email-${vendor.vendor_name}`}>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable all email notifications
                    </p>
                  </div>
                  <Switch
                    id={`email-${vendor.vendor_name}`}
                    checked={prefs.email_enabled}
                    onCheckedChange={(checked) =>
                      updatePreference(vendor.vendor_name, "email_enabled", checked)
                    }
                  />
                </div>

                {prefs.email_enabled && (
                  <div className="space-y-3 pl-6 border-l-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Payout Processed</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when payout is completed
                        </p>
                      </div>
                      <Switch
                        checked={prefs.payout_processed}
                        onCheckedChange={(checked) =>
                          updatePreference(vendor.vendor_name, "payout_processed", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Payout Failed</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when payout fails
                        </p>
                      </div>
                      <Switch
                        checked={prefs.payout_failed}
                        onCheckedChange={(checked) =>
                          updatePreference(vendor.vendor_name, "payout_failed", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Payout Pending</Label>
                        <p className="text-sm text-muted-foreground">
                          Reminder for pending payouts
                        </p>
                      </div>
                      <Switch
                        checked={prefs.payout_pending}
                        onCheckedChange={(checked) =>
                          updatePreference(vendor.vendor_name, "payout_pending", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Refund Deduction</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when refund affects balance
                        </p>
                      </div>
                      <Switch
                        checked={prefs.refund_deduction}
                        onCheckedChange={(checked) =>
                          updatePreference(vendor.vendor_name, "refund_deduction", checked)
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

