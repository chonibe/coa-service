import { redirect } from "next/navigation"

/**
 * Short redirect for artist experience links.
 * /e/artist-slug → /shop/experience?artist=artist-slug
 * Use in Instagram bios and link-in-bio for compact URLs.
 */
export default async function ArtistExperienceRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const encoded = encodeURIComponent(slug.trim())
  redirect(`/shop/experience?artist=${encoded}`)
}
