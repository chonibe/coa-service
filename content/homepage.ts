/**
 * Homepage Content
 * 
 * Extracted from Shopify Impact theme templates/index.json
 * This file contains all static content for the homepage sections.
 */

// =============================================================================
// HERO SECTION
// =============================================================================

export const heroSection = {
  video: {
    url: 'https://cdn.shopify.com/videos/c/o/v/C1B48009-95B2-4011-8DA8-E406A128E001.mov',
    autoplay: true,
    size: 'lg', // large video
    externalUrl: 'https://www.youtube.com/watch?v=_9VUPq3SxOc', // fallback
  },
  content: {
    headline: 'One lamp, Endless Inspiration..',
    subheadline: '',
  },
  cta: {
    text: 'Shop Now',
    url: '/shop/street_lamp',
    style: 'outline',
    size: 'lg',
  },
  settings: {
    fullWidth: true,
    allowTransparentHeader: true,
    textColor: '#ffffff',
    overlayColor: '#000000',
    overlayOpacity: 0,
  },
} as const

// =============================================================================
// FEATURED COLLECTIONS
// =============================================================================

export const newReleasesSection = {
  title: 'New Releases',
  collectionHandle: '2025-edition',
  productsCount: 3,
  productsPerRow: {
    mobile: 2,
    desktop: 3,
  },
  showProgressBar: true,
  linkText: 'View all',
  fullWidth: true,
} as const

export const bestSellersSection = {
  title: 'Best Sellers',
  collectionHandle: 'season-1',
  productsCount: 30,
  productsPerRow: {
    mobile: 2,
    desktop: 3,
  },
  showProgressBar: true,
  linkText: 'View all',
  fullWidth: true,
} as const

// =============================================================================
// FEATURED ARTISTS (Collection List)
// =============================================================================

export const featuredArtistsSection = {
  title: 'Featured Artists',
  collectionsPerRow: {
    mobile: 1,
    desktop: 3,
  },
  showProgressBar: true,
  fullWidth: true,
  collections: [
    { handle: 'moritz-adam-schmitt', location: 'Cologne' },
    { handle: 'loreta-isac', location: 'Bucharest' },
    { handle: 'marc-david-spengler', location: 'Stuttgart' },
    { handle: 'dawal', location: 'Paris' },
    { handle: 'antonia-lev-1', location: 'Travelling' },
    { handle: 'hedof', location: 'Breda' },
    { handle: 'taloosh', location: 'Haifa' },
    { handle: 'yonil', location: 'Tel Aviv' },
    { handle: 'troy-browne-1', location: 'Nottingham' },
    { handle: 'elfassi', location: 'Tel Aviv' },
    { handle: 'emelio-cerezo', location: 'Barcelona' },
    { handle: 'igal-talianski', location: 'Herzliya' },
    { handle: 'carsten-gueth', location: 'Stuttgart' },
    { handle: 'or-bar-el', location: 'Haifa' },
    { handle: 'ori-toor', location: 'Tel Aviv' },
    { handle: 'my-sunbeam', location: 'London' },
    { handle: 'linda-baritski', location: 'London' },
    { handle: 'erezoo', location: 'Haifa' },
    { handle: 'maalavidaa', location: 'Montreal' },
    { handle: 'psoman', location: 'Liège' },
    { handle: 'agus-rucula', location: 'Rome' },
    { handle: 'max-diamond', location: 'Pittsburgh' },
    { handle: 'ezra-baderman', location: 'Lisbon' },
    { handle: 'marylou-faure', location: 'Bordeaux' },
    { handle: 'dima-korma', location: 'Berlin' },
    { handle: 'samme-snow', location: 'London' },
    { handle: 'alin-mor', location: 'Haifa' },
    { handle: 'beto-val', location: 'Quito' },
    { handle: 'cokorda-martin', location: 'Bali' },
    { handle: 'aviv-shamir', location: 'Tel Aviv' },
    { handle: 'hen-macabi', location: 'Haifa' },
    { handle: 'refiloe-mnisi', location: 'Johannesburg' },
    { handle: 'geometric-bang', location: 'Florence' },
    { handle: 'laura-fridman', location: 'Tel Aviv' },
    { handle: 'cubi-boumclap', location: 'Antibes' },
    { handle: 'studio-giftig', location: 'Eindhoven' },
    { handle: 'unapaulogetic', location: 'Tel Aviv' },
    { handle: 'thales-towers', location: 'Tel Aviv' },
    { handle: 'nia-shtai', location: 'Tel Aviv' },
    { handle: 'nurit-gross', location: 'Tel Aviv' },
    { handle: 'moshe-gilboa', location: 'Jerusalem' },
    { handle: 'eden-kalif', location: 'Tel Aviv' },
    { handle: 'tiffany-chin', location: 'Toronto' },
    { handle: 'yoaz', location: 'Paris' },
  ],
} as const

// =============================================================================
// PRESS / TESTIMONIALS
// =============================================================================

