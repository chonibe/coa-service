import type { Metadata } from 'next'
import { SeoCategoryPage } from '@/components/seo/SeoCategoryPage'
import { seoCategoryPages } from '@/content/seo-category-pages'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'

const page = seoCategoryPages['interchangeable-art-prints']

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: page.metaTitle,
  description: page.description,
  alternates: { canonical: `/${page.slug}` },
}

export default function InterchangeableArtPrintsPage() {
  return <SeoCategoryPage page={page} />
}
