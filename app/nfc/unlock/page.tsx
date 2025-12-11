import crypto from "crypto"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Shield, ExternalLink } from "lucide-react"

const base64UrlDecode = (input: string) => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4)
  return Buffer.from(padded, "base64").toString()
}

const getSigningSecret = () => {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error("Signing secret is not configured")
  }

  return secret
}

const validateToken = (token: string) => {
  try {
    const [payloadB64, signatureB64] = token.split(".")
    if (!payloadB64 || !signatureB64) return null

    const secret = getSigningSecret()
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64")
    const expectedSigUrl = expectedSig.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

    if (expectedSigUrl !== signatureB64) return null

    const payloadStr = base64UrlDecode(payloadB64)
    const payload = JSON.parse(payloadStr)

    if (payload.exp && Date.now() > payload.exp) return null

    return payload
  } catch (err) {
    console.error("Token validation error:", err)
    return null
  }
}

export default async function NfcUnlockPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams?.token
  if (!token) {
    redirect("/pages/authenticate?error=missing_token")
  }

  const payload = validateToken(token)
  if (!payload) {
    redirect("/pages/authenticate?error=invalid_token")
  }

  const certificateUrl = payload.certificateUrl as string | undefined
  const tagId = payload.tagId as string | undefined
  const artworkName = payload.name as string | undefined

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Artist Unlock</p>
            <h1 className="text-2xl font-semibold">Authenticated Artwork Experience</h1>
          </div>
          {tagId && <Badge variant="outline">Tag: {tagId}</Badge>}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Verified Certificate
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Locked to this tag
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This NFC tag is paired to the certificate. Enjoy the artist’s unlock content and provenance details.
            </p>
            {certificateUrl ? (
              <Button asChild variant="default" className="inline-flex items-center gap-2">
                <Link href={certificateUrl} target="_blank" rel="noopener noreferrer">
                  View Certificate <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Certificate URL not available.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Artist Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The artist can add stories, next drops, and bonus media here. Stay tuned for updates.
            </p>
            {artworkName && <p className="text-sm">Artwork: {artworkName}</p>}
          </CardContent>
        </Card>

        <div className="mt-4 text-xs text-muted-foreground">
          Need help? Rescan the tag or return to{" "}
          <Link href="/pages/authenticate" className="underline">
            authentication
          </Link>
          .
        </div>
      </div>
    </div>
  )
}

