"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Trash2, Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface ScheduleRule {
  id: string
  name: string
  frequency: "weekly" | "bi-weekly" | "monthly"
  dayOfWeek?: number
  dayOfMonth?: number
  autoProcess: boolean
  threshold?: number
  vendorName?: string
  enabled: boolean
  nextRun?: string
  lastRun?: string
}

interface AutomatedSchedulingProps {
  isAdmin?: boolean
  vendorName?: string
}

export function AutomatedScheduling({ isAdmin = false, vendorName }: AutomatedSchedulingProps) {
  const [schedules, setSchedules] = useState<ScheduleRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRule | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<ScheduleRule>>({
    name: "",
    frequency: "monthly",
    autoProcess: false,
    enabled: true,
  })

  useEffect(() => {
    fetchSchedules()
  }, [vendorName])

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      const url = isAdmin
        ? "/api/payouts/schedules"
        : `/api/payouts/schedules?vendorName=${encodeURIComponent(vendorName || "")}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch schedules")
      }

      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error("Error fetching schedules:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load schedules",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingSchedule
        ? `/api/payouts/schedules/${editingSchedule.id}`
        : "/api/payouts/schedules"

      const method = editingSchedule ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          vendorName: isAdmin ? formData.vendorName : vendorName,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save schedule")
      }

      toast({
        title: "Success",
        description: editingSchedule ? "Schedule updated" : "Schedule created",
      })

      setIsDialogOpen(false)
      setEditingSchedule(null)
      setFormData({
        name: "",
        frequency: "monthly",
        autoProcess: false,
        enabled: true,
      })
      fetchSchedules()
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    try {
      const response = await fetch(`/api/payouts/schedules/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete schedule")
      }

      toast({
        title: "Success",
        description: "Schedule deleted",
      })

      fetchSchedules()
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete schedule",
      })
    }
  }

  const handleToggle = async (schedule: ScheduleRule) => {
    try {
      const response = await fetch(`/api/payouts/schedules/${schedule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...schedule,
          enabled: !schedule.enabled,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to update schedule")
      }

      fetchSchedules()
    } catch (error) {
      console.error("Error toggling schedule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update schedule",
      })
    }
  }

  const openEditDialog = (schedule: ScheduleRule) => {
    setEditingSchedule(schedule)
    setFormData(schedule)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingSchedule(null)
    setFormData({
      name: "",
      frequency: "monthly",
      autoProcess: false,
      enabled: true,
    })
    setIsDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Automated Payout Scheduling
            </CardTitle>
            <CardDescription>
              Set up recurring payouts and automatic processing rules
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? "Edit Schedule" : "Create Schedule"}
                </DialogTitle>
                <DialogDescription>
                  Configure automated payout processing rules
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>Schedule Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Vendor Payouts"
                  />
                </div>

                {isAdmin && (
                  <div>
                    <Label>Vendor (Optional - leave empty for all vendors)</Label>
                    <Input
                      value={formData.vendorName || ""}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value || undefined })}
                      placeholder="Vendor name"
                    />
                  </div>
                )}

                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, frequency: value as ScheduleRule["frequency"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.frequency === "weekly" && (
                  <div>
                    <Label>Day of Week</Label>
                    <Select
                      value={formData.dayOfWeek?.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dayOfWeek: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.frequency === "monthly" && (
                  <div>
                    <Label>Day of Month</Label>
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={formData.dayOfMonth || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || undefined })
                      }
                      placeholder="1-28"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Process Payouts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically process payouts when scheduled
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoProcess}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoProcess: checked })}
                  />
                </div>

                {formData.autoProcess && (
                  <div>
                    <Label>Minimum Threshold (Optional)</Label>
                    <Input
                      type="number"
                      value={formData.threshold || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, threshold: parseFloat(e.target.value) || undefined })
                      }
                      placeholder="Only process if amount exceeds this value"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enabled</Label>
                    <p className="text-sm text-muted-foreground">Activate this schedule</p>
                  </div>
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Schedule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No schedules configured. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {isAdmin && <TableHead>Vendor</TableHead>}
                <TableHead>Frequency</TableHead>
                <TableHead>Auto-Process</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.name}</TableCell>
                  {isAdmin && (
                    <TableCell>{schedule.vendorName || "All Vendors"}</TableCell>
                  )}
                  <TableCell className="capitalize">{schedule.frequency.replace("-", " ")}</TableCell>
                  <TableCell>{schedule.autoProcess ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {schedule.nextRun
                      ? format(new Date(schedule.nextRun), "MMM d, yyyy")
                      : "Not scheduled"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={() => handleToggle(schedule)}
                      />
                      <Badge variant={schedule.enabled ? "default" : "secondary"}>
                        {schedule.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}