export const pressQuotesSection1 = {
  fullWidth: true,
  contentSize: 'medium',
  quotes: [
    {
      author: '@cubi_boumclap',
      content: "I really like that you get so much more intimacy with the artists you've chosen. You can really have a relationship with the art. It's like your own personal museum that can live on your night stand next to your bed.",
      rating: 5,
    },
    {
      author: '@mysunbeam',
      content: "I personally got really stoked about this medium because I not only love creating new illustration for print but collecting troves from artists I love. It gets to the point where I have these great prints but too lazy to find the right frame…So seeing this medium where switching out new designs is super easy and the frame is now this gorgeous lit up box, I fell in love with the concept.",
      rating: 5,
    },
    {
      author: '@Emiliocerezo',
      content: "Lately, feeling well at home has become something very important in my life, I'm paying more attention to what I put inside my house, choosing well what kind of objects make me feel well and at peace. Lamps are the principal element to create that feeling.",
      rating: 5,
    },
    {
      author: '@Dimakorma',
      content: "I'm fascinated by how my art interacts with the light, especially watching how abstract forms and textures start to change with the different opacity and temperatures of the lamps light.",
      rating: 5,
    },
    {
      author: '@taloosh.studio',
      content: "It excites me that my design takes on a new use in space, that it's illuminated, and that it becomes an item that's part of the environment rather than separate from it.",
      rating: 5,
    },
    {
      author: '@_marcdavid_',
      content: "I had never worked with light before, creating something illuminated was incredibly exciting. The way the light enhances my work is special as it's suddenly visible even when it's dark around it.",
      rating: 5,
    },
  ],
} as const

export const pressQuotesSection2 = {
  fullWidth: true,
  contentSize: 'medium',
  quotes: [
    {
      author: '@Igaltalianski',
      content: "The Street Lamp has a unique advantage over traditional printing, I can display my art on a light that's not another screen. The lamp's sleek design perfectly complements the digital nature of my art, creating a cohesive and contemporary look. while letting me experiment with different lighting modes.",
      rating: 5,
    },
    {
      author: '@antonialev',
      content: "It is important for me that my works could become part of people's everyday lives. I personally adore aesthetic interiors, creative details in the houses and I believe that the ethics of our actions grows out of the aesthetics of everyday life.",
      rating: 5,
    },
    {
      author: '@psoman_ptk',
      content: "I love the idea of being like a double-sided illuminated canvas. It reminds me of vintage light-up signs! Working on this is an exciting challenge, as I usually work on walls. It definitely puts the artwork in the spotlight.",
      rating: 5,
    },
    {
      author: '@Alinmor',
      content: "A lamp allows light to be exuded through the artwork, which to me, gives a feeling that something beyond its colors and shapes, can be conveyed.",
      rating: 5,
    },
    {
      author: '@maxdiamond52',
      content: "Earlier this year I had these pieces in a gallery show and as they were on the wall I thought these would look even better if the light in the scene could be illuminated from behind. Lo and behold these pieces finally found they light I had been searching for with the Street Lamp.",
      rating: 5,
    },
    {
      author: '@zivsameach',
      content: "Using light is like using the background color. It's like the white of the paper or the wood's color, through which you can feel the empty space that adds depth to the drawing or painting.",
      rating: 5,
    },
  ],
} as const

// =============================================================================
// SCROLLING TEXT
// =============================================================================

export const scrollingTextSection = {
  text: 'One Lamp, Endless Inspiration.',
  textSize: 'small',
  textStyle: 'fill',
  scrollingMode: 'auto',
  scrollingSpeed: 5,
  fullWidth: true,
} as const

// =============================================================================
// FAQ SECTION
// =============================================================================

export const faqSection = {
  title: 'FAQ',
  fullWidth: false,
  items: [
    {
      question: 'Are the artworks interchangeable?',
      answer: 'Absolutely! Imagine the lamp like a record player and the artworks as vinyl records. You can easily collect and swap out the artwork to match your mood or style.',
    },
    {
      question: 'Do you ship overseas?',
      answer: 'Yes, we ship all over the world. Shipping costs will apply, and will be added at checkout. We run discounts and promotions all year, so stay tuned for exclusive deals.',
    },
    {
      question: 'How long will it take to get my orders?',
      answer: "You can expect the first orders to begin shipping in April, as production is still ongoing. Depending on your location, delivery times may vary. We're working hard to ensure everything arrives as quickly and smoothly as possible.",
    },
  ],
} as const

// =============================================================================
// FEATURED PRODUCT
// =============================================================================

export const featuredProductSection = {
  productHandle: 'street_lamp',
  fullWidth: true,
  desktopMediaWidth: 65,
  desktopMediaLayout: 'grid_highlight',
  mobileMediaSize: 'contained',
  enableVideoAutoplay: false,
  enableVideoLooping: false,
  enableImageZoom: false,
  background: '#dad9d5',
  textColor: '#1a1a1a',
} as const

// =============================================================================
// SPLINE 3D VIEWER
// =============================================================================

