"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import { 
  ArrowLeftIcon,
  EnvelopeIcon, 
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { TemplateEditor } from "../components/TemplateEditor"
import { TemplatePreview } from "../components/TemplatePreview"
import { TestEmailForm } from "../components/TestEmailForm"

interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  category: string
  subject: string
  html_body: string
  variables: Array<{ name: string; description: string; example: string }>
  enabled: boolean
  updated_at: string
}

interface PreviewData {
  subject: string
  html: string
  sampleData: Record<string, string>
}

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const templateKey = params.templateKey as string

  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [defaultTemplate, setDefaultTemplate] = useState<{ subject: string; html: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Form state
  const [subject, setSubject] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  // Test email dialog
  const [testDialogOpen, setTestDialogOpen] = useState(false)

  // Reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [templateKey])

  useEffect(() => {
    if (template) {
      setHasChanges(
        subject !== template.subject ||
        htmlBody !== template.html_body ||
        enabled !== template.enabled
      )
    }
  }, [subject, htmlBody, enabled, template])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/messaging/templates/${templateKey}`)
      if (!res.ok) throw new Error("Template not found")
      const data = await res.json()
      
      setTemplate(data.template)
      setDefaultTemplate(data.defaultTemplate)
      setSubject(data.template.subject)
      setHtmlBody(data.template.html_body)
      setEnabled(data.template.enabled)
      
      // Generate initial preview
      generatePreview(data.template.subject, data.template.html_body)
    } catch (error: any) {
      toast.error(error.message || "Failed to load template")
      router.push("/admin/messaging")
    } finally {
      setLoading(false)
    }
  }

  const generatePreview = useCallback(async (subjectText: string, htmlText: string) => {
    try {
      setPreviewLoading(true)
      const res = await fetch(`/api/admin/messaging/templates/${templateKey}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subjectText, html_body: htmlText }),
      })
      
      if (!res.ok) throw new Error("Failed to generate preview")
      const data = await res.json()
      setPreview(data.preview)
    } catch (error: any) {
      console.error("Preview error:", error)
    } finally {
      setPreviewLoading(false)
    }
  }, [templateKey])

  // Debounced preview update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (subject && htmlBody) {
        generatePreview(subject, htmlBody)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [subject, htmlBody, generatePreview])

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/messaging/templates/${templateKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html_body: htmlBody, enabled }),
      })
      
      if (!res.ok) throw new Error("Failed to save template")
      const data = await res.json()
      
      setTemplate(data.template)
      setHasChanges(false)
      toast.success("Template saved successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setResetting(true)
      const res = await fetch(`/api/admin/messaging/templates/${templateKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      })
      
      if (!res.ok) throw new Error("Failed to reset template")
      const data = await res.json()
      
      setTemplate(data.template)
      setSubject(data.template.subject)
      setHtmlBody(data.template.html_body)
      setHasChanges(false)
      toast.success("Template reset to default")
      setResetDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to reset template")
    } finally {
      setResetting(false)
    }
  }

  const handleInsertVariable = (variableName: string) => {
    const textarea = document.getElementById("html-editor") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = htmlBody
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = `${before}{{${variableName}}}${after}`
      setHtmlBody(newText)
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus()
        const newPos = start + variableName.length + 4
        textarea.setSelectionRange(newPos, newPos)
      }, 0)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/messaging" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Templates
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <EnvelopeIcon className="h-6 w-6" />
              {template.name}
            </h1>
            <p className="text-muted-foreground mt-1">{template.description}</p>
          </div>
        </div>
        
        {hasChanges && (
          <Badge variant="outline" className="mt-2 text-amber-600 border-amber-600">
            Unsaved changes
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <TemplateEditor
          template={template}
          subject={subject}
          htmlBody={htmlBody}
          enabled={enabled}
          hasChanges={hasChanges}
          saving={saving}
          onSubjectChange={setSubject}
          onHtmlBodyChange={setHtmlBody}
          onEnabledChange={setEnabled}
          onSave={handleSave}
          onReset={() => setResetDialogOpen(true)}
          onSendTest={() => setTestDialogOpen(true)}
          onInsertVariable={handleInsertVariable}
        />

        {/* Preview Panel */}
        <TemplatePreview
          preview={preview}
          loading={previewLoading}
        />
      </div>

      {/* Test Email Dialog */}
      <TestEmailForm
        templateKey={templateKey}
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
      />

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              Reset Template
            </DialogTitle>
            <DialogDescription>
              This will replace the current template with the default version. Any customizations will be lost. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? "Resetting..." : "Reset to Default"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
