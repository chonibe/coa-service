import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { children: React.ReactNode; params: Promise<{ seriesId: string }> }

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { seriesId } = await params
  return {
    alternates: {
      canonical: `/shop/series/${encodeURIComponent(seriesId)}`,
    },
  }
}

export default function SeriesDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
