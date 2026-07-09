import { homepageContent } from '@/content/homepage'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { exploreArtistsContent } from '@/content/explore-artists'
import { shopFaqGroups } from '@/content/shop-faq'
import { seoBlogArticles } from '@/content/seo-blog-articles'
import { seoCategoryPages } from '@/content/seo-category-pages'
import { streetCollectorContent } from '@/content/street-collector'
import type {
  BannerCopy,
  FieldCopy,
  FormMessageCopy,
  HeroCopy,
  NoticeCopy,
  ValueCardCopy,
} from '@/content/site/types'

type MembershipPageContent = {
  hero: HeroCopy
  notices: {
    cancelled: NoticeCopy
    alreadyMember: NoticeCopy
  }
  labels: {
    currentPlan: string
    currentPlanBadge: string
    priceSuffix: string
    creditsPerMonth: (credits: number, valueUsd: number) => string
    processing: string
    switchToTier: (tierName: string) => string
  }
  benefits: {
    title: string
    items: ValueCardCopy[]
  }
  faq: {
    title: string
    items: Array<{ question: string; answer: string }>
  }
  finalCta: {
    title: string
    body: string
    buttonLabel: string
  }
}

type ForBusinessPageContent = {
  hero: HeroCopy
  tabs: Array<{ id: 'gifting' | 'hospitality' | 'offices' | 'galleries'; label: string }>
  messages: {
    success: {
      title: string
      giftingBody: string
      contactBody: string
    }
    errorFallback: string
  }
  gifting: {
    title: string
    discountTiers: Array<{ discount: string; minAmount: string }>
    cardValueLabel: string
    customCardValue: FieldCopy
    employeesLabel: string
    uploadCsvLabel: string
    emailsPlaceholder: string
    company: FieldCopy
    sendWhenLabel: string
    sendTodayLabel: string
    sendNowLabel: string
    giftMessage: FieldCopy
    submit: FormMessageCopy
  }
  contact: {
    intro: string
    fields: {
      name: FieldCopy
      companyName: FieldCopy
      desiredTiles: FieldCopy
      email: FieldCopy
      phone: FieldCopy
      additionalInfo: FieldCopy
    }
    submit: FormMessageCopy
  }
}

type ArtistSubmissionsPageContent = {
  hero: HeroCopy
  intro: {
    body: string[]
    howToTitle: string
    howToSteps: string[]
    lookingForTitle: string
    lookingForItems: string[]
    closing: string
  }
  form: {
    fields: {
      name: FieldCopy
      email: FieldCopy
      instagram: FieldCopy
      portfolio: FieldCopy
      message: FieldCopy
    }
    messages: FormMessageCopy
  }
}

type ContactPageContent = {
  hero: HeroCopy
  sidebar: {
    emailTitle: string
    emailBody: string
    hoursTitle: string
    hoursBody: string
    hoursHint: string
    dataTitle: string
    dataBody: string
  }
  form: {
    fields: {
      name: FieldCopy
      email: FieldCopy
      subject: FieldCopy
      message: FieldCopy
    }
    messages: {
      success: NoticeCopy
      error: (contactEmail: string) => string
      submitIdle: string
      submitLoading: string
    }
  }
}

type AccountPageContent = {
  signedOut: {
    hero: HeroCopy
    primaryCta: string
    secondaryCta: string
  }
  header: {
    title: string
    secondaryCta: string
    logout: string
  }
  tabs: {
    orders: string
    profile: string
  }
  orders: {
    empty: BannerCopy
    cta: string
    shippingAddressTitle: string
    loadMore: string
    loadingMore: string
  }
  profile: {
    title: string
    fields: {
      email: FieldCopy
      firstName: FieldCopy
      lastName: FieldCopy
      phone: FieldCopy
    }
    submit: string
    addresses: {
      title: string
      body: string
      edit: string
      delete: string
      add: string
    }
  }
}

type CareersPageContent = {
  hero: HeroCopy
  portal: {
    ctaLabel: string
    redirectNotice: string
  }
  fallback: {
    body: string
    ctaLabel: string
  }
}

