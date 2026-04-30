import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Business - B2B Gifting & Custom Photo Tiles | Street Collector',
  description:
    'Special B2B packages for gifting, hospitality, offices, and galleries. Custom photo tiles with bulk discounts and expert support.',
  alternates: { canonical: '/shop/for-business' },
}

export default function ForBusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
