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
      'We work directly with independent street artists.<br/><br/>No stock libraries. No anonymous image feed. When you buy a print, <strong>30% goes to the artist</strong> whose name is on it.',
  },
  featured: {
    eyebrow: 'In the spotlight',
    rotateLabel: 'Changes weekly',
    title: 'In the spotlight.',
    hook: 'Open the full profile, story, and works.',
    ctaLabel: 'Open full profile',
  },
  collection: {
    eyebrow: 'The Collection',
    subtitle:
      'Tap a card for a quick preview, or open the full profile for story, press, and works.',
    emptyHook: 'Open the profile for the story and editions.',
  },
  finalCta: {
    eyebrow: 'Ready when you are',
    titleHtml: 'You&apos;ve met the artists.<br/>Now <em>collect their work.</em>',
    subtitle:
      'Runs stay finite. Every edition is numbered. When a piece sells through here, it is gone from this shelf.',
    primary: 'Start your collection',
    secondary: 'Browse all artists',
  },
  voices: {
    eyebrow: 'Collector Voices',
    titleHtml: 'The work lands<br/><em>in real rooms.</em>',
    ratingCaption: 'Rated 5.0 · 3,000+ collectors',
    items: [
      {
        quote:
          '“I went to look up the artist after the print arrived and lost an hour doing it. Now the lamp feels less like decor and more like a line into someone else’s world.”',
        author: 'Tobias M.',
        location: 'Amsterdam, Netherlands',
      },
      {
        quote:
          '“Knowing someone in another city actually made this changes the way it sits in the room. It stops feeling generic immediately.”',
        author: 'Sarah K.',
        location: 'London, UK',
      },
      {
        quote:
          '“I bought the print because the artist story got to me first. By the time I came back to the image, it already had a place in the room.”',
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
