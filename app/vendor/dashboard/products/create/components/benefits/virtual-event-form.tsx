"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Calendar, Clock, Link as LinkIcon, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface VirtualEventFormProps {
  formData: {
    title: string
    description: string
    contentUrl: string
    accessCode: string
    startsAt: string
    expiresAt: string
  }
  setFormData: (data: any) => void
}

export function VirtualEventForm({ formData, setFormData }: VirtualEventFormProps) {
  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      const offset = date.getTimezoneOffset()
      const localDate = new Date(date.getTime() - offset * 60 * 1000)
      return localDate.toISOString().slice(0, 16)
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 4:</span>
        <span>Event details</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Event Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Artist Q&A Session, Studio Tour Livestream, Process Workshop"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-lg h-12"
        />
        <p className="text-xs text-muted-foreground">
          What kind of virtual event are you hosting?
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Event Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what will happen during this event, what collectors will learn, or what makes it special..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          maxLength={400}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Help collectors understand what to expect
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/400
          </p>
        </div>
      </div>

      {/* Date & Time */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 2 of 4:</span>
          <span>Schedule the event</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="starts-at" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event Start <span className="text-red-500">*</span>
            </Label>
            <Input
              id="starts-at"
              type="datetime-local"
              value={formData.startsAt || ""}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              When does the event begin?
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires-at" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Event End
            </Label>
            <Input
              id="expires-at"
              type="datetime-local"
              value={formData.expiresAt || ""}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              When does the event end? (optional)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Access Setup */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 3 of 4:</span>
          <span>Set up access</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content-url" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Event Link <span className="text-red-500">*</span>
          </Label>
          <Input
            id="content-url"
            type="url"
            placeholder="https://zoom.us/j/... or https://..."
            value={formData.contentUrl}
            onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Link to the virtual event (Zoom, Google Meet, YouTube Live, etc.)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="access-code">Access Code / Password (Optional)</Label>
          <Input
            id="access-code"
            placeholder="Enter meeting password or access code"
            value={formData.accessCode}
            onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            If the event requires a password or access code
          </p>
        </div>
      </motion.div>

      {/* Preview */}
      {formData.title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Collector Preview</span>
          </div>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Video className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{formData.title}</h4>
                    <Badge variant="outline" className="bg-green-500/10">
                      Virtual Event
                    </Badge>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {formData.description}
                    </p>
                  )}
                  {formData.startsAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(formData.startsAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {formData.contentUrl && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <LinkIcon className="h-3 w-3" />
                      <span>Event link provided</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

