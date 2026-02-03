"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Label,
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui"
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface AdminUser {
  id: string
  email: string
  hasGmailPermission: boolean
  isCurrentUser: boolean
  lastAuthorized?: string
}

interface MessagingSettings {
  sender_email: string | null
  sender_user_id: string | null
  last_updated: string | null
}

export default function MessagingSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [settings, setSettings] = useState<MessagingSettings | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load admin users with Gmail permissions
      const usersRes = await fetch("/api/admin/messaging/settings/admin-users")
      if (!usersRes.ok) throw new Error("Failed to load admin users")
      const usersData = await usersRes.json()
      setAdminUsers(usersData.users || [])
      
      // Load current settings
      const settingsRes = await fetch("/api/admin/messaging/settings")
      if (!settingsRes.ok) throw new Error("Failed to load settings")
      const settingsData = await settingsRes.json()
      setSettings(settingsData.settings)
      setSelectedUserId(settingsData.settings?.sender_user_id || null)
    } catch (error: any) {
      toast.error(error.message || "Failed to load messaging settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedUserId) {
      toast.error("Please select an admin user")
      return
    }

    const selectedUser = adminUsers.find(u => u.id === selectedUserId)
    if (!selectedUser?.hasGmailPermission) {
      toast.error("Selected user doesn't have Gmail permissions")
      return
    }

    try {
      setSaving(true)
      
      const res = await fetch("/api/admin/messaging/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_user_id: selectedUserId,
          sender_email: selectedUser.email,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save settings")
      }

      toast.success("Messaging settings saved successfully")
      await loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const usersWithPermission = adminUsers.filter(u => u.hasGmailPermission)
  const usersWithoutPermission = adminUsers.filter(u => !u.hasGmailPermission)

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Link 
        href="/admin/messaging" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Messaging
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Sender Configuration</h1>
        <p className="text-muted-foreground">
          Configure which admin account will be used to send automated emails and test messages.
        </p>
      </div>

      {usersWithPermission.length === 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">No admin users have Gmail permissions</p>
              <p className="text-sm">
                At least one admin must authorize Gmail access before emails can be sent. 
                Click "Authorize Gmail" from the messaging page.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Configuration */}
      {settings?.sender_email && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-base text-green-900 dark:text-green-100">
                  Currently Configured
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Emails are being sent from: <strong>{settings.sender_email}</strong>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {settings.last_updated && (
            <CardContent>
              <p className="text-xs text-green-600 dark:text-green-400">
                Last updated: {new Date(settings.last_updated).toLocaleString()}
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Admin Users Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnvelopeIcon className="h-5 w-5" />
            Select Email Sender
          </CardTitle>
          <CardDescription>
            Choose which admin account will be used to send emails. This account's Gmail permissions will be used for all automated emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {usersWithPermission.length > 0 ? (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Admin Users with Gmail Access</Label>
              <RadioGroup value={selectedUserId || ""} onValueChange={setSelectedUserId}>
                <div className="space-y-3">
                  {usersWithPermission.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={user.id} id={user.id} />
                      <Label 
                        htmlFor={user.id} 
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email}</span>
                          {user.isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                          {settings?.sender_user_id === user.id && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <EnvelopeIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No admin users have authorized Gmail access yet</p>
            </div>
          )}

          {/* Users without permission */}
          {usersWithoutPermission.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium text-muted-foreground">
                Admin Users (No Gmail Access)
              </Label>
              <div className="space-y-2">
                {usersWithoutPermission.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon className="h-4 w-4" />
                      <span>{user.email}</span>
                      {user.isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    {user.isCurrentUser ? (
                      <Link href="/admin/messaging/authorize-gmail">
                        <Button size="sm" variant="outline">
                          Authorize Gmail
                        </Button>
                      </Link>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Not Authorized
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <p>
              <strong>System-wide Setting:</strong> The selected admin account will be used for all automated emails, 
              including order confirmations, shipping updates, and payout notifications.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <p>
              <strong>Token Persistence:</strong> Gmail permissions remain valid even when the admin is logged out. 
              The system uses stored OAuth tokens to send emails.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <p>
              <strong>Revocation:</strong> If the admin revokes Gmail access in their Google Account settings, 
              email sending will fail until a new admin is configured.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <p>
              <strong>Best Practice:</strong> Use a dedicated admin account (e.g., notifications@yourcompany.com) 
              as the email sender to avoid disruption if personal accounts change.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !selectedUserId || usersWithPermission.length === 0}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/messaging")}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
