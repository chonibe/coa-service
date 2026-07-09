import type { FaqItem, HeroCopy, NoticeCopy } from '@/content/site/types'

type CollectorHelpArticle = {
  id: string
  title: string
  content: string
  category: string
}

type CollectorHelpContent = {
  hero: HeroCopy
  searchPlaceholder: string
  articlesTitle: string
  articles: CollectorHelpArticle[]
  faqTitle: string
  faqs: FaqItem[]
  videoTutorials: {
    title: string
    emptyState: string
  }
  support: {
    title: string
    body: string
    primaryCta: string
    secondaryCta: string
  }
}

type CollectorDiscoverContent = {
  hero: HeroCopy
  highlights: {
    title: string
    empty: string
  }
  emptyResults: string
  loadMore: string
  loading: string
  error: (message: string) => string
}

type CollectorMembershipContent = {
  nonMember: {
    hero: HeroCopy
    ctaLabel: string
  }
  header: HeroCopy & {
    secondaryCta: string
  }
  notices: {
    cancelConfirm: string
    cancelSuccess: string
    cancelError: string
    reactivateSuccess: string
    reactivateError: string
    endingOn: (date: string) => string
    reactivateCta: string
  }
  credits: {
    title: string
    unit: string
    value: (amountUsd: number) => string
    appreciationTitle: string
    appreciationBody: string
  }
  subscription: {
    status: string
    monthlyCredits: string
    nextBilling: string
    changeTier: string
    cancelCta: string
  }
  transactions: {
    title: string
    empty: string
  }
  benefits: {
    title: (tierName: string) => string
  }
  errors: {
    fetchStatus: string
  }
}

type CollectorWatchlistContent = {
  back: string
  hero: {
    title: string
    loadingCounts: string
    counts: (total: number, available: number) => string
    intro: string
  }
  empty: {
    body: string
    cta: string
  }
  item: {
    untitled: string
    stageWhenSaved: (stage: string) => string
    remove: string
    removing: string
  }
  loading: string
}

type CollectorWelcomeContent = {
  claim: {
    title: string
    sentToPrefix: string
    sentToSuffix: string
    body: string
    primaryCta: string
    secondaryCta: string
    profileReady: string
  }
}

type CollectorNotificationsContent = {
  title: string
  errorFallback: string
  loading: string
  emptyTitle: string
  emptyBody: string
}

type CollectorArtistProfileContent = {
  errors: {
    loadArtist: string
    noBio: string
  }
  sections: {
    artworks: string
    series: string
    hiddenGems: string
    hiddenBody: string
    hiddenBadge: string
    hiddenAccess: string
    empty: string
    pieces: (count: number) => string
  }
  links: {
    website: string
    instagram: string
  }
}

type CollectorSeriesDetailContent = {
  errors: {
    loadSeries: string
    backToDashboard: string
  }
  header: {
    byArtist: (name: string) => string
  }
  milestones: Array<{
    type: 'text' | 'image' | 'video'
    title: string
  }>
  about: string
}

type CollectorProductDetailContent = {
  errors: {
    missingArtworkId: string
    loadProduct: string
  }
  labels: {
    byArtist: (name: string) => string
    seriesCard: (name: string) => string
    seriesBadge: string
    openSeries: string
    viewDetails: string
    soldOut: string
    related: string
    locked: string
    piece: (displayOrder: number) => string
  }
}

type CollectorErrorContent = {
  title: string
  body: string
  retry: string
  dashboard: string
}

type CollectorJourneyContent = {
  errors: {
    loadJourney: string
  }
  header: {
    title: (name: string) => string
    body: string
  }
  stats: {
    totalSeries: string
    completed: string
    yourCollection: string
  }
  map: {
    title: string
    bodyWithCollector: string
    bodyDefault: string
  }
  seriesList: {
    title: string
    body: string
    completed: string
    owned: (count: number) => string
    locked: string
    sold: (sold: number, total: number) => string
  }
}

type CollectorAppHomeContent = {
  status: {
    level: (level: number) => string
  }
  recentPurchases: {
    title: string
    viewAll: string
  }
  newReleases: {
    title: string
    viewAll: string
    empty: string
  }
}

