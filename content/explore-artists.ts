export type CollectorVoice = {
  quote: string
  author: string
  location: string
}

export type SpotlightPullQuote = {
  /** Optional slug the quote is tied to. When omitted, it is generic editorial copy. */
  artistSlug?: string
  quote: string
  attribution?: string
}

type ExploreArtistsContent = {
  hero: { eyebrow: string; ctaLabel: string }
  philosophy: { eyebrow: string; quoteHtml: string; bodyHtml: string }
  featured: {
    eyebrow: string
    rotateLabel: string
    title: string
    hook: string
    ctaLabel: string
  }
  collection: { eyebrow: string; subtitle: string; emptyHook: string }
  finalCta: {
    eyebrow: string
    titleHtml: string
    subtitle: string
    primary: string
    secondary: string
  }
  voices: {
    eyebrow: string
    titleHtml: string
    ratingCaption: string
    items: CollectorVoice[]
  }
  spotlightPullQuotes: SpotlightPullQuote[]
}

export const exploreArtistsContent: ExploreArtistsContent = {
  hero: {
    eyebrow: 'The Artists',
    ctaLabel: 'Start your collection',
  },
  philosophy: {
    eyebrow: 'Why the artists',
    quoteHtml: '',
    bodyHtml:
      'We work directly with independent street artists. No stock libraries, no middlemen.<br/><br/>When you buy a print, <strong>30% goes to the artist.</strong>',
  },
  featured: {
    eyebrow: 'In the spotlight',
    rotateLabel: 'Rotates weekly',
    title: 'In the spotlight.',
    hook: 'View their complete story and collection.',
    ctaLabel: 'Open full profile',
  },
  collection: {
    eyebrow: 'The Collection',
    subtitle:
      'Tap a card for a quick preview, or open the full profile for story, press, and works.',
    emptyHook: 'Open the profile for their story and editions.',
  },
  finalCta: {
    eyebrow: 'Your Collection Awaits',
    titleHtml: 'You&apos;ve met the artists.<br/>Now <em>collect their work.</em>',
    subtitle:
      'Runs are finite. Each edition is numbered. When a run sells out here, it doesn&apos;t return.',
    primary: 'Start your collection',
    secondary: 'Browse all artists',
  },
  voices: {
    eyebrow: 'Collector Voices',
    titleHtml: 'The story lives<br/><em>in your Street Lamp.</em>',
    ratingCaption: 'Rated 5.0 · 3,000+ collectors',
    items: [
      {
        quote:
          '“I looked up the artist for an hour after my print arrived. Now I follow the whole journey. It’s not a lamp on my desk — it’s a window into someone’s life.”',
        author: 'Tobias M.',
        location: 'Amsterdam, Netherlands',
      },
      {
        quote:
          '“Knowing it was painted by someone in another city makes it feel different on my Street Lamp. There’s a person behind this — and that changes everything.”',
        author: 'Sarah K.',
        location: 'London, UK',
      },
      {
        quote:
          '“I bought the print because the story wrecked me. The image earned its place on my Street Lamp — the story is what convinced me.”',
        author: 'Lucas R.',
        location: 'Paris, France',
      },
    ],
  },
  /**
   * Real pull-quotes keyed by artist slug. Only shown on the featured spotlight
   * when the currently-spotlit artist has a quote here. Otherwise the pull-quote
   * is omitted so the page doesn't fabricate quotes on behalf of artists.
   */
  spotlightPullQuotes: [],
}
