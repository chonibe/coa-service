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
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from "@/components/ui"
import { 
  EnvelopeIcon, 
  PencilIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  category: string
  subject: string
  enabled: boolean
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  order: "Order",
  shipping: "Shipping",
  payout: "Payout",
  welcome: "Welcome",
}

const CATEGORY_COLORS: Record<string, string> = {
  order: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  payout: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  welcome: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
}

export default function MessagingPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [hasGmailPermission, setHasGmailPermission] = useState<boolean | null>(null)
  const [senderConfigured, setSenderConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    fetchTemplates()
    checkGmailPermissions()
    checkSenderConfiguration()
  }, [])

  const checkSenderConfiguration = async () => {
    try {
      const res = await fetch("/api/admin/messaging/settings")
      if (res.ok) {
        const data = await res.json()
        setSenderConfigured(!!data.settings?.sender_email)
      }
    } catch (error) {
      console.error("Error checking sender configuration:", error)
    }
  }

  const checkGmailPermissions = async () => {
    try {
      const res = await fetch("/api/admin/messaging/check-gmail-permissions")
      if (res.ok) {
        const data = await res.json()
        setHasGmailPermission(data.hasPermission)
      }
    } catch (error) {
      console.error("Error checking Gmail permissions:", error)
    }
  }

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

  const toggleEnabled = async (templateKey: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/messaging/templates/${templateKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      
      if (!res.ok) throw new Error("Failed to update template")
      
      setTemplates(prev => prev.map(t => 
        t.template_key === templateKey ? { ...t, enabled } : t
      ))
      
      toast.success(`Template ${enabled ? "enabled" : "disabled"}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update template")
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, EmailTemplate[]>)

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Templates</h1>
        <p className="text-muted-foreground">
          Manage and customize automated email templates sent to customers and vendors.
        </p>
      </div>

      {/* Email Sender Configuration Alert */}
      {senderConfigured === false && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <ShieldExclamationIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <strong className="font-semibold">Email sender not configured</strong>
                <p className="text-sm mt-1">
                  Please configure which admin account will be used to send automated emails and test messages. 
                  This is required for email functionality to work.
                </p>
              </div>
              <Link href="/admin/messaging/settings">
                <Button size="sm" variant="default" className="whitespace-nowrap">
                  Configure Sender
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Gmail Permission Alert (for current user) */}
      {senderConfigured !== false && hasGmailPermission === false && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <ShieldExclamationIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <strong className="font-semibold">Optional: Authorize your Gmail</strong>
                <p className="text-sm mt-1">
                  You can authorize your Gmail account to be available as an email sender option. 
                  This is optional if another admin has already configured their account.
                </p>
              </div>
              <Link href="/admin/messaging/authorize-gmail">
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  Authorize Gmail
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="shipping">Shipping</SelectItem>
            <SelectItem value="payout">Payout</SelectItem>
            <SelectItem value="welcome">Welcome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates by Category */}
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge className={CATEGORY_COLORS[category] || "bg-gray-100"}>
              {CATEGORY_LABELS[category] || category}
            </Badge>
            <span className="text-muted-foreground text-sm font-normal">
              ({categoryTemplates.length} template{categoryTemplates.length !== 1 ? "s" : ""})
            </span>
          </h2>
          
          <div className="grid gap-4">
            {categoryTemplates.map((template) => (
              <Card key={template.id} className={!template.enabled ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <EnvelopeIcon className="h-5 w-5 text-muted-foreground" />
                        {template.name}
                        {template.enabled ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEnabled(template.template_key, !template.enabled)}
                      >
                        {template.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Link href={`/admin/messaging/${template.template_key}`}>
                        <Button size="sm" className="gap-1">
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Subject: </span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">
                      {template.subject}
                    </code>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date(template.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates found matching your criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