export const spline3DSection = {
  splineUrl: 'https://my.spline.design/orbarelcopy-AojOo1hFLq0q6UQ0n2RUDDBm/',
  iframeTitle: '3D Product Model',
  position: 'below',
  aspectRatio: 50,
  mobileAspectRatio: 60,
  desktopWidthPercent: 70,
  backgroundColor: '#d7d6d3',
  borderRadius: 0,
  fullWidth: true,
  removeVerticalSpacing: true,
  removeHorizontalSpacing: true,
} as const

// =============================================================================
// VIDEO SECTION (Secondary)
// =============================================================================

export const secondaryVideoSection = {
  video: {
    url: 'https://cdn.shopify.com/videos/c/o/v/StreetLamp_X_MAS_Reel.mov',
    mobileUrl: 'https://cdn.shopify.com/videos/c/o/v/StreetLamp_X_MAS_Reel.mov',
    poster: 'https://cdn.shopify.com/shop_images/L1040753-2_310f05fa-198a-46dc-b1a6-7236604f23f7.jpg',
    autoplay: true,
    size: 'lg',
  },
  settings: {
    fullWidth: false,
    allowTransparentHeader: true,
    textColor: '#ffffff',
    overlayColor: '#000000',
    overlayOpacity: 4,
  },
} as const

// =============================================================================
// URL PARAMETER MODAL (Simply Gift)
// =============================================================================

export const simplyGiftModal = {
  urlParamName: 'ref',
  urlParamValue: 'simplygift',
  autoDismiss: false,
  rememberDismiss: true,
  mediaType: 'video',
  videoUrl: 'https://cdn.shopify.com/videos/c/o/v/9b4e561665cc4bd7b4694df4898de010.mp4',
  videoAutoplay: true,
  videoAspectRatio: '75',
  heading: 'Welcome, Simply Collector!',
  message: "You've been invited to choose a Free artwork for your lamp! Use code <strong>SIMPLYGIFT</strong> at checkout.",
  showCta: true,
  ctaText: 'Explore Collection',
  ctaLink: 'https://thestreetcollector.com/',
  modalMaxWidth: 800,
  modalBackground: '#ffffff',
  modalBorderRadius: 24,
  contentPadding: 40,
  backdropColor: '#ffffff',
  backdropOpacity: 80,
  backdropBlur: 8,
  headingSize: 36,
  headingColor: '#1a1a1a',
  messageSize: 16,
  textColor: '#1a1a1a',
  ctaBackground: '#803cee',
  ctaTextColor: '#ffffff',
  ctaHoverBackground: '#1a3aa8',
  ctaBorderRadius: 60,
} as const

// =============================================================================
// URL PARAMETER BANNER (Simply Gift)
// =============================================================================

export const simplyGiftBanner = {
  urlParameter: 'simplygift',
  message: '🎉 Special offer activated! Use your exclusive voucher code at checkout.',
  showCta: true,
  ctaText: 'Shop now',
  ctaLink: '/collections/season-1',
  dismissible: true,
  alignment: 'center',
  paddingVertical: 20,
  paddingHorizontal: 32,
  fontSize: 16,
  backgroundColor: '#390000',
  textColor: '#ffba94',
  ctaBackgroundColor: '#f0c417',
  ctaTextColor: '#1a1a1a',
  ctaHoverBackgroundColor: '#2c4bce',
  ctaHoverTextColor: '#ffffff',
} as const

// =============================================================================
// PAGE SECTION ORDER
// =============================================================================

export const homepageSectionOrder = [
  'video_hero',           // Hero video with CTA
  'featured_collection',  // New Releases
  'spline_3d',           // 3D Product viewer
  'featured_product',    // Street Lamp product showcase
  'secondary_video',     // Video section
  'press_quotes_1',      // First testimonials carousel
  'best_sellers',        // Best sellers collection
  'featured_artists',    // Artist collection grid
  'scrolling_text',      // Scrolling marquee
  'press_quotes_2',      // Second testimonials carousel
  'faq',                 // FAQ accordion
  'simply_gift_modal',   // URL parameter modal (conditional)
  'simply_gift_banner',  // URL parameter banner (conditional)
] as const

// =============================================================================
// COMBINED HOMEPAGE CONTENT EXPORT
// =============================================================================

export const homepageContent = {
  hero: heroSection,
  newReleases: newReleasesSection,
  bestSellers: bestSellersSection,
  featuredArtists: featuredArtistsSection,
  pressQuotes1: pressQuotesSection1,
  pressQuotes2: pressQuotesSection2,
  scrollingText: scrollingTextSection,
  faq: faqSection,
  featuredProduct: featuredProductSection,
  spline3D: spline3DSection,
  secondaryVideo: secondaryVideoSection,
  simplyGiftModal: simplyGiftModal,
  simplyGiftBanner: simplyGiftBanner,
  sectionOrder: homepageSectionOrder,
} as const

export type HomepageContent = typeof homepageContent
export default homepageContent
