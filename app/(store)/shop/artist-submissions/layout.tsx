import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artist Submissions',
  description:
    'Submit your portfolio to be featured in The Street Lamp collection. We\'re looking for bold, creative voices who bring raw, powerful art to life.',
}

export default function ArtistSubmissionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