type WholesalePageContent = {
  hero: HeroCopy
  intro: string
  details: {
    title: string
    intro: string
    items: string[]
    ctaLabel: string
  }
  partnerReasons: {
    title: string
    items: string[]
    notes: string[]
  }
}

type CollabPageContent = {
  hero: HeroCopy
  pitch: {
    title: string
    body: string
  }
  steps: Array<{ title: string; body: string }>
  apply: {
    eyebrow: string
    title: string
    body: string
    createAccountCta: string
    signInCta: string
  }
}

type CartPageContent = {
  empty: BannerCopy & { ctaLabel: string }
  header: {
    title: string
    cancelled: string
    browseCta: string
  }
  actions: {
    clearCart: string
    removeItem: string
    decreaseQuantity: string
    increaseQuantity: string
  }
  credits: {
    discountLabel: string
    useCredits: string
    available: (credits: number) => string
    using: (credits: number) => string
    savePrompt: (credits: number, amountUsd: number) => string
    earnTitle: string
    earnBody: (credits: number, amountUsd: number) => string
    memberCta: string
    fullyCovered: string
  }
}

type ArtistsPageContent = {
  hero: HeroCopy
  counts: {
    artwork: string
    artworks: string
    empty: string
  }
}

type ProductsPageContent = {
  header: {
    eyebrow: string
    defaultTitle: string
    backToAll: string
  }
  error: {
    title: string
    body: string
    goHome: string
    tryAgain: string
  }
  series: {
    title: string
    viewAll: string
    artworksSuffix: string
  }
  empty: BannerCopy & { ctaLabel: string }
  counts: {
    showing: (count: number) => string
    page: (page: number) => string
    previous: string
    next: string
  }
}

type ExperienceV3TrustItem = {
  label: string
  icon: 'shipping' | 'returns' | 'guarantee'
}

type ExperienceV3PageContent = {
  infoTabs: {
    ariaLabel: string
    faqCta: string
  }
  trustRow: string
  trustItems: ExperienceV3TrustItem[]
  checkoutPillLabel: (total: string) => string
  stickyAddPanel: {
    lampFallback: string
    artworkFallback: string
    artworkOnly: string
    soldOut: string
    addWithLamp: (price: string) => string
    addArtwork: string
    /** When the Street Lamp is already in the cart — encourage adding another edition. */
    lampInCartHint: string
    addEditionToCollection: string
    /** Edition-only mobile add CTA, e.g. "Add edition 1/44" (price shown in the price column). */
    addEdition: string
    addEditionWithEdition: (edition: string) => string
    /** Split CTA for edition reserve — edition portion renders as an in-button badge. */
    addArtworkEditionToCart: {
      prefix: string
      suffix: string
    }
    addEditionWithPrice: (price: string) => string
    /** @deprecated Prefer addEditionWithEdition — price belongs in the price column only. */
    addEditionWithEditionAndPrice: (edition: string, price: string) => string
  }
  bundleCard: {
    bundleTag: string
    /** Personalized to the artist currently being previewed, e.g. "The Jane Doe Lamp". */
    bundleName: (artistName: string) => string
    /** Shown when bundle (lamp + artwork) mode is selected — no lamp in cart yet. */
    descriptionWithLamp: (artistName: string) => string
    /** Shown when artwork-only mode is selected. */
    descriptionArtworkOnly: string
    lampLabel: string
    artworkFallback: string
    addBundle: string
    addBundleWithPrice: (price: string) => string
    artworkOnly: string
    toggleLabel: string
    toggleAddLamp: string
    hintWithLamp: string
    hintArtworkOnly: string
    priceSuffixBundle: string
    priceSuffixArtwork: string
    addArtwork: string
    addArtworkWithPrice: (price: string) => string
  }
}