type CollectorAppExploreContent = {
  tabs: {
    discover: string
    following: string
  }
  searchPlaceholder: string
  allArtists: string
  empty: string
  loading: string
  priceTba: string
  newBadge: string
}

type CollectorAppProfileContent = {
  fallbackName: string
  levelBadge: (level: number) => string
  credits: {
    label: string
    value: (credits: number) => string
  }
  stats: {
    artworks: string
    verified: string
    artists: string
    series: string
  }
  links: Array<{ label: string; description: string }>
}

type CollectorAppCreditsContent = {
  title: string
  available: string
  totalEarned: string
  totalSpent: string
  perkProgress: string
  proofReward: string
  lampReward: string
  readyToRedeem: string
  spendMore: (percent: number, amount: number) => string
  howItWorks: string
  rules: string[]
}

type CollectorAppSettingsContent = {
  title: string
  items: string[]
}

type CollectorAppInboxContent = {
  tabs: {
    activity: string
    notifications: string
  }
}

export const collectorPageContent = {
  help: {
    hero: {
      title: 'Help Center',
      subtitle: 'Common collector questions, account help, and support details.',
    },
    searchPlaceholder: 'What can we help you with?',
    articlesTitle: 'Account basics',
    articles: [
      {
        id: '1',
        title: 'Account Basics',
        content:
          'Start by browsing, saving, or buying the works you want to keep track of. Purchases add credits to your account, which you can use on InkOGatchi items and a few account extras.',
        category: 'Account Basics',
      },
      {
        id: '2',
        title: 'Understanding Credits and Rewards',
        content:
          'You earn 10 credits for every dollar spent on artworks. Use them on InkOGatchi items, save them, or add more by completing a full series.',
        category: 'Credits',
      },
      {
        id: '3',
        title: 'Setting Up Your InkOGatchi Avatar',
        content:
          'Your InkOGatchi changes as your collection grows. It levels up over time, and you can customize it with items bought using credits.',
        category: 'InkOGatchi',
      },
      {
        id: '4',
        title: 'Authenticating Physical Artworks',
        content:
          'When a physical artwork arrives, scan the NFC tag with your device to verify ownership and open its digital certificate. Each completed authentication adds 500 credits to your account.',
        category: 'Authentication',
      },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        question: 'What are credits?',
        answer:
          'Credits track activity in your account. You earn 10 per dollar spent, then use them on InkOGatchi items or account extras such as proof prints and lamps.',
      },
      {
        question: 'How do I authenticate physical artworks?',
        answer:
          'Physical artworks come with NFC tags. Scan the tag with your device to verify ownership and generate the digital certificate. Each authentication also adds 500 credits.',
      },
      {
        question: 'What happens when I complete a series?',
        answer:
          'Once you collect every artwork in a series, the account adds 1,000 credits automatically. You can track progress in the Series Binder on your dashboard.',
      },
      {
        question: 'How do account extras work?',
        answer:
          'Some account extras become available when your credit total reaches certain thresholds. That page shows what is currently available to claim.',
      },
      {
        question: 'Can I share my collection?',
        answer:
          'Yes. Use the share option on your profile to generate a referral link. If someone signs up through it, both of you receive credits.',
      },
      {
        question: 'How do I contact support?',
        answer:
          'Email support@thestreetcollector.com and we will usually get back to you within one business day. You may also find the answer here first.',
      },
    ],
    videoTutorials: {
      title: 'Video tutorials',
      emptyState: 'Video tutorials are coming soon.',
    },
    support: {
      title: 'Need more help?',
      body: 'If you do not see the answer here, send us a note and we will help directly.',
      primaryCta: 'Email support',
      secondaryCta: 'Back to dashboard',
    },
  } satisfies CollectorHelpContent,
  discover: {
    hero: {
      title: 'Browse Artworks',
    },
    highlights: {
      title: 'New works',
      empty: 'Newly released artworks will appear here.',
    },
    emptyResults: 'No artworks match these filters.',
    loadMore: 'Load more',
    loading: 'Loading…',
    error: (message: string) => `Unable to load marketplace: ${message}`,
  } satisfies CollectorDiscoverContent,
  membership: {
    nonMember: {
      hero: {
        title: 'Become a Member',
        subtitle: 'You do not have an active membership. Join when you want monthly credits and member pricing.',
      },
      ctaLabel: 'View Membership Options',
    },
    header: {
      title: 'Membership',
      subtitle: 'Manage your subscription and credit balance.',
      secondaryCta: 'Browse collection',
    },
    notices: {
      cancelConfirm:
        'Are you sure you want to cancel your subscription? Your credits will remain available.',
      cancelSuccess:
        'Subscription will cancel at end of billing period. You can reactivate anytime before then.',
      cancelError: 'Failed to cancel subscription',
      reactivateSuccess: 'Subscription reactivated!',
      reactivateError: 'Failed to reactivate subscription',
      endingOn: (date: string) => `Your subscription will end on ${date}`,
      reactivateCta: 'Reactivate',
    },
    credits: {
      title: 'Credit Balance',
      unit: 'credits',
      value: (amountUsd: number) => `$${amountUsd.toFixed(2)} value`,
      appreciationTitle: 'Credit Appreciation',
      appreciationBody: 'Hold your credits longer to increase what they cover',
    },
    subscription: {
      status: 'Status',
      monthlyCredits: 'Monthly Credits',
      nextBilling: 'Next Billing',
      changeTier: 'Change Tier',
      cancelCta: 'Cancel Subscription',
    },
    transactions: {
      title: 'Recent Transactions',
      empty: 'No transactions yet',
    },
    benefits: {
      title: (tierName: string) => `Your ${tierName} Benefits`,
    },
    errors: {
      fetchStatus: 'Failed to fetch membership status',
    },
  } satisfies CollectorMembershipContent,
  watchlist: {
    back: 'Back',
    hero: {
      title: 'Edition watchlist',
      loadingCounts: 'Loading…',
      counts: (total: number, available: number) => `${total} saved · ${available} still available`,
      intro: 'We email you when an edition you saved moves to a new stage, once per stage.',
    },
    empty: {
      body: 'Nothing here yet. Browse the experience and tap "Watch this edition" on an edition badge.',
      cta: 'experience',
    },
    item: {
      untitled: 'Edition',
      stageWhenSaved: (stage: string) => `Stage when saved: ${stage}`,
      remove: 'Remove',
      removing: '…',
    },
    loading: 'Loading your list…',
  } satisfies CollectorWatchlistContent,
  welcome: {
    claim: {
      title: 'Claim Your Collection',
      sentToPrefix: 'We sent a sign-in link to',
      sentToSuffix: '.',
      body: 'Check your inbox and click the link to sign in. Your purchases and credits will be linked automatically.',
      primaryCta: 'Sign in with Google Instead',
      secondaryCta: 'Browse collection',
      profileReady: 'Your collection profile is ready.',
    },
  } satisfies CollectorWelcomeContent,
  notifications: {
    title: 'Notifications',
    errorFallback: 'Failed to fetch notifications',
    loading: 'Loading notifications...',
    emptyTitle: 'No notifications yet',
    emptyBody: 'When artists drop new work or your saved editions change stage, updates will appear here.',
  } satisfies CollectorNotificationsContent,
  artistProfile: {
    errors: {
      loadArtist: 'Failed to load artist',
      noBio: 'No bio available.',
    },
    sections: {
      artworks: 'Published Artworks',
      series: 'Series Collections',
      hiddenGems: 'Hidden Gems',
      hiddenBody: 'Hidden or member-gated series. See how these collections open up.',
      hiddenBadge: 'Hidden series',
      hiddenAccess: 'Access is limited. Contact the artist for details.',
      empty: 'No published artworks or series yet.',
      pieces: (count: number) => `${count} ${count === 1 ? 'Piece' : 'Pieces'}`,
    },
    links: {
      website: 'Website',
      instagram: 'Instagram',
    },
  } satisfies CollectorArtistProfileContent,
  seriesDetail: {
    errors: {
      loadSeries: 'Failed to load series',
      backToDashboard: 'Back to dashboard',
    },
    header: {
      byArtist: (name: string) => `by ${name}`,
    },
    milestones: [
      { type: 'text', title: 'Exclusive Text Block' },
      { type: 'image', title: 'Behind-the-Scenes Photos' },
      { type: 'video', title: 'Exclusive Artist Video' },
    ],
    about: 'About This Series',
  } satisfies CollectorSeriesDetailContent,
  productDetail: {
    errors: {
      missingArtworkId: 'Missing artwork id',
      loadProduct: 'Failed to load product',
    },
    labels: {
      byArtist: (name: string) => `By ${name}`,
      seriesCard: (name: string) => `Part of: ${name} Series`,
      seriesBadge: 'Series',
      openSeries: 'Open series',
      viewDetails: 'View details',
      soldOut: 'Sold Out',
      related: 'More from this Series',
      locked: 'Locked',
      piece: (displayOrder: number) => `Piece #${displayOrder + 1}`,
    },
  } satisfies CollectorProductDetailContent,
  errorBoundary: {
    title: 'Unable to load this page',
    body: 'This page hit an error. Try again or return to your collection.',
    retry: 'Try again',
    dashboard: 'My Collection',
  } satisfies CollectorErrorContent,
  journey: {
    errors: {
      loadJourney: 'Failed to load journey',
    },
    header: {
      title: (name: string) => `${name}'s Journey`,
      body: "Follow this artist's series map and see where your collection stands",
    },
    stats: {
      totalSeries: 'Total Series',
      completed: 'Completed',
      yourCollection: 'Your Collection',
    },
    map: {
      title: 'Journey Map',
      bodyWithCollector: "Your progress through this artist's series map is highlighted",
      bodyDefault: "View the artist's full series map",
    },
    seriesList: {
      title: 'All Series',
      body: 'Browse every series in this map',
      completed: 'Completed',
      owned: (count: number) => `Owned (${count})`,
      locked: 'Locked',
      sold: (sold: number, total: number) => `${sold} / ${total} sold`,
    },
  } satisfies CollectorJourneyContent,
  appHome: {
    status: {
      level: (level: number) => `Level ${level}`,
    },
    recentPurchases: {
      title: 'Recent purchases',
      viewAll: 'View all',
    },
    newReleases: {
      title: 'New Releases',
      viewAll: 'Shop all',
      empty: 'No artworks available right now',
    },
  } satisfies CollectorAppHomeContent,
  appExplore: {
    tabs: {
      discover: 'Discover',
      following: 'Following',
    },
    searchPlaceholder: 'Search artworks, artists, series...',
    allArtists: 'All Artists',
    empty: 'No artworks match this search.',
    loading: 'Loading...',
    priceTba: 'Price TBA',
    newBadge: 'New',
  } satisfies CollectorAppExploreContent,
  appProfile: {
    fallbackName: 'Collector',
    levelBadge: (level: number) => `LVL ${level}`,
    credits: {
      label: 'credits',
      value: (credits: number) => `${credits.toLocaleString()} credits`,
    },
    stats: {
      artworks: 'Artworks',
      verified: 'Verified',
      artists: 'Artists',
      series: 'Series',
    },
    links: [
      { label: 'Certifications', description: 'Review artwork certificates and verification status' },
      { label: 'Credits', description: 'Check your balance, membership, and credit activity' },
      { label: 'Extra content', description: 'See the extra content tied to artworks you own' },
      { label: 'Settings', description: 'Update your account details and preferences' },
    ],
  } satisfies CollectorAppProfileContent,
  appCredits: {
    title: 'Credits',
    available: 'Available credits',
    totalEarned: 'Total earned',
    totalSpent: 'Total spent',
    perkProgress: 'Perk Progress',
    proofReward: 'Proof print reward',
    lampReward: 'Lamp reward',
    readyToRedeem: 'Ready to redeem',
    spendMore: (percent: number, amount: number) => `${Math.round(percent)}% — spend $${amount.toFixed(0)} more`,
    howItWorks: 'How credits work',
    rules: [
      'Earn 10 credits per $1 spent on any purchase',
      'Earn 500 credits for each NFC authentication scan',
      'Earn 1,000 credits for completing a series',
      'Earn credits from referrals and occasional events',
    ],
  } satisfies CollectorAppCreditsContent,
  appSettings: {
    title: 'Settings',
    items: ['Edit profile', 'Notification Preferences', 'Privacy & Security', 'Sign out'],
  } satisfies CollectorAppSettingsContent,
  appInbox: {
    tabs: {
      activity: 'Activity',
      notifications: 'Notifications',
    },
  } satisfies CollectorAppInboxContent,
} as const
