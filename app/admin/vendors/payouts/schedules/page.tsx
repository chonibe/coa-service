"use client"

import { useState, useEffect } from "react"

import { toast } from "sonner"

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Label, Switch } from "@/components/ui"
interface PayoutSchedule {
  id: number
  vendor_name: string
  schedule_type: "weekly" | "monthly" | "biweekly" | "manual"
  day_of_week: number | null
  day_of_month: number | null
  biweekly_interval: number | null
  payment_method: string | null
  instant_payouts_enabled: boolean | null
  instant_payout_fee_percent: number | null
  enabled: boolean
  minimum_amount: number
  last_run: string | null
  next_run: string | null
}

export default function PayoutSchedulesPage() {
  const [schedules, setSchedules] = useState<PayoutSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<PayoutSchedule>>({})

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/admin/payouts/schedules")
      if (!response.ok) throw new Error("Failed to fetch schedules")
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (schedule: PayoutSchedule) => {
    setEditing(schedule.id)
    setFormData({
      schedule_type: schedule.schedule_type,
      day_of_week: schedule.day_of_week,
      day_of_month: schedule.day_of_month,
      biweekly_interval: schedule.biweekly_interval,
      payment_method: schedule.payment_method,
      instant_payouts_enabled: schedule.instant_payouts_enabled,
      instant_payout_fee_percent: schedule.instant_payout_fee_percent,
      enabled: schedule.enabled,
      minimum_amount: schedule.minimum_amount,
    })
  }

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/payouts/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update schedule")
      }

      toast.success("Schedule updated successfully")
      setEditing(null)
      fetchSchedules()
    } catch (error: any) {
      toast.error(error.message || "Failed to update schedule")
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/admin/payouts/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create schedule")
      }

      toast.success("Schedule created successfully")
      setEditing(null)
      setFormData({})
      fetchSchedules()
    } catch (error: any) {
      toast.error(error.message || "Failed to create schedule")
    }
  }

  if (loading) {
    return <div className="p-6">Loading schedules...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payout Schedules</h1>
          <p className="text-muted-foreground mt-1">
            Manage automated payout schedules for vendors
          </p>
        </div>
        <Button onClick={() => setEditing(-1)}>Create Schedule</Button>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{schedule.vendor_name}</CardTitle>
                  <CardDescription>
                    {schedule.schedule_type === "weekly"
                      ? `Weekly on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][schedule.day_of_week || 0]}`
                      : schedule.schedule_type === "monthly"
                      ? `Monthly on day ${schedule.day_of_month}`
                      : schedule.schedule_type === "biweekly"
                      ? `Bi-weekly on day ${schedule.biweekly_interval} of each month`
                      : "Manual"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${schedule.enabled ? "text-green-600" : "text-gray-400"}`}>
                    {schedule.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editing === schedule.id ? (
                <ScheduleForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={() => handleSave(schedule.id)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Amount:</span>
                    <span className="font-medium">
                      ${schedule.minimum_amount.toFixed(2)}
                    </span>
                  </div>
                  {schedule.last_run && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Run:</span>
                      <span className="font-medium">
                        {new Date(schedule.last_run).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {schedule.next_run && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Run:</span>
                      <span className="font-medium">
                        {new Date(schedule.next_run).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editing === -1 && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleCreate}
              onCancel={() => {
                setEditing(null)
                setFormData({})
              }}
              isNew
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ScheduleForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  isNew = false,
}: {
  formData: Partial<PayoutSchedule>
  setFormData: (data: Partial<PayoutSchedule>) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
}) {
  return (
    <div className="space-y-4">
      {isNew && (
        <div>
          <Label>Vendor Name</Label>
          <Input
            value={formData.vendor_name || ""}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
            placeholder="Enter vendor name"
          />
        </div>
      )}
      <div>
        <Label>Schedule Type</Label>
        <Select
          value={formData.schedule_type || "manual"}
          onValueChange={(value: "weekly" | "monthly" | "biweekly" | "manual") =>
            setFormData({ ...formData, schedule_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="biweekly">Bi-weekly</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.schedule_type === "weekly" && (
        <div>
          <Label>Day of Week</Label>
          <Select
            value={formData.day_of_week?.toString() || "0"}
            onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="2">Tuesday</SelectItem>
              <SelectItem value="3">Wednesday</SelectItem>
              <SelectItem value="4">Thursday</SelectItem>
              <SelectItem value="5">Friday</SelectItem>
              <SelectItem value="6">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {formData.schedule_type === "monthly" && (
        <div>
          <Label>Day of Month (1-28)</Label>
          <Input
            type="number"
            min="1"
            max="28"
            value={formData.day_of_month || ""}
            onChange={(e) =>
              setFormData({ ...formData, day_of_month: parseInt(e.target.value) || undefined })
            }
          />
        </div>
      )}
      {formData.schedule_type === "biweekly" && (
        <div>
          <Label>Bi-weekly Interval (1st or 15th of month)</Label>
          <Select
            value={formData.biweekly_interval?.toString() || "1"}
            onValueChange={(value) => setFormData({ ...formData, biweekly_interval: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st of month</SelectItem>
              <SelectItem value="15">15th of month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Payment Method</Label>
        <Select
          value={formData.payment_method || "paypal"}
          onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Minimum Amount ($)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={formData.minimum_amount || ""}
          onChange={(e) =>
            setFormData({ ...formData, minimum_amount: parseFloat(e.target.value) || 0 })
          }
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.instant_payouts_enabled ?? false}
          onCheckedChange={(checked) => setFormData({ ...formData, instant_payouts_enabled: checked })}
        />
        <Label>Enable Instant Payouts</Label>
      </div>
      {formData.instant_payouts_enabled && (
        <div>
          <Label>Instant Payout Fee (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.instant_payout_fee_percent || ""}
            onChange={(e) =>
              setFormData({ ...formData, instant_payout_fee_percent: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.enabled ?? true}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label>Enabled</Label>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave}>Save</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

