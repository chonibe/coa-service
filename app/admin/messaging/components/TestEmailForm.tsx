"use client"

import { useState } from "react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui"
import { toast } from "sonner"

interface TestEmailFormProps {
  templateKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestEmailForm({ templateKey, open, onOpenChange }: TestEmailFormProps) {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setSending(true)
      const res = await fetch(`/api/admin/messaging/templates/${templateKey}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to send test email")
      }
      
      toast.success(`Test email sent to ${email}`)
      onOpenChange(false)
      setEmail("") // Reset form
    } catch (error: any) {
      toast.error(error.message || "Failed to send test email")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email using this template with sample data. The subject will be prefixed with [TEST].
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="test-email">Email Address</Label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            className="mt-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Send Test Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
