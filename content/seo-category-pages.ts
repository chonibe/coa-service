export type SeoCategoryPage = {
  slug: string
  title: string
  metaTitle: string
  description: string
  h1: string
  answer: string
  proof: string[]
  sections: Array<{
    heading: string
    body: string
  }>
  faqs: Array<{
    question: string
    answer: string
  }>
  related: Array<{
    label: string
    href: string
  }>
  relatedArticles?: Array<{
    label: string
    href: string
  }>
}

export const seoCategoryPages: Record<string, SeoCategoryPage> = {
  'backlit-art-lamp': {
    slug: 'backlit-art-lamp',
    title: 'Backlit Art Lamp',
    metaTitle: 'Backlit art lamp for limited edition prints | Street Collector',
    description:
      'Discover the Street Collector backlit art lamp: a rechargeable illuminated display for swappable limited edition street art prints from independent artists.',
    h1: 'Backlit art lamp for living with collectible art',
    answer:
      'Street Collector is a backlit art lamp made for collectors who want physical art that can change over time. Buy the lamp once, then collect and swap limited edition street art prints from independent artists worldwide.',
    proof: [
      'Lamp starts at $99 and artworks start from $40.',
      '100+ artists from cities including Tel Aviv, London, Berlin, Barcelona, Montreal, and beyond.',
      'Eligible artworks include Certificate of Authenticity documentation.',
      'Free worldwide shipping, 12-month guarantee, and 30-day returns where available.',
    ],
    sections: [
      {
        heading: 'Why a backlit lamp changes the artwork',
        body:
          'Backlighting deepens color, reveals detail, and gives the artwork a presence that ordinary framed prints often lose in low light. The lamp turns the print into an object you live with, not just an image on a wall.',
      },
      {
        heading: 'Built for swapping, not replacing',
        body:
          'The lamp is designed around interchangeable prints. As your collection grows, the display stays useful: slide in a new work, rotate the mood of the room, and keep the physical ritual of collecting intact.',
      },
      {
        heading: 'A better fit for street art collectors',
        body:
          'Street art is visual, immediate, and atmospheric. A backlit display gives editioned prints the glow and presence of a small installation while preserving the accessibility of collecting prints.',
      },
    ],
    faqs: [
      {
        question: 'What is a backlit art lamp?',
        answer:
          'A backlit art lamp is an illuminated display that lights artwork from behind. Street Collector uses it as a swappable display for limited edition street art prints.',
      },
      {
        question: 'Can I change the artwork in the lamp?',
        answer:
          'Yes. Street Collector is built around interchangeable artworks, so collectors can swap prints as they collect new editions.',
      },
      {
        question: 'Is this a lamp or an art print marketplace?',
        answer:
          'It is both: a physical illuminated lamp and a platform for collecting limited edition prints from independent artists.',
      },
    ],
    related: [
      { label: 'Shop limited edition prints', href: '/shop/products' },
      { label: 'Explore artists', href: '/shop/explore-artists' },
      { label: 'Interchangeable art prints', href: '/interchangeable-art-prints' },
    ],
    relatedArticles: [
      { label: 'What Is a Backlit Art Lamp?', href: '/shop/blog/what-is-a-backlit-art-lamp' },
      { label: 'Gifts for Street Art Lovers', href: '/shop/blog/gifts-for-street-art-lovers' },
    ],
  },
  'limited-edition-street-art-prints': {
    slug: 'limited-edition-street-art-prints',
    title: 'Limited Edition Street Art Prints',
    metaTitle: 'Limited edition street art prints | Street Collector',
    description:
      'Shop limited edition street art prints by independent artists. Small edition runs, Certificate of Authenticity, worldwide shipping, and display-ready art for the Street Collector lamp.',
    h1: 'Limited edition street art prints from independent artists',
    answer:
      'Street Collector offers limited edition street art prints by independent artists, designed to be collected, displayed in a backlit lamp, or framed like traditional prints. Each edition is finite, with clear artist context and Certificate of Authenticity documentation where eligible.',
    proof: [
      'Editioned works from 100+ independent artists.',
      'Prints are designed for the Street Collector lamp and can also be collected as physical art.',
      'Artist profiles help collectors understand style, location, and practice.',
      'New releases can be linked to artists, collections, and product pages for easy discovery.',
    ],
    sections: [
      {
        heading: 'What makes a print collectible',
        body:
          'Collectibility comes from scarcity, artist authorship, visible quality, documentation, and cultural context. Street Collector combines limited runs with artist stories and collection pages so buyers understand what they are collecting.',
      },
      {
        heading: 'Street art without the gallery barrier',
        body:
          'Limited edition prints give new collectors access to street-influenced work without needing to buy a large original painting. The format keeps the artist voice central while making collecting easier to start.',
      },
      {
        heading: 'How to choose your first print',
        body:
          'Start with the artist, not only the image. Look for a visual language you want to live with, read the artist profile, then check edition details and availability before buying.',
      },
    ],
    faqs: [
      {
        question: 'Are Street Collector prints limited edition?',
        answer:
          'Street Collector focuses on limited edition artworks. Edition details are shown on product pages where available.',
      },
      {
        question: 'Do the prints include a Certificate of Authenticity?',
        answer:
          'Eligible works include Certificate of Authenticity documentation so collectors can preserve edition and provenance information.',
      },
      {
        question: 'Can I display the prints without the lamp?',
        answer:
          'Yes. The lamp is the signature display format, but the prints are physical artworks and can be collected as part of a broader art collection.',
      },
    ],
    related: [
      { label: 'Shop artworks', href: '/shop/products' },
      { label: 'Urban art prints', href: '/urban-art-prints' },
      { label: 'Certificate of Authenticity guide', href: '/shop/blog' },
    ],
    relatedArticles: [
      {
        label: 'How to Start Collecting Street Art Prints',
        href: '/shop/blog/how-to-start-collecting-street-art-prints',
      },
      {
        label: 'Street Art Prints vs Posters',
        href: '/shop/blog/street-art-prints-vs-posters',
      },
      {
        label: 'How Numbered Art Editions Work',
        href: '/shop/blog/how-numbered-art-editions-work',
      },
      {
        label: 'What Is a Certificate of Authenticity for Art?',
        href: '/shop/blog/what-is-a-certificate-of-authenticity-for-art',
      },
    ],
  },
  'urban-art-prints': {
    slug: 'urban-art-prints',
    title: 'Urban Art Prints',
    metaTitle: 'Urban art prints by independent artists | Street Collector',
    description:
      'Browse urban art prints and street-influenced limited editions from independent artists across the world, collected through Street Collector.',
    h1: 'Urban art prints with artist context and collectible editions',
    answer:
      'Street Collector curates urban art prints from independent artists working across illustration, mural culture, graphic art, collage, and contemporary street-influenced styles. The prints are editioned works, not generic wall decor.',
    proof: [
      'Global artist directory with biographies and collection pages.',
      'Artists work across murals, illustration, graphic design, pop art, and contemporary street art.',
      'Prints connect to a physical display system, making the collection easy to rotate.',
      'Collector-friendly trust signals: COA, shipping, guarantee, and returns where available.',
    ],
    sections: [
      {
        heading: 'Urban art is broader than graffiti',
        body:
          'Urban art includes muralists, illustrators, poster artists, digital collage makers, painters, and designers shaped by public space and visual culture. Street Collector reflects that range through artist-led releases.',
      },
      {
        heading: 'Why artist pages matter',
        body:
          'AI and search systems need clear entity signals. Artist pages, biographies, locations, works, and internal links help connect each print to the person and practice behind it.',
      },
      {
        heading: 'Collect by city, style, or mood',
        body:
          'Collectors can explore artists by visual style, geography, and emotional tone. This creates future content clusters around Tel Aviv artists, European muralists, playful illustration, abstract urban art, and more.',
      },
    ],
    faqs: [
      {
        question: 'What are urban art prints?',
        answer:
          'Urban art prints are editioned artworks influenced by street culture, public art, illustration, graffiti, muralism, design, and contemporary visual culture.',
      },
      {
        question: 'Is urban art the same as street art?',
        answer:
          'They overlap, but urban art is often broader. It can include studio work and illustration shaped by the energy, symbols, and visual language of the city.',
      },
      {
        question: 'Where should I start?',
        answer:
          'Start with the artist directory, then explore prints by artists whose style, city, or story feels connected to your space.',
      },
    ],
    related: [
      { label: 'Explore artists', href: '/shop/explore-artists' },
      { label: 'Limited edition street art prints', href: '/limited-edition-street-art-prints' },
      { label: 'Shop artworks', href: '/shop/products' },
    ],
    relatedArticles: [
      {
        label: 'Street Art Prints vs Posters',
        href: '/shop/blog/street-art-prints-vs-posters',
      },
      {
        label: 'How to Start Collecting Street Art Prints',
        href: '/shop/blog/how-to-start-collecting-street-art-prints',
      },
    ],
  },
  'interchangeable-art-prints': {
    slug: 'interchangeable-art-prints',
    title: 'Interchangeable Art Prints',
    metaTitle: 'Interchangeable art prints for a swappable art lamp | Street Collector',
    description:
      'Collect interchangeable art prints for the Street Collector lamp. Swap limited edition street art prints in seconds and refresh your space without replacing the display.',
    h1: 'Interchangeable art prints for a collection that can change',
    answer:
      'Street Collector makes art interchangeable: the lamp stays in your space, while the prints can be swapped as you collect new limited editions. It is a way to keep physical art fresh without treating it like disposable decor.',
    proof: [
      'Swappable print system for one lamp and many artworks.',
      'Limited edition releases support independent artists.',
      'Designed for collectors who want rotation, discovery, and physical ownership.',
      'Works connect to artist pages and product pages for long-term context.',
    ],
    sections: [
      {
        heading: 'Why interchangeable art works',
        body:
          'Most wall art is static. Interchangeable prints let collectors change the feeling of a room while keeping a consistent display object and growing a real collection over time.',
      },
      {
        heading: 'A collection, not a single purchase',
        body:
          'Street Collector is designed around repeat discovery. A buyer can start with one lamp and one print, then add new artists, styles, or themes as their collection evolves.',
      },
      {
        heading: 'Good for gifts and small spaces',
        body:
          'The format works especially well for people who want meaningful art but do not have unlimited wall space. A single display can hold a rotating collection.',
      },
    ],
    faqs: [
      {
        question: 'What are interchangeable art prints?',
        answer:
          'They are physical prints designed to be swapped in and out of a display. Street Collector uses this format for limited edition street art prints.',
      },
      {
        question: 'Do I need a new lamp for every artwork?',
        answer:
          'No. The lamp is reusable. You can keep collecting prints and rotate them through the same display.',
      },
      {
        question: 'Are the prints collectible?',
        answer:
          'Yes. Street Collector focuses on limited edition artist releases, not mass-market decorative posters.',
      },
    ],
    related: [
      { label: 'Backlit art lamp', href: '/backlit-art-lamp' },
      { label: 'Shop artworks', href: '/shop/products' },
      { label: 'Explore artists', href: '/shop/explore-artists' },
    ],
    relatedArticles: [
      { label: 'What Is a Backlit Art Lamp?', href: '/shop/blog/what-is-a-backlit-art-lamp' },
      { label: 'Gifts for Street Art Lovers', href: '/shop/blog/gifts-for-street-art-lovers' },
    ],
  },
}