export const storePageContent = {
  home: homepageContent,
  homeV2: homeV2LandingContent,
  streetCollector: streetCollectorContent,
  exploreArtists: exploreArtistsContent,
  faq: shopFaqGroups,
  seo: {
    blogArticles: seoBlogArticles,
    categoryPages: seoCategoryPages,
  },
  membership: {
    hero: {
      title: 'Membership for collectors',
      subtitle: 'Get member pricing, monthly credits, and earlier access to limited editions.',
    },
    notices: {
      cancelled: { body: 'Checkout was cancelled. Select a tier below to try again.' },
      alreadyMember: { body: 'You are already a member.' },
    },
    labels: {
      currentPlan: 'Current plan',
      currentPlanBadge: 'Current plan',
      priceSuffix: '/month',
      creditsPerMonth: (credits: number, valueUsd: number) => `${credits} credits/month ($${valueUsd} value)`,
      processing: 'Processing...',
      switchToTier: (tierName: string) => `Switch to ${tierName}`,
    },
    benefits: {
      title: 'Why join',
      items: [
        {
          title: 'Credits that grow',
          body: 'Your subscription credits gain value over time. Holding them longer increases what they cover.',
        },
        {
          title: 'Early access',
          body: 'Get in early on limited edition drops and member-only releases.',
        },
        {
          title: 'Member pricing',
          body: 'Get pricing and promotions reserved for active members.',
        },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          question: 'How do credits work?',
          answer:
            'Credits are deposited monthly and can be used towards any purchase. 10 credits = $1 at checkout. Credits from your subscription gain value over time, so holding them longer increases what they cover.',
        },
        {
          question: 'Can I change my tier?',
          answer:
            'Yes. You can upgrade or downgrade anytime. Upgrades are prorated and include an added credit top-up. Downgrades take effect at the next billing cycle.',
        },
        {
          question: 'What happens to my credits if I cancel?',
          answer:
            'Your credits remain in your account even after cancellation. You can use them anytime, though they will not appreciate without an active subscription.',
        },
      ],
    },
    finalCta: {
      title: 'Start when you are ready',
      body: 'Join thousands of collectors and get member pricing, credits, and early access.',
      buttonLabel: 'Start with Curator',
    },
  } satisfies MembershipPageContent,
  forBusiness: {
    hero: {
      title: 'For business',
      subtitle: 'Business packages with bulk pricing and direct support.',
    },
    tabs: [
      { id: 'gifting', label: 'Gifting' },
      { id: 'hospitality', label: 'Hospitality' },
      { id: 'offices', label: 'Office' },
      { id: 'galleries', label: 'Galleries' },
    ],
    messages: {
      success: {
        title: 'Your request is in',
        giftingBody: 'Our B2B team will reach out soon with next steps.',
        contactBody: 'One of our experts will get in touch soon.',
      },
      errorFallback: 'Please try again.',
    },
    gifting: {
      title: 'Digital gift cards with bulk pricing',
      discountTiers: [
        { discount: '5% off', minAmount: '₪5,600+' },
        { discount: '10% off', minAmount: '₪11,100+' },
        { discount: '15% off', minAmount: '₪36,700+' },
      ],
      cardValueLabel: 'Choose a card value',
      customCardValue: { label: 'Custom', placeholder: 'e.g. ₪500' },
      employeesLabel: 'Employees to be gifted',
      uploadCsvLabel: 'Upload CSV',
      emailsPlaceholder: 'Add emails',
      company: { label: 'Company', placeholder: 'Company name' },
      sendWhenLabel: 'When should we send the gift card?',
      sendTodayLabel: 'Today',
      sendNowLabel: 'Now',
      giftMessage: { label: 'Gift message (optional)', placeholder: 'Add a personal note for recipients' },
      submit: {
        submitIdle: 'Submit B2B gift card request',
        submitLoading: 'Submitting...',
      },
    },
    contact: {
      intro: 'Fill out this form and one of our experts will get in touch soon.',
      fields: {
        name: { label: 'Your name *', placeholder: 'Your name' },
        companyName: { label: 'Company name *', placeholder: 'Company name' },
        desiredTiles: { label: 'Desired amount of tiles *', placeholder: 'e.g. 50' },
        email: { label: 'Email *', placeholder: 'your@email.com' },
        phone: { label: 'Phone number', placeholder: '+1 234 567 8900' },
        additionalInfo: { label: 'Additional information', placeholder: 'Tell us about your project or requirements' },
      },
      submit: {
        submitIdle: 'Send message',
        submitLoading: 'Sending...',
      },
    },
  } satisfies ForBusinessPageContent,
  artistSubmissions: {
    hero: { title: 'Submit your work' },
    intro: {
      body: [
        'We look for artists with a clear point of view and work that holds up beyond a single image. If your practice fits the Street Collector roster, send it through. We review both emerging and established artists.',
      ],
      howToTitle: 'How to get involved',
      howToSteps: [
        'Submit your details: Send your portfolio and a short note about your work.',
        'Watch for open calls: Some editions and features are built through specific calls or competitions.',
        'If selected: We will reach out about fit, timing, and how the work would enter the collection.',
      ],
      lookingForTitle: "What we're looking for",
      lookingForItems: [
        'A distinct visual language.',
        'Work that still feels strong in edition form.',
        'Artists with a real practice behind the images.',
      ],
      closing: 'If the work feels right for the platform, we want to see it.',
    },
    form: {
      fields: {
        name: { label: 'Name', placeholder: 'Your name' },
        email: { label: 'E-mail', placeholder: 'your@email.com' },
        instagram: { label: 'Instagram', placeholder: '@yourhandle' },
        portfolio: { label: 'Portfolio site (if you have one)', placeholder: 'https://' },
        message: {
          label: 'Message',
          placeholder: 'Tell us about your practice, what drives the work, and why it fits the Street Lamp collection.',
        },
      },
      messages: {
        successTitle: 'Submission received',
        successBody: "We'll review it and get back to you if there's a fit.",
        errorFallback: 'Please try again.',
        submitIdle: 'Send message',
        submitLoading: 'Sending...',
      },
    },
  } satisfies ArtistSubmissionsPageContent,
  contact: {
    hero: {
      title: 'Contact Us',
      subtitle:
        'If you need help with an order, have a question about the collection, or need the right person, write to us here.',
    },
    sidebar: {
      emailTitle: 'Email',
      emailBody: 'Usually the fastest way to reach us. We aim to reply within one business day.',
      hoursTitle: 'Support Hours',
      hoursBody: 'Monday to Friday: 8am – 8:30pm',
      hoursHint: 'Typical response time: within 24 hours',
      dataTitle: 'Personal Data Requests',
      dataBody:
        'You can also use this inbox for personal data requests covered by our Privacy Notice. If your message is for our Data Protection Officer, include "DPO" in the subject line.',
    },
    form: {
      fields: {
        name: { label: 'Name', placeholder: 'Your name' },
        email: { label: 'Email', placeholder: 'your@email.com' },
        subject: { label: 'Subject', placeholder: 'What is this about?' },
        message: { label: 'Message', placeholder: "Tell us what's on your mind..." },
      },
      messages: {
        success: { body: "✓ Message received. We'll get back to you soon." },
        error: (contactEmail: string) => `We could not send your message. Please email us directly at ${contactEmail}`,
        submitIdle: 'Send message',
        submitLoading: 'Sending...',
      },
    },
  } satisfies ContactPageContent,
  artists: {
    hero: {
      title: 'Our Artists',
      subtitle: 'Meet the artists behind the limited editions',
    },
    counts: {
      artwork: 'artwork',
      artworks: 'artworks',
      empty: 'No artists found',
    },
  } satisfies ArtistsPageContent,
  products: {
    header: {
      eyebrow: 'Products',
      defaultTitle: 'All Artworks',
      backToAll: 'Back to all artworks',
    },
    error: {
      title: 'Shop Unavailable',
      body:
        'Unable to load products from the store. This may be due to a configuration issue with the Shopify Storefront API.',
      goHome: 'Go Home',
      tryAgain: 'Try Again',
    },
    series: {
      title: 'Browse by Series',
      viewAll: 'View all series',
      artworksSuffix: 'artworks',
    },
    empty: {
      title: 'No artworks found',
      body: 'Try different filters or a different search term',
      ctaLabel: 'View all artworks',
    },
    counts: {
      showing: (count: number) => `Showing ${count} ${count === 1 ? 'product' : 'products'}`,
      page: (page: number) => `Page ${page}`,
      previous: 'Previous',
      next: 'Next',
    },
  } satisfies ProductsPageContent,
  experienceV3: {
    infoTabs: {
      ariaLabel: 'Product information',
      faqCta: 'Full FAQ',
    },
    trustRow: 'Free worldwide shipping · 30-day returns · 12-month guarantee',
    trustItems: [
      { label: 'Free worldwide shipping', icon: 'shipping' },
      { label: '30-day returns', icon: 'returns' },
      { label: '12-month guarantee', icon: 'guarantee' },
    ],
    checkoutPillLabel: (total) => `Checkout · $${total}`,
    stickyAddPanel: {
      lampFallback: 'Lamp',
      artworkFallback: 'Artwork',
      artworkOnly: 'Artwork only',
      soldOut: 'Sold out',
      addWithLamp: (price) => `Add — $${price} with lamp`,
      addArtwork: 'Add to collection',
      lampInCartHint: 'Your Street Lamp is in the cart — add this edition to grow your collection.',
      addEditionToCollection: 'Add to collection',
      addEdition: 'Add edition',
      addEditionWithEdition: (edition) => `Add edition ${edition}`,
      addArtworkEditionToCart: {
        prefix: 'Add Artwork edition ',
        suffix: ' to Cart',
      },
      addEditionWithPrice: (price) => `Add edition — $${price}`,
      addEditionWithEditionAndPrice: (edition, price) => `Add edition ${edition} — $${price}`,
    },
    bundleCard: {
      bundleTag: 'Complete your setup',
      bundleName: (artistName) => `Lamp + ${artistName}`,
      descriptionWithLamp: (artistName) =>
        `Get the Street Lamp with this piece from ${artistName} — everything you need to light and display it at home.`,
      descriptionArtworkOnly:
        'Already have a Street Lamp? Add just the artwork print for your collection.',
      lampLabel: 'Street Lamp',
      artworkFallback: 'Your print',
      addBundle: 'Add lamp + artwork',
      addBundleWithPrice: (price) => `Add lamp + artwork — $${price}`,
      artworkOnly: 'Artwork only',
      toggleLabel: 'How are you collecting?',
      toggleAddLamp: 'Lamp + artwork',
      hintWithLamp: 'Recommended — includes the Street Lamp to light this edition.',
      hintArtworkOnly: 'Print only — for collectors who already own a Street Lamp.',
      priceSuffixBundle: ' lamp + artwork',
      priceSuffixArtwork: ' artwork only',
      addArtwork: 'Add artwork only',
      addArtworkWithPrice: (price) => `Add artwork only — $${price}`,
    },
  } satisfies ExperienceV3PageContent,
  account: {
    signedOut: {
      hero: {
        title: 'Sign in to your account',
        subtitle: 'View orders, saved addresses, and profile details.',
      },
      primaryCta: 'Sign In',
      secondaryCta: 'Browse collection',
    },
    header: {
      title: 'My Account',
      secondaryCta: 'Browse collection',
      logout: 'Logout',
    },
    tabs: {
      orders: 'Order History',
      profile: 'Profile',
    },
    orders: {
      empty: {
        title: 'No orders yet',
        body: 'Your orders will appear here after your first purchase.',
      },
      cta: 'Browse collection',
      shippingAddressTitle: 'Shipping Address',
      loadMore: 'Load more orders',
      loadingMore: 'Loading...',
    },
    profile: {
      title: 'Profile details',
      fields: {
        email: { label: 'Email', hint: 'Email cannot be changed' },
        firstName: { label: 'First name', placeholder: 'Enter first name' },
        lastName: { label: 'Last name', placeholder: 'Enter last name' },
        phone: { label: 'Phone', placeholder: 'Enter phone number' },
      },
      submit: 'Save Changes',
      addresses: {
        title: 'Saved Addresses',
        body: 'Add and manage your addresses here so checkout is faster next time.',
        edit: 'Edit',
        delete: 'Delete',
        add: 'Add Address',
      },
    },
  } satisfies AccountPageContent,
  careers: {
    hero: {
      title: 'Join Street Collector',
      subtitle:
        "We're building a team that believes art belongs in the physical world, not only on screens. If you care about contemporary art and the work of bringing it into people's homes, we want to hear from you.",
    },
    portal: {
      ctaLabel: 'View Open Positions',
      redirectNotice: "You'll be redirected to our careers portal to browse and apply for open roles.",
    },
    fallback: {
      body:
        "If you think you would work well here, send us a note. We're glad to hear from people who want to help shape what we're building.",
      ctaLabel: 'Email us about careers',
    },
  } satisfies CareersPageContent,
  wholesale: {
    hero: {
      title: 'Wholesale with Street Collector®',
      subtitle: 'Partner with Street Collector for retail and gallery placements.',
    },
    intro:
      'We collaborate with concept stores, museum shops, galleries, and design-led spaces that care about contemporary art and collectible objects.',
    details: {
      title: 'Details to Include',
      intro:
        'If you would like to carry The Street Lamp and selected artist editions in your store, please email us with the following information:',
      items: [
        'Business Name',
        'Contact Person',
        'Business Address',
        'Phone Number',
        'Website or Instagram',
        'Business Type (concept store, museum shop, gallery, online store, etc.)',
        'Estimated Order Quantity',
        'Products of Interest (Lamp only, Lamp + Editions, Specific Artist Drops)',
        'Any Additional Information or Questions',
      ],
      ctaLabel: 'Email wholesale',
    },
    partnerReasons: {
      title: 'Why Partner with Street Collector',
      items: [
        'Limited editions from international artists',
        'A collectible system, not a one-off product',
        'Artist context that helps in-store conversations',
        'Limited production runs',
        'Direct access to upcoming artist drops',
      ],
      notes: [
        'We operate in limited production cycles. Wholesale partnerships are reviewed based on fit with the brand and audience.',
        'New wholesale partners may begin with a reduced minimum order of 30 lamps on their first order, subject to availability.',
        'Shipping available worldwide. Lead times vary depending on edition availability.',
      ],
    },
  } satisfies WholesalePageContent,
  collab: {
    hero: {
      title: 'Collect Culture. Earn With It.',
      subtitle: 'As your impact grows, your commission increases.',
    },
    pitch: {
      title: 'Start with 10% commission.',
      body: 'Stronger partners move into higher tiers and get earlier notice on limited drops.',
    },
    steps: [
      { title: 'Register', body: 'Click the button and register as a collab.' },
      {
        title: 'Share',
        body: "Share your unique collab link on your Facebook, Twitter, Blog, Website, or wherever you'd like!",
      },
      {
        title: 'Get Commissions',
        body: 'Refer to your collabs dashboard and watch your commissions roll in!',
      },
    ],
    apply: {
      eyebrow: 'Street Collector',
      title: 'Limited partner spots available.',
      body: 'To apply, create a Collab account or sign in to your existing one.',
      createAccountCta: 'Create account & apply',
      signInCta: 'Sign in to apply',
    },
  } satisfies CollabPageContent,
  cart: {
    empty: {
      title: 'Your cart is empty',
      body: 'Add an artwork when you are ready.',
      ctaLabel: 'Browse collection',
    },
    header: {
      title: 'Shopping Cart',
      cancelled: 'Checkout was cancelled. Your cart items are still here.',
      browseCta: 'Browse collection',
    },
    actions: {
      clearCart: 'Clear cart',
      removeItem: 'Remove item',
      decreaseQuantity: 'Decrease quantity',
      increaseQuantity: 'Increase quantity',
    },
    credits: {
      discountLabel: 'Credits',
      useCredits: 'Use Credits',
      available: (credits: number) => `${credits.toLocaleString()} available`,
      using: (credits: number) => `Using ${credits.toLocaleString()} credits`,
      savePrompt: (credits: number, amountUsd: number) =>
        `Use ${credits.toLocaleString()} credits to save $${amountUsd.toFixed(2)} on this order`,
      earnTitle: 'Earn credits with every purchase',
      earnBody: (credits: number, amountUsd: number) =>
        `You'll earn ${credits.toLocaleString()} credits ($${amountUsd.toFixed(2)} value) from this order.`,
      memberCta: 'Become a member for monthly credit',
      fullyCovered: 'Your entire order is covered by credits!',
    },
  } satisfies CartPageContent,
} as const
