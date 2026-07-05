import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Business - B2B Gifting & Custom Photo Tiles | Street Collector',
  description:
    'Business orders for gifting, hospitality, offices, and galleries, with custom pieces and bulk support.',
  alternates: { canonical: '/shop/for-business' },
}

export default function ForBusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
