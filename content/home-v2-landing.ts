export type LandingStat = {
  label: string
  target?: number
  suffix?: string
  fixedText?: string
}

export type LampFeature = {
  title: string
  videoUrl: string
}

export type StepDetail = {
  text: string
}

export type Step = {
  tabTitle: string
  bodyTitle: string
  bodyTitleEmphasis?: string
  bodyText: string
  details: StepDetail[]
  videoUrl: string
}

export type ArtistTile = {
  name: string
  imageUrl: string
}

export type TestimonialVideo = {
  author: string
  quote: string
  videoUrl: string
}

export type TestimonialImage = {
  author: string
  quote: string
  imageUrl: string
}

export type TestimonialText = {
  author: string
  quote: string
}

export type GuaranteeItem = {
  icon: string
  title: string
  body: string
}

export type FaqItem = {
  question: string
  answer: string
}

export const homeV2LandingContent = {
  urls: {
    home: '/',
    experience: '/experience',
    /** Public short path; middleware redirects to `/shop/explore-artists`. */
    exploreArtists: '/explore-artists',
    /** Absolute CDN URL for Open Graph / Twitter cards (home-v2 landing metadata). */
    openGraphImageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_8252.png',
  },

  nav: {
    logoImageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535',
    logoAlt: 'Street Collector',
    ctaText: 'Start Collecting',
  },

  hero: {
    eyebrow: 'Revolutionizing Urban Art',
    headlineHtml: '<em>A living art<br>collection.</em>',
    description:
      'A premium backlit lamp with 100+ interchangeable street art prints from artists worldwide. Collect. Swap. Own something truly original.',
    pricingLine: { lampFrom: '$99', artworksFrom: '$40' },
    ctaText: 'Start your collection',
    videoUrl:
      'https://cdn.shopify.com/videos/c/o/v/2b189c367ed04f3f86dce86d120a40d6.mp4',
    videoPosterUrl:
      'https://cdn.shopify.com/s/files/1/0858/7828/6798/files/street-collector-hero-poster.jpg',
    stats: [
      { label: 'Collectors', target: 3000, suffix: '+' },
      { label: 'Artists', target: 100, suffix: '+' },
      { label: 'Rated', fixedText: '★ 5.0' },
      { label: 'Countries', target: 40, suffix: '+' },
    ] satisfies LandingStat[],
  },

  trust: [
    'Free worldwide shipping',
    '12-month guarantee',
    '30-day returns',
    'Live support · 7am–midnight',
  ],

  meetLamp: {
    eyebrow: 'Meet the Lamp',
    title: 'Designed for\n every moment.',
    titleEmphasis: 'every moment.',
    defaultVideoUrl:
      'https://cdn.shopify.com/videos/c/o/v/c605e496caed4a33b8ccbe3c11689bbb.mp4',
    features: [
      {
        title: 'Choose your art',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/c605e496caed4a33b8ccbe3c11689bbb.mp4',
      },
      {
        title: 'Set the light',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/641b66e529c04d84969f55385b986a3e.mp4',
      },
      {
        title: 'Rotate anytime',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/1bdeb33fb073460d9e50a64b49e10089.mp4',
      },
      {
        title: 'Slide it in',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/0347e65039e84d04920d3dffad235bf6.mp4',
      },
      {
        title: 'Mount it',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/25762ae2b9754cae89e1c6590c805061.mp4',
      },
    ] satisfies LampFeature[],
  },

  steps: {
    eyebrow: 'How It Works',
    title: 'Bringing art into\n everyday life.',
    titleEmphasis: 'everyday life.',
    items: [
      {
        tabTitle: 'Collect original Art.',
        bodyTitle: 'Browse 100+ original works.',
        bodyTitleEmphasis: 'Own a piece of the street.',
        bodyText:
          'Every artwork in our collection is a limited edition created by an independent street artist from around the world. Each print is numbered — and as editions sell out, the remaining pieces appreciate in value.',
        details: [
          {
            text: '100+ artists from 40+ countries — Stuttgart, Galicia, Austin, Tel Aviv and beyond.',
          },
          {
            text: 'Limited editions that gain value as they sell out. Collect early.',
          },
          {
            text: 'New artists and artworks added regularly — your collection grows with you.',
          },
        ],
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/dc4d553853cc40b998a292ced715e802.mp4',
      },
      {
        tabTitle: 'Transform any space instantly.',
        bodyTitle: 'Set the light.',
        bodyTitleEmphasis: 'Transform any space instantly.',
        bodyText:
          'One tap. Multiple brightness levels. Colors deepen, details surface as the room changes mood. Swap prints in seconds — no tools, no clips. A living room that changes whenever you do.',
        details: [
          {
            text: 'One tap dimming — multiple brightness levels for morning, evening, night.',
          },
          { text: 'Swap prints in under 10 seconds. No tools. Slide out, slide in — done.' },
          { text: 'Wireless & rechargeable — days of charge, no cables cluttering your space.' },
        ],
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/c31886010f654a50a6245dc9ab6cc301.mp4',
      },
      {
        tabTitle: 'Support Artists directly.',
        bodyTitle: 'Every purchase goes',
        bodyTitleEmphasis: 'straight to the artist.',
        bodyText:
          'Street Collector is built on a simple idea: artists deserve to be paid. Every artwork you collect puts money directly into the hands of the creator — no galleries, no middlemen, no markups.',
        details: [
          { text: 'Direct artist revenue — every sale goes straight to the creator.' },
          { text: 'Discover emerging talent before the rest of the world does.' },
          { text: 'Join 3,000+ collectors in 40+ countries building meaningful art collections.' },
        ],
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/907f900637204a35850037a1ffbbb70c.mp4',
      },
    ] satisfies Step[],
  },

  artistsWall: {
    eyebrow: 'The Collection',
    title: '100+ Artists.\n Every corner of the world.',
    titleEmphasis: 'Every corner of the world.',
    ctaLabel: 'View all artists',
    tiles: [
      {
        name: 'Jérôme Masi',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/jerome-masi-4097333.png',
      },
      {
        name: 'Lidia Cao',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/lidia-cao-1.webp',
      },
      {
        name: 'Moritz Adam Schmitt',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/moritz-adam-schmitt-3945140.jpg',
      },
      {
        name: 'Tyler Shelton',
        imageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/Tyler.png',
      },
      {
        name: 'Marc David Spengler',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/marc-david-spengler-593729.webp',
      },
      { name: 'Kymo One', imageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/Kymo.png' },
      {
        name: 'Twoone',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/twoone_profile.png',
      },
      {
        name: 'Antonia Lev',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/antonia-lev-852291.jpg',
      },
      {
        name: 'Loreta Isac',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/loreta-isac-932659.png',
      },
      {
        name: 'Dawal',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/dawal-617399.jpg',
      },
      {
        name: 'Hedof',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/hedof-248633.png',
      },
      {
        name: 'Taloosh',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/taloosh-805192.webp',
      },
      {
        name: 'Troy Browne',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/troy-browne-333881.png',
      },
      {
        name: 'Elfassi',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/elfassi-618423.png',
      },
    ] satisfies ArtistTile[],
  },

  testimonials: {
    eyebrow: 'What collectors say',
    title: 'Join 3,000+\ncollectors worldwide.',
    titleEmphasis: '3,000+',
    ratingLabel: '5.0 · Verified reviews',
    productImageUrl:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_8252.png',
    videos: [
      {
        author: '@streetcollector_',
        quote: 'Le meilleur combo lampe x visuel 🥵 C’est vraiment canon!',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/1eaf8197dddc4b9f852534a2932d51cb.mp4',
      },
      {
        author: 'Mazarine E.',
        quote: 'I loooooove it! My favorite piece EVER!!',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/481c3eb1bcef489d84d3b69c881c431b.mp4',
      },
      {
        author: 'Yaroslav I.',
        quote: "I honestly haven't seen packaging this well thought out in a long time.",
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/e16722752a44428689d98ffecf6fa016.mp4',
      },
      {
        author: 'Debra G.',
        quote: 'The lamp and artworks are stunning — absolutely exceeded my expectations.',
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/e4c389d4b826457b91d26a849ddb61be.mp4',
      },
    ] satisfies TestimonialVideo[],
    images: [
      {
        author: 'Debra G.',
        quote: 'A unique and unexpected comfort through sometimes daily turmoil.',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/In_an_immensely_difficult_year_where_any_sense_of_ease_or_peace_often_proved_elusive_I_found_th_6.jpg',
      },
      {
        author: 'Gabriel M.',
        quote: 'Every artist involved is astounding.',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/unnamed_4.webp',
      },
      {
        author: 'Haya B.',
        quote: 'The packaging is sooo glamorous.',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/unnamed_1.webp',
      },
    ] satisfies TestimonialImage[],
    texts: [
      {
        author: 'Gabriel M.',
        quote:
          "Everything about it from the design to the concept is just perfect. Through this project, I discovered some truly exceptional artists, and I'm blown away by the talent featured.",
      },
      {
        author: 'Haya B.',
        quote:
          'It is well made, the packaging is sooo glamorous, the design is above and beyond and the ART IS AMAZING!! Definitely worth every penny.',
      },
      {
        author: 'Andiva B.',
        quote:
          'One of my favorite pieces in the apartment! It really adds something special. Friends always notice it and have something nice to say.',
      },
      {
        author: 'Maayan F.',
        quote:
          'Such prestige and chic with this product! Every single bit lovely and lush and the concept innovative. So honored to be in on the first edition.',
      },
    ] satisfies TestimonialText[],
  },

  guarantee: [
    {
      icon: '✈',
      title: 'Free Worldwide Shipping',
      body: 'We cover delivery to any destination. Your collection arrives safely, wherever you are.',
    },
    {
      icon: '⬡',
      title: '12-Month Guarantee',
      body: 'Full coverage on your lamp for the first year. If anything goes wrong, we make it right. No questions asked.',
    },
    {
      icon: '↩',
      title: 'Easy 30-Day Returns',
      body: "Not what you expected? Return within 30 days, no hassle. We're confident you'll love it.",
    },
  ] satisfies GuaranteeItem[],

  faq: {
    eyebrow: 'Questions',
    title: 'Everything you\nneed to know.',
    titleEmphasis: 'need to know.',
    items: [
      {
        question: 'How big are the Street Lamps?',
        answer:
          'The Street Lamps are designed as statement pieces without overwhelming a room — perfectly sized for desks, shelves, and side tables. They make a beautifully proportioned centrepiece in any space.',
      },
      {
        question: 'Is it easy to swap the artworks?',
        answer:
          'Completely effortless. No tools, no clips. Slide the old print out, slide the new one in. The whole process takes under 10 seconds — changing your space really is instant.',
      },
      {
        question: 'How long does the charge last?',
        answer:
          'With normal daily use — on in the morning, off at night — you can expect multiple days of charge before needing to plug in again.',
      },
      {
        question: 'How long does shipping take?',
        answer:
          'Most orders arrive within 5–10 business days. Every order includes full tracking so you can follow your collection on its way.',
      },
      {
        question: 'Do artwork prices change as editions sell?',
        answer:
          'Yes — as an edition sells out, remaining prints increase in value. Early collectors get the best prices. Your collection is both beautiful and a genuine investment in art.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Absolutely — we ship worldwide, completely free, to every destination. Our collectors span 40+ countries.',
      },
    ] satisfies FaqItem[],
  },

  finalCta: {
    title: 'Your room deserves\nreal art.',
    titleEmphasis: 'real art.',
    subtitle:
      'Start with the lamp. Grow your collection. Support independent artists from every corner of the world. From $99.',
    primaryCta: 'Start your collection',
    secondaryCta: 'Explore the artists',
    backgroundImages: [
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/jerome-masi-4097333.png',
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/lidia-cao-1.webp',
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/moritz-adam-schmitt-3945140.jpg',
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/Tyler.png',
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/marc-david-spengler-593729.webp',
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/dawal-617399.jpg',
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/antonia-lev-852291.jpg',
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/hedof-248633.png',
    ],
  },

  footer: {
    left: '© 2026 Street Collector',
    right: 'Revolutionizing the Urban Art World',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/experience' },
      { label: 'Contact', href: '/' },
    ],
  },
} as const

export type HomeV2LandingContent = typeof homeV2LandingContent

