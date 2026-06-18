import { redirect } from 'next/navigation'

type ExperienceV3AliasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Bookmark alias — canonical experience lives at `/shop/experience`. */
export default async function ExperienceV3AliasPage({ searchParams }: ExperienceV3AliasPageProps) {
  const resolved = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(resolved)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const entry of value) query.append(key, entry)
    } else {
      query.set(key, value)
    }
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  redirect(`/shop/experience${suffix}`)
}
