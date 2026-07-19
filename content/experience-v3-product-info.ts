/**
 * Product info tabs for Experience V3 artwork panel.
 * Copy curated from {@link shopFaqGroups} and shop guarantee messaging.
 */

export type ExperienceV3ProductInfoTab = {
  id: string
  label: string
  paragraphs: string[]
  bullets?: string[]
}

/** Artwork print + collector policies shown under the add-to-cart CTA. */
export const experienceV3ArtworkInfoTabs: ExperienceV3ProductInfoTab[] = [
  {
    id: 'materials',
    label: 'Materials',
    paragraphs: [
      'Each print is made for The Street Lamp’s backlit frame — slim, durable, and easy to swap.',
    ],
    bullets: [
      '21.5×14.5×7 cm display size',
      'Premium 1 mm polycarbonate vinyl',
      'High-definition print on lightweight, illumination-friendly stock',
      'Slides in and out of the lamp in seconds — no tools',
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping',
    paragraphs: [],
    bullets: [
      'Approximately 9–15 business days delivery after shipping (customs not included)',
      'Free worldwide shipping — orders ship from our warehouse',
      'Tracking number emailed when your order leaves the warehouse',
    ],
  },
  {
    id: 'edition',
    label: 'Edition',
    paragraphs: [
      'Street Collector releases artworks in limited runs and closes them for good. When an edition is done here, it is done.',
    ],
    bullets: [
      'Typically 44 editions per design',
      'Edition numbers assigned in purchase order',
      'Digital Certificate of Authenticity on our permanent ledger',
      'NFC chip embedded in the artwork for verified provenance',
    ],
  },
  {
    id: 'guarantee',
    label: 'Guarantee',
    paragraphs: [
      'If something is wrong, we handle it. You should not be left negotiating with a dead tracking page and a damaged box.',
    ],
    bullets: [
      '12-month guarantee on The Street Lamp hardware',
      'Easy 30-day returns if it is not what you expected',
      'Authenticity backed by COA and NFC verification on every print',
    ],
  },
]
