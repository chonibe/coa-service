"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Alert, AlertDescription } from "@/components/ui"
import { EnvelopeIcon, ShieldCheckIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function AuthorizeGmailPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkGmailPermissions()
  }, [])

  const checkGmailPermissions = async () => {
    try {
      setChecking(true)
      
      // Check if user already has Gmail permissions
      const response = await fetch("/api/admin/messaging/check-gmail-permissions")
      
      if (response.ok) {
        const data = await response.json()
        setHasPermission(data.hasPermission)
      }
    } catch (err) {
      console.error("Error checking permissions:", err)
    } finally {
      setChecking(false)
    }
  }

  const requestGmailPermissions = () => {
    // Redirect to OAuth with gmail=true to request Gmail sending scopes
    const authUrl = `/api/auth/google/start?gmail=true&redirect=/admin/messaging`
    window.location.href = authUrl
  }

  if (checking) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (hasPermission) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">
                  Gmail Permissions Granted
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  You already have the necessary Gmail permissions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              Your account is authorized to send test emails through the messaging templates system.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/admin/messaging")}>
                Go to Messaging
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Link 
        href="/admin/messaging" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Messaging
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <EnvelopeIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Gmail Authorization Required</CardTitle>
              <CardDescription>
                Grant permission to send test emails
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                Why is this needed?
              </h3>
              <p className="text-sm text-muted-foreground">
                To send test emails from the Email Templates editor, we need permission to access your Gmail account. 
                This allows you to verify email formatting before templates are used in production.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Permissions Requested:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>gmail.send</strong> - Send emails on your behalf</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>gmail.readonly</strong> - View your email messages (for sync features)</span>
                </li>
              </ul>
            </div>

            <Alert>
              <ShieldCheckIcon className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Privacy Note:</strong> These permissions only allow the admin dashboard to send 
                test emails. Your email content remains private and secure.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={requestGmailPermissions}
              className="flex-1"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Authorize Gmail Access
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/admin/messaging")}
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to Google to grant permissions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
