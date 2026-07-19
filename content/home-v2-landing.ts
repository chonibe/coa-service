import { TRUST_STAT_PLACEHOLDERS } from '@/lib/shop/trust-stat-placeholders'

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
  /** Renders as the large featured story in testimonials (one recommended) */
  featured?: boolean
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
    eyebrow: 'Collect. Insert. Change.',
    headlineHtml: 'A living art<br><em>collection.</em>',
    /** Empty = no hero paragraph under the headline */
    description: '',
    pricingLine: { lampFrom: '$99', artworksFrom: '$40' },
    ctaText: 'Start your collection',
    videoUrl:
      'https://cdn.shopify.com/videos/c/o/v/c4901eca91a14b65813886b586e3b7db.mp4',
    videoPosterUrl:
      'https://cdn.shopify.com/s/files/1/0858/7828/6798/files/street-collector-hero-poster.jpg',
    stats: [
      { label: 'Collectors', target: TRUST_STAT_PLACEHOLDERS.collectors, suffix: '+' },
      { label: 'Artists', target: TRUST_STAT_PLACEHOLDERS.artists, suffix: '+' },
      { label: 'Rated', fixedText: TRUST_STAT_PLACEHOLDERS.ratingText },
      { label: 'Countries', target: TRUST_STAT_PLACEHOLDERS.countries, suffix: '+' },
    ] satisfies LandingStat[],
  },

  trust: [
    'Free worldwide shipping · 9–15 business days',
    '12-month guarantee',
    '30-day returns',
    'Live support · 7am–midnight',
  ],

  meetLamp: {
    eyebrow: 'Meet the Lamp',
    title: 'Built to live\nwith the room.',
    titleEmphasis: 'with the room.',
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
    title: 'Real art,\nworked into the day.',
    titleEmphasis: 'worked into the day.',
    items: [
      {
        tabTitle: 'Collect real artwork.',
        bodyTitle: 'Browse 100+ original works.',
        bodyTitleEmphasis: 'Own a piece of the street.',
        bodyText:
          'Every work here comes from an independent street artist, not a stock library and not a print dump. Editions are numbered, runs stay tight, and once a piece starts disappearing from the shelf, you feel it.',
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
        tabTitle: 'Change the room fast.',
        bodyTitle: 'Set the light.',
        bodyTitleEmphasis: 'Change the room fast.',
        bodyText:
          'One tap shifts the room. Low light pulls out one set of colors, brighter light wakes up another, and swapping the print takes less time than choosing what to play next.',
          details: [],
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/c31886010f654a50a6245dc9ab6cc301.mp4',
      },
      {
        tabTitle: 'Support artists directly.',
        bodyTitle: 'Every purchase goes',
        bodyTitleEmphasis: 'straight to the artist.',
        bodyText:
          'When you collect here, the money does not disappear into layers of gallery math. A real share goes to the artist whose work you brought home, which is the point.',
        details: [
          // Secondary texts removed per design update
        ],
        videoUrl:
          'https://cdn.shopify.com/videos/c/o/v/907f900637204a35850037a1ffbbb70c.mp4',
      },
    ] satisfies Step[],
  },

  artistsWall: {
    eyebrow: 'The Collection',
    title: '100+ Artists.\nFrom Around the World.',
    titleEmphasis: 'From Around the World.',
    ctaLabel: 'View all artists',
    /** Short clips in the carousel above the image grid (deduped URLs) */
    carouselVideos: [
      'https://cdn.shopify.com/videos/c/o/v/4e3914d1963f4f49bc5aa9b30fc28d06.mp4',
      'https://cdn.shopify.com/videos/c/o/v/d1866abf7d814c0ca47346fc5e8b2f5b.mp4',
      'https://cdn.shopify.com/videos/c/o/v/8b97b509d56c4cd7a841f7968918bf60.mp4',
      'https://cdn.shopify.com/videos/c/o/v/00e7a6d054fe4d3795376d830aeb9b5e.mp4',
      'https://cdn.shopify.com/videos/c/o/v/b3fa9166216c452e84cc94cb8f6ba0d6.mp4',
      'https://cdn.shopify.com/videos/c/o/v/dd8871a5486149cb8ac7bcae3be7cbb0.mp4',
      'https://cdn.shopify.com/videos/c/o/v/3d38926d71814b69b1b382614593c2bd.mp4',
      'https://cdn.shopify.com/videos/c/o/v/24afd808e6a8480bad00abd9c938c912.mp4',
      'https://cdn.shopify.com/videos/c/o/v/5544660fcedf42a2a766cbbf076346bb.mp4',
      'https://cdn.shopify.com/videos/c/o/v/f4f288bd1b9847dd802f7f39ef979494.mp4',
      'https://cdn.shopify.com/videos/c/o/v/880d24398a644fb6b4b7e6ddd9e8c42b.mp4',
      'https://cdn.shopify.com/videos/c/o/v/bc8506d404e745468bca0ec56ff7504d.mp4',
      'https://cdn.shopify.com/videos/c/o/v/37381e33d4f847d382991e5daf9e3065.mp4',
      'https://cdn.shopify.com/videos/c/o/v/693b7eeeec4b47afbf7a5e9bdd4f2151.mp4',
      'https://cdn.shopify.com/videos/c/o/v/eeca5f8ad623487eada9cd3c52091052.mp4',
      'https://cdn.shopify.com/videos/c/o/v/a9f4ecd941034b12bbb29242ed29a8a1.mp4',
      'https://cdn.shopify.com/videos/c/o/v/de8d91a33bad4bb38504d1aaf3ce5c24.mp4',
      'https://cdn.shopify.com/videos/c/o/v/32e2e5ae88b94eba82ebc9674c66f092.mp4',
    ],
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
      {
        name: 'Yonil',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/yonil-823611.png',
      },
      {
        name: 'Emelio Cerezo',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/emelio-cerezo-958748.png',
      },
      {
        name: 'Igal Talianski',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/igal-talianski-201541.jpg',
      },
      {
        name: 'Carsten Gueth',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/carsten-gueth-457402.png',
      },
      {
        name: 'Or Bar-El',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/or-bar-el-798628.jpg',
      },
      {
        name: 'Ori Toor',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/ori-toor-182741.png',
      },
      {
        name: 'My Sunbeam',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/my-sunbeam-753804.png',
      },
      {
        name: 'Linda Baritski',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/linda-baritski-899063.png',
      },
      {
        name: 'Erezoo',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/erezoo-944730.jpg',
      },
      {
        name: 'Maalavidaa',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/maalavidaa-941602.png',
      },
      {
        name: 'Psoman',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/psoman-148667.png',
      },
      {
        name: 'Agus Rucula',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/agus-rucula-674348.png',
      },
      {
        name: 'Max Diamond',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/max-diamond-362960.png',
      },
      {
        name: 'Ezra Baderman',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/ezra-baderman-551846.png',
      },
      {
        name: 'Marylou Faure',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/marylou-faure-306934.png',
      },
      {
        name: 'Dima Korma',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/dima-korma-967960.png',
      },
      {
        name: 'Snow Hands World',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/snow-hands-world-674556.png',
      },
      {
        name: 'Bysancho',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/bysancho-373026.png',
      },
      {
        name: 'Alin Mor',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/alin-mor-339783.png',
      },
      {
        name: 'Beto Val',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/beto-val-618237.png',
      },
      {
        name: 'Cokorda Martin',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/cokorda-martin-401664.png',
      },
      {
        name: 'Aviv Shamir',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/aviv-shamir-246294.png',
      },
      {
        name: 'Hen Macabi',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/hen-macabi-716685.jpg',
      },
      {
        name: 'Refiloe Mnisi',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/refiloe-mnisi-622066.png',
      },
      {
        name: 'Geometric Bang',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/geometric-bang-304660.png',
      },
      {
        name: 'Laura Fridman',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/laura-fridman-134465.png',
      },
      {
        name: 'Cubi Boumclap',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/cubi-boumclap-242467.png',
      },
      {
        name: 'Studio Giftig',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/studio-giftig-393838.png',
      },
      {
        name: 'Thales Towers',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/thales-towers-332488.png',
      },
      {
        name: 'Niashtai',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/niashtai-311613.png',
      },
      {
        name: 'Nurit Gross',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/nurit-gross-638445.png',
      },
      {
        name: 'Moshe Gilboa',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/moshe-gilboa-794754.png',
      },
      {
        name: 'Eden Kalif',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/eden-kalif-421492.png',
      },
      {
        name: 'Tiffany Chin',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/tiffany-chin-256609.png',
      },
      {
        name: 'Yoaz',
        imageUrl:
          'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/yoaz-858025.png',
      },
    ] satisfies ArtistTile[],
  },

  bestSellers: {
    eyebrow: 'Best sellers',
    title: 'Collector favorites',
    titleEmphasis: 'On the lamp.',
    collectionHandle: 'season-1',
    productsCount: 16,
    viewAllLabel: 'Browse all artworks',
    viewAllHref: '/experience',
  },

  testimonials: {
    eyebrow: 'What collectors say',
    title: 'Seen in 3,000+\ncollector homes.',
    titleEmphasis: '3,000+',
    /**
     * Fallback only when Yotpo aggregate is unavailable.
     * Live pages prefer `formatReviewRatingLabel` (average + real count).
     */
    ratingLabel: 'Collector reviews',
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
    images: [] satisfies TestimonialImage[],
    texts: [] satisfies TestimonialText[],
  },

  guarantee: [
    {
      icon: '✈',
      title: 'Free Worldwide Shipping',
      body: 'Delivery is on us — most orders arrive within 9–15 business days after shipping (customs not included).',
    },
    {
      icon: '⬡',
      title: '12-Month Guarantee',
      body: 'Your lamp is covered for the first year. If something goes wrong, we fix it with you.',
    },
    {
      icon: '↩',
      title: 'Easy 30-Day Returns',
      body: 'If it is not right for your space, you have 30 days to send it back.',
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
          'Each Street Lamp measures 21.5×14.5×7 cm (about 8.5×5.7×2.8 in) and weighs roughly 1.1 kg (2.4 lb). Compact enough for a desk or shelf, substantial enough to feel like a real design piece.',
      },
      {
        question: 'Is it easy to swap the artworks?',
        answer:
          'Yes. No tools, no clips. Slide one print out, slide the next one in, and you are done in a few seconds.',
      },
      {
        question: 'How long does the charge last?',
        answer:
          'With normal daily use, you should get a few days before it needs to be charged again.',
      },
      {
        question: 'How long does shipping take?',
        answer:
          'Once shipped, delivery takes approximately 9–15 business days (customs not included). You will get tracking once the order is on the way.',
      },
      {
        question: 'Do artwork prices change as editions sell?',
        answer:
          'Yes. As editions move, the remaining works can increase in price, so earlier collectors usually get the best entry point.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Yes. We ship worldwide, and shipping is free.',
      },
    ] satisfies FaqItem[],
  },

  finalCta: {
    title: 'Your room deserves\nreal art.',
    titleEmphasis: 'real art.',
    subtitle:
      'Start with the lamp. Add work over time. Support independent artists across the roster. From $99.',
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
    right: 'Collect. Insert. Change.',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/experience' },
      { label: 'Contact', href: '/' },
    ],
  },
} as const

export type HomeV2LandingContent = typeof homeV2LandingContent
