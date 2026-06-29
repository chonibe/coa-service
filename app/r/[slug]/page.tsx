import { redirect } from "next/navigation"
import { buildExperienceUrl } from "@/lib/shop/collector-route-helpers"

/**
 * Short affiliate link redirect.
 * /r/artist-slug → /shop/experience?artist=artist-slug&ref=artist-slug
 * Use for compact affiliate URLs (e.g. link-in-bio, Instagram).
 */
export default async function AffiliateRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const trimmed = slug.trim()
  redirect(
    buildExperienceUrl({
      artistSlug: trimmed,
      ref: trimmed,
    })
  )
}
