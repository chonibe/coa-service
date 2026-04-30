import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buy a Gift Card',
  description:
    'Give the gift of art. Digital gift cards from The Street Collector are redeemable at checkout when purchasing artwork.',
  alternates: { canonical: '/shop/gift-cards' },
}

export default function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
