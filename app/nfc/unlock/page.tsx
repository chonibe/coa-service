import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { validateToken } from "@/lib/nfc/token"

import { CheckCircle, Shield, ExternalLink, Image, Video, Music, FileText } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Alert, AlertDescription } from "@/components/ui"
import { SanitizedHtml } from "@/components/SanitizedHtml"

// ---------------------------------------------------------------------------
// Content-block icon helper
// ---------------------------------------------------------------------------
function blockIcon(blockType: string | null) {
  switch (blockType) {
    case "Artwork Image Block":
      return <Image className="h-4 w-4 text-muted-foreground" />
    case "Artwork Video Block":
      return <Video className="h-4 w-4 text-muted-foreground" />
    case "Artwork Audio Block":
      return <Music className="h-4 w-4 text-muted-foreground" />
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
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
  const lineItemId = payload.lineItemId as string | undefined

  // --- Fetch real product data and exclusive content blocks ---
  const supabase = createClient()

  let artworkName: string | undefined
  let productId: string | undefined
  let contentBlocks: any[] = []

  if (lineItemId) {
    const { data: lineItem } = await supabase
      .from("order_line_items_v2")
      .select("name, product_id")
      .eq("line_item_id", lineItemId)
      .maybeSingle()

    if (lineItem) {
      artworkName = lineItem.name
      productId = lineItem.product_id
    }
  }

  if (productId) {
    const { data: benefits } = await supabase
      .from("product_benefits")
      .select(`
        *,
        benefit_types:benefit_type_id (
          name
        )
      `)
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (benefits && benefits.length > 0) {
      contentBlocks = benefits.map((b: any) => ({
        ...b,
        block_type: b.benefit_types?.name || null,
      }))
    }
  }

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

        {/* Certificate card */}
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
              This NFC tag is paired to the certificate. Enjoy the artist&apos;s unlock content and provenance details.
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

        {/* Exclusive content blocks */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              {artworkName ? `Exclusive Content — ${artworkName}` : "Artist Content"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentBlocks.length > 0 ? (
              contentBlocks.map((block: any) => (
                <div key={block.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {blockIcon(block.block_type)}
                    <h3 className="text-sm font-medium">{block.title || "Untitled"}</h3>
                  </div>

                  {/* Text content */}
                  {block.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {block.description}
                    </p>
                  )}

                  {/* Rich text / HTML content */}
                  {block.content_html && (
                    <SanitizedHtml
                      html={block.content_html}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    />
                  )}

                  {/* Image */}
                  {block.block_type === "Artwork Image Block" && block.media_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={block.media_url}
                      alt={block.title || "Image"}
                      className="rounded-lg max-w-full"
                    />
                  )}

                  {/* Video */}
                  {block.block_type === "Artwork Video Block" && block.media_url && (
                    <video
                      src={block.media_url}
                      controls
                      className="rounded-lg max-w-full"
                    />
                  )}

                  {/* Audio */}
                  {block.block_type === "Artwork Audio Block" && block.media_url && (
                    <audio src={block.media_url} controls className="w-full" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No exclusive content available yet. The artist may add stories, bonus media, and next-drop info here soon.
              </p>
            )}
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
