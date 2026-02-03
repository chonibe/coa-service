"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  category: string
  enabled: boolean
}

export default function TestEmailPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState<{ template: string; email: string; time: Date } | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/messaging/templates")
      if (!res.ok) throw new Error("Failed to fetch templates")
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const handleSendTest = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template")
      return
    }
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setSending(true)
      const res = await fetch(`/api/admin/messaging/templates/${selectedTemplate}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to send test email")
      }
      
      const templateName = templates.find(t => t.template_key === selectedTemplate)?.name || selectedTemplate
      toast.success(`Test email sent to ${testEmail}`)
      setLastSent({ template: templateName, email: testEmail, time: new Date() })
    } catch (error: any) {
      toast.error(error.message || "Failed to send test email")
    } finally {
      setSending(false)
    }
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = []
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, EmailTemplate[]>)

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Link href="/admin/messaging" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Templates
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaperAirplaneIcon className="h-5 w-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Send a test email using any template to verify formatting and delivery.
            Test emails will have [TEST] prefixed to the subject line.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {category}
                    </div>
                    {categoryTemplates.map((template) => (
                      <SelectItem 
                        key={template.template_key} 
                        value={template.template_key}
                        disabled={!template.enabled}
                      >
                        <div className="flex items-center gap-2">
                          {template.name}
                          {!template.enabled && (
                            <span className="text-xs text-muted-foreground">(disabled)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-sm text-muted-foreground">
                {templates.find(t => t.template_key === selectedTemplate)?.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email Address</Label>
            <Input
              id="email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your-email@example.com"
            />
          </div>

          <Button 
            onClick={handleSendTest} 
            disabled={sending || !selectedTemplate || !testEmail}
            className="w-full"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          {lastSent && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Test email sent successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    <strong>{lastSent.template}</strong> sent to <strong>{lastSent.email}</strong>
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {lastSent.time.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Test emails use sample data (e.g., Order #1234, John Smith)</li>
            <li>• Check your spam folder if the email doesn't arrive</li>
            <li>• Gmail is used as the primary sender for better deliverability</li>
            <li>• Disabled templates can still be tested</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
