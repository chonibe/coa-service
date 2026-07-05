import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buy a Gift Card',
  description:
    'Digital gift cards for Street Collector, redeemable at checkout for artworks and related products.',
  alternates: { canonical: '/shop/gift-cards' },
}

export default function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
