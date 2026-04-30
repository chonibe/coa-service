/**
 * Blog hero imagery keyed by seo-blog-articles handle.
 * Prefer Shopify CDN collection/brand assets aligned with roster truth.
 */

export interface BlogHeroMedia {
  imageUrl: string
  imageAlt: string
}

export const blogHeroByHandle: Record<string, BlogHeroMedia> = {
  // ── Pilot & high-traffic guides (product-forward when no artist) ─────────
  'how-to-start-collecting-street-art-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/my-sunbeam-753804.png?v=1739630917',
    imageAlt: 'Street Collector backlit lamp displaying interchangeable limited edition artwork',
  },
  'what-is-an-illuminated-art-display': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/my-sunbeam-753804.png?v=1739630917',
    imageAlt: 'Illuminated art display highlighting a Street Collector interchangeable print',
  },
  'what-is-a-backlit-art-lamp': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/my-sunbeam-753804.png?v=1739630917',
    imageAlt: 'Backlit Street Collector lamp with limited edition artwork visible',
  },
  'street-collector-vs-other-art-print-platforms': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/ori-toor-182741.png?v=1739630942',
    imageAlt: 'Bold limited edition artwork representing artist-led editions on Street Collector',
  },
  'gifts-for-street-art-lovers': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/hedof-248633.png?v=1739630833',
    imageAlt: 'Hedof limited edition illustrative artwork suited for gifting',
  },

  // ── Core definitions ────────────────────────────────────────────────────────
  'what-is-a-limited-edition-print': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/loreta-isac-932659.png?v=1739630860',
    imageAlt: 'Loreta Isac limited edition illustrative print—edition clarity for collectors',
  },
  'what-is-a-print-run-in-art': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/moritz-adam-schmitt-3945140.jpg?v=1769930409',
    imageAlt: 'Limited edition artwork where numbering and clarity read at catalogue scale',
  },
  'how-numbered-art-editions-work': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/moritz-adam-schmitt-3945140.jpg?v=1769930409',
    imageAlt: 'Graphic artwork suited to illustrating numbered finite editions',
  },
  'what-is-a-certificate-of-authenticity-for-art': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/marc-david-spengler-593729.webp?v=1739630885',
    imageAlt: 'Editioned collectible artwork emphasizing documentation and authenticity',
  },
  'street-art-prints-vs-posters': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/yonil-823611.png?v=1739631038',
    imageAlt: 'Yonil graphic poster-informed artwork—collector context beyond decor prints',
  },
  'how-to-frame-and-display-street-art-print': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/my-sunbeam-753804.png?v=1739630917',
    imageAlt: 'Alternative display concept: interchangeable print in illuminated Street Collector frame',
  },
  'street-collector-watchlist': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/maalavidaa-941602.png?v=1739630871',
    imageAlt: 'Maalavidaa saturated abstract editions—signals demand for collectible releases',
  },
  'how-to-choose-your-first-artwork-on-street-collector': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/studio-giftig-393838.png?v=1739630994',
    imageAlt: 'Cinematic illustrative edition helping first-time collectors choose impactful work',
  },

  // ── Positioning ─────────────────────────────────────────────────────────────
  'street-art-vs-fine-art': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/dawal-617399.jpg?v=1739630784',
    imageAlt: 'Urban surface-inspired artwork grounding street-informed collecting',
  },
  'swappable-art-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/my-sunbeam-753804.png?v=1739630917',
    imageAlt: 'Swappable interchangeable art print illuminated in Street Collector display',
  },
  'are-limited-edition-prints-worth-it': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/jerome-masi-4097333.png?v=1769930425',
    imageAlt: 'Refined illustrative edition emphasizing considered collecting decisions',
  },

  // ── City guides ───────────────────────────────────────────────────────────
  'tel-aviv-street-art-and-illustration-through-street-collector-artists': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/yonil-823611.png?v=1739631038',
    imageAlt: 'Tel Aviv–cluster graphic artwork on Street Collector (Yonil)',
  },
  'berlin-street-art-artists-street-collector': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/dima-korma-967960.png?v=1739630793',
    imageAlt: 'Berlin roster artist layered urban abstraction—Dima Korma',
  },
  'london-street-art-artists-street-collector': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/marylou-faure-306934.png?v=1739630893',
    imageAlt: 'London cluster bold character illustration—Marylou Faure',
  },
  'melbourne-street-art-artists-street-collector': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/twoone_profile.png?v=1770732172',
    imageAlt: 'Melbourne-connected TWOONE mural-scale practice—profile imagery',
  },
  'amsterdam-street-art-and-illustration-artists': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/hedof-248633.png?v=1739630833',
    imageAlt: 'Netherlands graphic illustration cluster—Hedof',
  },

  // ── Curations ──────────────────────────────────────────────────────────────
  'street-artists-who-work-best-small': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/ori-toor-182741.png?v=1739630942',
    imageAlt: 'Detail-rich illustrative work readable at collectible print scale',
  },
  'international-street-art-prints-collection': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/maalavidaa-941602.png?v=1739630871',
    imageAlt: 'International roster abstract saturated edition',
  },
  'street-art-prints-for-minimalist-interiors': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/jerome-masi-4097333.png?v=1769930425',
    imageAlt: 'Quiet disciplined composition suited to restrained interiors—Jerome Masi',
  },
  'bold-street-art-prints-for-maximalist-spaces': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/niashtai-311613.png?v=1742244420',
    imageAlt: 'High-energy character and color suited to maximal spaces—Nia Shtai',
  },
  'emerging-street-artists-to-collect': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/erezoo-944730.jpg?v=1737452397',
    imageAlt: 'Emerging-roster illustrative street-informed work—Erezoo',
  },

  // ── Artist spotlights (collection imagery per roster slug) ───────────────
  'ori-toor-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/ori-toor-182741.png?v=1739630942',
    imageAlt: 'Ori Toor limited edition artwork detail',
  },
  'moritz-adam-schmitt-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/moritz-adam-schmitt-3945140.jpg?v=1769930409',
    imageAlt: 'Moritz Adam Schmitt bold vector street-poster imagery',
  },
  'hedof-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/hedof-248633.png?v=1739630833',
    imageAlt: 'Hedof illustrative limited edition palette',
  },
  'dawal-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/dawal-617399.jpg?v=1739630784',
    imageAlt: 'Dawal Paris surface surreal micro-scenes',
  },
  'maalavidaa-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/maalavidaa-941602.png?v=1739630871',
    imageAlt: 'Maalavidaa gradient abstract emotional compositions',
  },
  'loreta-isac-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/loreta-isac-932659.png?v=1739630860',
    imageAlt: 'Loreta Isac restrained emotional illustrative work',
  },
  'dima-korma-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/dima-korma-967960.png?v=1739630793',
    imageAlt: 'Dima Korma layered Berlin urban abstraction',
  },
  'studio-giftig-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/studio-giftig-393838.png?v=1739630994',
    imageAlt: 'Studio Giftig cinematic mural realism excerpt',
  },
  'yonil-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/yonil-823611.png?v=1739631038',
    imageAlt: 'Yonil typography and poster-informed Tel Aviv imagery',
  },
  'nia-shtai-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/niashtai-311613.png?v=1742244420',
    imageAlt: 'Nia Shtai saturated character illustration editions',
  },
  'erezoo-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/erezoo-944730.jpg?v=1737452397',
    imageAlt: 'Erezoo illustrative street-informed characters',
  },
  'laura-fridman-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/laura-fridman-134465.png?v=1739630844',
    imageAlt: 'Laura Fridman figurative tense compositions',
  },
  'unapaulogetic-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/unapaulogetic-855065.png?v=1742243496',
    imageAlt: 'Unapaulogetic motion and systems-led graphic editions',
  },
  'jerome-masi-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/jerome-masi-4097333.png?v=1769930425',
    imageAlt: 'Jerome Masi quiet graphic atmosphere',
  },
  /** Off-storefront Shopify product image (Danger Prints)—documented fallback when roster collection lacks a hero crop */
  'iain-macarthur-limited-edition-prints': {
    imageUrl:
      'https://cdn.shopify.com/s/files/1/1944/2387/products/IMG_3873.jpg?v=1554321770',
    imageAlt:
      'Kissing limited edition screen print by Iain MacArthur (sold via Danger Prints; illustrative of the artist visual language)',
  },
}
