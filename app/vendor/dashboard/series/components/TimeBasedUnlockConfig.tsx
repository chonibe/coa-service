"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Clock, Calendar, CalendarDays, Repeat } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { UnlockConfig } from "@/types/artwork-series"

interface TimeBasedUnlockConfigProps {
  value: UnlockConfig
  onChange: (config: UnlockConfig) => void
}

export function TimeBasedUnlockConfig({ value, onChange }: TimeBasedUnlockConfigProps) {
  const [unlockType, setUnlockType] = useState<"one-time" | "recurring">(
    value.unlock_at ? "one-time" : value.unlock_schedule ? "recurring" : "one-time"
  )
  const [previewDate, setPreviewDate] = useState<string>("")

  useEffect(() => {
    if (value.unlock_at) {
      setPreviewDate(new Date(value.unlock_at).toLocaleString())
    } else if (value.unlock_schedule) {
      const now = new Date()
      const [hours, minutes] = (value.unlock_schedule.time || "12:00").split(":").map(Number)
      const nextUnlock = new Date(now)
      nextUnlock.setHours(hours, minutes, 0, 0)
      if (now >= nextUnlock) {
        nextUnlock.setDate(nextUnlock.getDate() + 1)
      }
      setPreviewDate(`Next unlock: ${nextUnlock.toLocaleString()}`)
    }
  }, [value])

  const handleOneTimeChange = (dateTime: string) => {
    const isoString = dateTime ? new Date(dateTime).toISOString() : ""
    onChange({
      ...value,
      unlock_at: isoString,
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          Time-Based Unlock Schedule
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Artworks unlock at specific times. Create anticipation and daily return behavior.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.button
          type="button"
          onClick={() => setUnlockType("one-time")}
          className={cn(
            "p-4 rounded-lg border-2 transition-all text-left",
            unlockType === "one-time"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
              : "border-muted hover:border-green-300"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-lg",
              unlockType === "one-time" ? "bg-green-500 text-white" : "bg-muted"
            )}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold">One-Time Unlock</h4>
              <p className="text-xs text-muted-foreground">Unlock at a specific date & time</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setUnlockType("recurring")}
          className={cn(
            "p-4 rounded-lg border-2 transition-all text-left",
            unlockType === "recurring"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
              : "border-muted hover:border-green-300"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-lg",
              unlockType === "recurring" ? "bg-green-500 text-white" : "bg-muted"
            )}>
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold">Recurring Schedule</h4>
              <p className="text-xs text-muted-foreground">Unlock daily or weekly</p>
            </div>
          </div>
        </motion.button>
      </div>

        {unlockType === "one-time" ? (
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-green-600" />
                <Label htmlFor="unlock-at" className="text-base font-semibold">Select Date & Time</Label>
              </div>
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
                    handleOneTimeChange(dateTime)
                  }
                }}
                className="text-lg h-12"
              />
              {value.unlock_at && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
                >
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    📅 {new Date(value.unlock_at).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    🕐 {new Date(value.unlock_at).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Repeat className="h-5 w-5 text-green-600" />
                <Label className="text-base font-semibold">Recurring Schedule</Label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.button
                  type="button"
                  onClick={() => handleRecurringChange({
                    ...value.unlock_schedule,
                    type: "daily",
                    time: value.unlock_schedule?.time || "12:00",
                  })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    value.unlock_schedule?.type === "daily"
                      ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                      : "border-muted hover:border-green-300"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <p className="font-semibold text-sm">Daily</p>
                    <p className="text-xs text-muted-foreground">Every day</p>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => handleRecurringChange({
                    ...value.unlock_schedule,
                    type: "weekly",
                    time: value.unlock_schedule?.time || "12:00",
                  })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    value.unlock_schedule?.type === "weekly"
                      ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                      : "border-muted hover:border-green-300"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <p className="font-semibold text-sm">Weekly</p>
                    <p className="text-xs text-muted-foreground">Once per week</p>
                  </div>
                </motion.button>
              </div>

              <div className="space-y-3">
                <Label htmlFor="schedule-time" className="text-base font-semibold">Unlock Time</Label>
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
                  className="text-lg h-12"
                />
                {value.unlock_schedule?.time && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
                  >
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      🕐 Unlocks {value.unlock_schedule.type === "daily" ? "daily" : "weekly"} at {new Date(`2000-01-01T${value.unlock_schedule.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Duration</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    How long should this schedule run?
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "1 Week", days: 7 },
                      { label: "2 Weeks", days: 14 },
                      { label: "1 Month", days: 30 },
                      { label: "3 Months", days: 90 },
                    ].map((option) => {
                      const isSelected = (() => {
                        if (!value.unlock_schedule?.start_date || !value.unlock_schedule?.end_date) {
                          return false
                        }
                        const start = new Date(value.unlock_schedule.start_date)
                        const end = new Date(value.unlock_schedule.end_date)
                        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                        return diffDays === option.days
                      })()

                      return (
                        <motion.button
                          key={option.days}
                          type="button"
                          onClick={() => {
                            const startDate = new Date()
                            startDate.setHours(0, 0, 0, 0)
                            const endDate = new Date(startDate)
                            endDate.setDate(endDate.getDate() + option.days)

                            handleRecurringChange({
                              ...value.unlock_schedule,
                              start_date: startDate.toISOString().split('T')[0],
                              end_date: endDate.toISOString().split('T')[0],
                              type: value.unlock_schedule?.type || "daily",
                              time: value.unlock_schedule?.time || "12:00",
                            })
                          }}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-center",
                            isSelected
                              ? "border-green-500 bg-green-100 dark:bg-green-900/30 shadow-sm"
                              : "border-muted hover:border-green-300 hover:bg-muted/50"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="font-semibold text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{option.days} days</p>
                        </motion.button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {value.unlock_schedule?.start_date && value.unlock_schedule?.end_date ? (
                      <>
                        Starts: {new Date(value.unlock_schedule.start_date).toLocaleDateString()} • 
                        Ends: {new Date(value.unlock_schedule.end_date).toLocaleDateString()}
                      </>
                    ) : (
                      "Select a duration to set start and end dates"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}

