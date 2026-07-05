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
      'Street Collector is a backlit art lamp for people who want to keep living with physical art without locking the room into one image forever. You buy the lamp once, then rotate limited edition prints by independent artists as your collection changes.',
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
          'Backlighting changes the print at the moment people actually notice it: at night, in side light, across a room. Colors hold longer, line stays sharper, and the work feels less like a flat rectangle and more like an object with its own atmosphere.',
      },
      {
        heading: 'Built for swapping, not replacing',
        body:
          'You should not need a new frame every time your taste shifts. The lamp stays put. The print changes. Collecting keeps moving, and the first purchase does not have to lock the room in place.',
      },
      {
        heading: 'A better fit for street art collectors',
        body:
          'Street art often depends on immediacy: color that hits fast, line that reads from distance, a mood that survives low light. A backlit display gives editioned prints some of the charge of a small installation without asking collectors to leave print collecting behind.',
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
      {
        label: 'What Is an Illuminated Art Display?',
        href: '/shop/blog/what-is-an-illuminated-art-display',
      },
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
      'Street Collector offers limited edition street art prints by independent artists, with the artist context kept close to the work. The editions are finite, the prints can be displayed in the lamp or framed traditionally, and eligible releases include Certificate of Authenticity documentation.',
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
          'Scarcity matters, but not by itself. A print becomes collectible when the artist matters, the image carries a recognizable voice, the run is finite, and the documentation is clear enough that you know what you are holding five years later.',
      },
      {
        heading: 'Street art without the gallery barrier',
        body:
          'Limited edition prints let collectors enter the work without needing a gallery budget or a wall big enough for an original. The format keeps the artist’s voice intact while lowering the threshold for starting a real collection.',
      },
      {
        heading: 'How to choose your first print',
        body:
          'Start with the artist before you start comparing thumbnails. Find a visual language you can imagine seeing often, read the profile, then check the edition size, availability, and documentation. The image should still win, but not alone.',
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
        label: 'What Is a Limited Edition Print?',
        href: '/shop/blog/what-is-a-limited-edition-print',
      },
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
        label: 'What Is a Print Run in Art?',
        href: '/shop/blog/what-is-a-print-run-in-art',
      },
      {
        label: 'Are Limited Edition Prints Worth It?',
        href: '/shop/blog/are-limited-edition-prints-worth-it',
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
      'Street Collector curates urban art prints by independent artists working across murals, illustration, collage, graphic art, and other street-influenced practices. These are editioned works with artist context attached, not anonymous wall filler.',
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
          'Urban art is wider than graffiti lettering alone. It includes muralists, poster artists, illustrators, painters, digital collage makers, and designers whose work carries the visual logic of the city even when it leaves the wall.',
      },
      {
        heading: 'Why artist pages matter',
        body:
          'Collectors need more than a product tile, and search systems do too. Artist pages, locations, bios, and linked works keep each print tied to the person behind it instead of flattening it into decor search results.',
      },
      {
        heading: 'Collect by city, style, or mood',
        body:
          'Some collectors start with a city. Others start with a palette, a line style, or the feeling a piece leaves in the room. The catalogue needs to support all of those entries, because people rarely collect by one rule for long.',
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
        label: 'What Is a Limited Edition Print?',
        href: '/shop/blog/what-is-a-limited-edition-print',
      },
      {
        label: 'Tel Aviv Street Art and Illustration',
        href: '/shop/blog/tel-aviv-street-art-and-illustration-through-street-collector-artists',
      },
      {
        label: 'Street Art vs Fine Art',
        href: '/shop/blog/street-art-vs-fine-art',
      },
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
      'Street Collector makes art interchangeable without making it disposable. The lamp stays in the room, while the prints rotate as you collect new limited editions, revisit older favorites, or simply want the space to feel different.',
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
          'Most wall art asks for commitment the minute it goes up. Interchangeable prints loosen that pressure. You keep one display object, but the room can still shift as the collection grows.',
      },
      {
        heading: 'A collection, not a single purchase',
        body:
          'This works best when the first purchase is not the end of the story. One lamp can start with one print, then pick up new artists, cities, moods, or themes over time without asking for new hardware every time.',
      },
      {
        heading: 'Good for gifts and small spaces',
        body:
          'The format especially suits smaller apartments, desks, shelves, and gifts for people who care about art but do not have infinite wall space. A single display can still carry a rotating collection with some actual range in it.',
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
      {
        label: 'Swappable Art Prints',
        href: '/shop/blog/swappable-art-prints',
      },
      { label: 'What Is a Backlit Art Lamp?', href: '/shop/blog/what-is-a-backlit-art-lamp' },
      { label: 'Gifts for Street Art Lovers', href: '/shop/blog/gifts-for-street-art-lovers' },
    ],
  },
}
