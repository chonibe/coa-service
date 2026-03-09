import { redirect } from "next/navigation"

/**
 * Short affiliate link redirect.
 * /r/artist-slug → /shop/artists/artist-slug?ref=artist-slug
 * Use for compact affiliate URLs (e.g. link-in-bio, Instagram).
 */
export default async function AffiliateRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const trimmed = slug.trim()
  const encoded = encodeURIComponent(trimmed)
  redirect(`/shop/artists/${encoded}?ref=${encoded}`)
}
