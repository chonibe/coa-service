import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artist Submissions',
  description:
    'Submit your portfolio for review if you want your work considered for a Street Collector release.',
  alternates: { canonical: '/shop/artist-submissions' },
}

export default function ArtistSubmissionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
