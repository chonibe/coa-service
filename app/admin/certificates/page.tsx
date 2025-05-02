"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Clipboard,
  Check,
  AlertCircle,
  BadgeIcon as Certificate,
  LinkIcon,
  ListIcon,
  Layers,
  Settings,
  Download,
  Clock,
  Smartphone,
} from "lucide-react"
import Link from "next/link"

export default function CertificatesPage() {
  const [lineItemId, setLineItemId] = useState("")
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generateCertificateUrl = async () => {
    if (!lineItemId) {
      setError("Please enter a line item ID")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Call the API to generate and store the certificate URL
      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lineItemId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: Failed to generate certificate URL`)
      }

      const data = await response.json()
      setGeneratedUrl(data.certificateUrl)
      setAccessToken(data.accessToken)
    } catch (err: any) {
      console.error("Error generating certificate URL:", err)
      setError(err.message || "Failed to generate certificate URL")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!generatedUrl) return

    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edition Certificates</h1>
          <p className="text-muted-foreground mt-2">Generate certificate URLs for edition ownership</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <Layers className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/management">
                <Settings className="mr-2 h-4 w-4" />
                Certificate Management
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/bulk">
                <Download className="mr-2 h-4 w-4" />
                Bulk Generation
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/logs">
                <Clock className="mr-2 h-4 w-4" />
                Access Logs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/nfc">
                <Smartphone className="mr-2 h-4 w-4" />
                NFC Tags
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Certificate Tools</h2>
          <Button asChild variant="outline">
            <Link href="/admin/certificates/management">
              <ListIcon className="h-4 w-4 mr-2" />
              Manage All Certificates
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Certificate URL</CardTitle>
            <CardDescription>
              Enter a line item ID to generate a unique certificate URL for that edition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="line-item-id">Line Item ID</Label>
                <Input
                  id="line-item-id"
                  placeholder="Enter line item ID"
                  value={lineItemId}
                  onChange={(e) => setLineItemId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This is the unique identifier for the line item in the order
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {generatedUrl && (
                <Alert>
                  <Certificate className="h-4 w-4" />
                  <AlertTitle>Certificate URL Generated</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 flex items-center gap-2">
                      <Input value={generatedUrl} readOnly className="flex-1" />
                      <Button size="sm" variant="outline" onClick={copyToClipboard} className="min-w-24">
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Clipboard className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={generatedUrl} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="h-4 w-4 mr-1" />
                          Open Certificate
                        </Link>
                      </Button>
                    </div>
                    {accessToken && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Access Token: {accessToken}</p>
                        <p>This token is stored in the database for additional security verification.</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateCertificateUrl} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Certificate URL"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Certificate Generation</CardTitle>
            <CardDescription>Generate certificates for all line items of a specific product</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enter a product ID to generate certificate URLs for all line items associated with that product. This is
              useful for sending certificates to all customers who purchased a specific limited edition.
            </p>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/admin/certificates/bulk">Go to Bulk Generation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NFC Tag Management</CardTitle>
            <CardDescription>Manage NFC tags for certificate URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create, assign, and program NFC tags with certificate URLs. This allows customers to scan physical NFC
              tags to view their certificates.
            </p>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/admin/certificates/nfc">Manage NFC Tags</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificate Access Logs</CardTitle>
            <CardDescription>View logs of certificate access</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track when and how certificates are accessed. This helps monitor usage and detect any unusual activity.
            </p>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/admin/certificates/logs">View Access Logs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
