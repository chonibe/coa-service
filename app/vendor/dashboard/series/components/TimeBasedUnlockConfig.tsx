"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Clock, Calendar } from "lucide-react"
import type { UnlockConfig } from "@/types/artwork-series"

interface TimeBasedUnlockConfigProps {
  value: UnlockConfig
  onChange: (config: UnlockConfig) => void
}

export function TimeBasedUnlockConfig({ value, onChange }: TimeBasedUnlockConfigProps) {
  const [unlockType, setUnlockType] = useState<"one-time" | "recurring">(
    value.unlock_at ? "one-time" : value.unlock_schedule ? "recurring" : "one-time"
  )

  const handleOneTimeChange = (dateTime: string) => {
    onChange({
      ...value,
      unlock_at: dateTime,
      unlock_schedule: undefined,
    })
  }

  const handleRecurringChange = (schedule: any) => {
    onChange({
      ...value,
      unlock_at: undefined,
      unlock_schedule: schedule,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time-Based Unlock Configuration
        </CardTitle>
        <CardDescription>
          Create anticipation and daily return behavior. More attention over more days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Unlock Type</Label>
          <RadioGroup
            value={unlockType}
            onValueChange={(val) => setUnlockType(val as "one-time" | "recurring")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="one-time" id="one-time" />
              <Label htmlFor="one-time" className="cursor-pointer">
                One-Time Unlock
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recurring" id="recurring" />
              <Label htmlFor="recurring" className="cursor-pointer">
                Recurring Schedule
              </Label>
            </div>
          </RadioGroup>
        </div>

        {unlockType === "one-time" ? (
          <div className="space-y-3">
            <Label htmlFor="unlock-at">Unlock Date & Time</Label>
            <Input
              id="unlock-at"
              type="datetime-local"
              value={
                value.unlock_at
                  ? new Date(value.unlock_at).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                const dateTime = e.target.value
                if (dateTime) {
                  handleOneTimeChange(new Date(dateTime).toISOString())
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Artworks will unlock at this specific date and time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="schedule-type">Schedule Type</Label>
              <select
                id="schedule-type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={value.unlock_schedule?.type || "daily"}
                onChange={(e) => {
                  handleRecurringChange({
                    ...value.unlock_schedule,
                    type: e.target.value,
                    time: value.unlock_schedule?.time || "12:00",
                  })
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="schedule-time">Time (HH:MM)</Label>
              <Input
                id="schedule-time"
                type="time"
                value={value.unlock_schedule?.time || "12:00"}
                onChange={(e) => {
                  handleRecurringChange({
                    ...value.unlock_schedule,
                    time: e.target.value,
                    type: value.unlock_schedule?.type || "daily",
                  })
                }}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="start-date">Start Date (Optional)</Label>
              <Input
                id="start-date"
                type="date"
                value={value.unlock_schedule?.start_date || ""}
                onChange={(e) => {
                  handleRecurringChange({
                    ...value.unlock_schedule,
                    start_date: e.target.value || undefined,
                    type: value.unlock_schedule?.type || "daily",
                    time: value.unlock_schedule?.time || "12:00",
                  })
                }}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="end-date">End Date (Optional)</Label>
              <Input
                id="end-date"
                type="date"
                value={value.unlock_schedule?.end_date || ""}
                onChange={(e) => {
                  handleRecurringChange({
                    ...value.unlock_schedule,
                    end_date: e.target.value || undefined,
                    type: value.unlock_schedule?.type || "daily",
                    time: value.unlock_schedule?.time || "12:00",
                  })
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

