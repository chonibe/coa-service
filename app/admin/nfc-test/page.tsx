"use client"

import { useState } from "react"




import { CheckCircle, XCircle, Loader2, Tag, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"


import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, AlertTitle, Label } from "@/components/ui"
export default function NFCTestPage() {
  const [tagId, setTagId] = useState("")
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTestNFC = async () => {
    if (!tagId) {
      setError("Please enter a Tag ID")
      return
    }

    setIsLoading(true)
    setError(null)
    setVerificationResult(null)

    try {
      const response = await fetch(`/api/nfc-tags/verify?tagId=${encodeURIComponent(tagId)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()
      setVerificationResult(data)
    } catch (err: any) {
      console.error("Error verifying NFC tag:", err)
      setError(err.message || "Failed to verify NFC tag")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div>
        <Link href="/admin" className="flex items-center text-sm mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">NFC Tag Verification Test</h1>
        <p className="text-muted-foreground mt-2">Test the NFC tag verification process</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Tag ID</CardTitle>
          <CardDescription>Simulate a customer scanning an NFC tag</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-id">Tag ID</Label>
              <Input id="tag-id" placeholder="Enter tag ID" value={tagId} onChange={(e) => setTagId(e.target.value)} />
            </div>
            <Button onClick={handleTestNFC} disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              {isLoading ? "Verifying..." : "Verify Tag"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {verificationResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Verification Result</CardTitle>
            <CardDescription>Results of the NFC tag verification</CardDescription>
          </CardHeader>
          <CardContent>
            {verificationResult.success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>NFC tag is valid and assigned to a certificate.</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>Certificate URL</Label>
                  <Input value={verificationResult.certificateUrl} readOnly />
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>{verificationResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
