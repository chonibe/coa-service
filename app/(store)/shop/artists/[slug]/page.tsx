import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { buildArtistDescription, buildArtistOgTitle, buildArtistTitle } from '@/lib/seo/artist-meta'
import { getCachedArtistProfile } from '@/lib/shop/cached-shop-data'
import { ArtistProfileJsonLd } from '@/components/seo/ArtistProfileJsonLd'
import { streetCollectorContent } from '@/content/street-collector'
import { ArtistPageClient } from './ArtistPageClient'

export const revalidate = 600

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const collections = streetCollectorContent.featuredArtists?.collections ?? []
  const seen = new Set<string>()
  const slugs: string[] = []
  for (const entry of collections) {
    const handle = (entry as { handle?: string }).handle
    if (!handle) continue
    const slug = handle.toLowerCase().trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    slugs.push(slug)
    if (slugs.length >= 40) break
  }
  return slugs.map((slug) => ({ slug }))
}

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ vendor?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sp = await searchParams
  const vendorKey = (sp.vendor ?? '').trim()
  const artist = await getCachedArtistProfile(slug, vendorKey)

  if (!artist) {
    return {
      title: 'Artist | Street Collector',
      description: 'Street art prints and limited editions from independent artists.',
    }
  }

  const title = buildArtistTitle(artist.name)
  const description = buildArtistDescription(artist)
  const ogTitle = buildArtistOgTitle(artist.name)
  const base = getCanonicalSiteOrigin()

  return {
    metadataBase: base,
    title,
    description,
    alternates: { canonical: `/shop/artists/${slug}` },
    openGraph: {
      title: ogTitle,
      description,
      url: `/shop/artists/${slug}`,
      siteName: 'Street Collector',
      type: 'website',
      images: artist.image ? [{ url: artist.image, alt: artist.name }] : undefined,
    },
    twitter: {
      card: artist.image ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description,
      images: artist.image ? [artist.image] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

async function ArtistPageBody({ slug, vendorKey }: { slug: string; vendorKey: string }) {
  const artist = await getCachedArtistProfile(slug, vendorKey)
  if (!artist) notFound()

  return (
    <>
      <ArtistProfileJsonLd artist={artist} />
      <ArtistPageClient artist={artist} slug={slug} />
    </>
  )
}

export default async function ArtistPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const vendorKey = (sp.vendor ?? '').trim()

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#171515] text-white">
          <div className="mx-auto max-w-4xl px-6 py-32 animate-pulse space-y-8">
            <div className="h-10 w-48 rounded bg-white/10" />
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[4/5] rounded bg-white/5" />
              <div className="space-y-4 pt-8">
                <div className="h-16 w-full rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-3/4 rounded bg-white/5" />
              </div>
            </div>
          </div>
        </main>
      }
    >
      <ArtistPageBody slug={slug} vendorKey={vendorKey} />
    </Suspense>
  )
}
