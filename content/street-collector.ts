/**
 * Street Collector Page Content
 *
 * Media URLs from thestreetcollector.com HTML (og:image, CDN).
 * Used by app/(store)/shop/street-collector/page.tsx and app/(store)/page.tsx (root /)
 */

/** Single destination for all CTAs and momentum cues */
export const EXPERIENCE_URL = '/experience'

export const streetCollectorContent = {
  experienceUrl: EXPERIENCE_URL,
  hero: {
    headline: 'A living art collection.',
    subheadline: 'Not just a lamp.',
    /** Third line under headline in VideoPlayer overlay */
    heroSubtext: 'One lamp. Endless art. Swap in seconds.',
    cta: {
      text: 'Start your collection',
      url: EXPERIENCE_URL,
    },
    /** Hero video from thestreetcollector.com CTA section */
    video: 'https://cdn.shopify.com/videos/c/o/v/2b189c367ed04f3f86dce86d120a40d6.mp4',
    /** Hero video poster/preview image */
    image: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/684cd0c8b42142fdad8e4db442befa6e.thumbnail.0000000000_800x.jpg?v=1770544655',
  },
  /** Logo (Street Collector branding) */
  logo: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/logo_1.png?v=1773229683',
  /**
   * Meet the Street Lamp: default `desktopVideo` / `mobileVideo` / `poster` when a stage has no Shopify clip.
   * Per-slide videos: Shopify metaobject type `under_the_fold_section` — match entries to each `stages[].title` (or handle slug); see `lib/shopify/under-the-fold-meet-lamp.ts`.
   */
  meetTheLamp: {
    title: 'Meet the Street Lamp',
    /** Two lines under the section title */
    taglineLines: ['Not just a lamp.', 'A living art collection.'],
    /** Single glass price line on video (joined if multiple strings) */
    pricingChips: ['Starting at $99 · Artworks from $40'],
    /** Desktop video URL */
    desktopVideo: 'https://cdn.shopify.com/videos/c/o/v/6e1629c055ea41a5b3c4f4efe9906b54.mp4',
    /** Mobile video URL */
    mobileVideo: 'https://cdn.shopify.com/videos/c/o/v/6e1629c055ea41a5b3c4f4efe9906b54.mp4',
    /** Poster for video (shared) */
    poster: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/78fe4304b80245be921122d1cc75f389.thumbnail.0000000000_small.jpg?v=1770018285',
    stages: [
      {
        title: 'Set the light',
        description:
          'One tap. Multiple brightness levels. Colors deepen, details surface.',
      },
      {
        title: 'Rotate anytime',
        description:
          'Two artworks, back to back. Swap perspectives whenever the mood shifts.',
      },
      {
        title: 'Slide it in',
        description:
          'Press, click, done. No tools, no hassle — new art in seconds.',
      },
      {
        title: 'Mount it',
        description: 'Magnetic. Wall-ready. Makes a statement.',
      },
      {
        title: 'Choose your art',
        description: 'Hundreds of artists. One piece that\'s yours.',
      },
    ],
    cue: '',
    primaryCta: { label: 'Start your collection', href: EXPERIENCE_URL },
    trustMicroItems: [
      'Free worldwide shipping',
      '12-month guarantee',
      '30-day returns',
    ] as const,
  },
  /** Value props with video + poster from thestreetcollector.com multi-column section */
  valuePropsSectionTitle: 'Bringing art into everyday life.',
  valueProps: [
    {
      title: 'Collect original Art.',
      description:
        'No AI. No screens. Just original art, delivered to your door.',
      poster:
        'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/026dcfa99353451aa897d2ca139ca81e.thumbnail.0000000000_small.jpg?v=1770018244',
      video: 'https://cdn.shopify.com/videos/c/o/v/dc4d553853cc40b998a292ced715e802.mp4',
    },
    {
      title: 'Transform any space instantly.',
      description:
        'Slide it in. Light it up. Swap in seconds. Art that evolves with you.',
      poster:
        'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/78fe4304b80245be921122d1cc75f389.thumbnail.0000000000_small.jpg?v=1770018285',
      video:
        'https://cdn.shopify.com/videos/c/o/v/c31886010f654a50a6245dc9ab6cc301.mp4',
    },
    {
      title: 'Support Artists directly.',
      description:
        'Every piece fuels the next one. Your purchase keeps culture alive.',
      poster:
        'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/c000242048854bb49b49204261d425ec.thumbnail.0000000000_small.jpg?v=1770018276',
      video: 'https://cdn.shopify.com/videos/c/o/v/907f900637204a35850037a1ffbbb70c.mp4',
    },
  ],
  valuePropsCue: '',
  /** Testimonials with media (video/image) from thestreetcollector.com AI testimonial carousel */
  testimonials: {
    title: 'Join 3000+ Collectors',
    subtitle: '',
    /** Decorative wide image behind the testimonial carousel (same asset as the old value-prop banner) */
    sectionBackdropImage:
      'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_8252.png?v=1771844884&width=1200',
    quotes: [
      {
        id: '1',
        author: '@Rinegg',
        content:
          "Le meilleur combo lampe x visuel 🥵\n\nJ'aurai aimé que ce post soit sponsorisé mais non 👀\nAllez quand même checker ce qu'ils proposent parce que c'est vraiment canon ! @streetcollector_\n\nL'image trop cool que j'ai c'est @moritz.adam.schmitt 😍",
        rating: 5,
        media: {
          type: 'video' as const,
          poster: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/1eaf8197dddc4b9f852534a2932d51cb.thumbnail.0000000000_800x.jpg?v=1770573388',
          video: 'https://cdn.shopify.com/videos/c/o/v/587954a427824f56bb0bdc6302da914c.mp4',
        },
      },
      {
        id: '2',
        author: 'Mazarine E.',
        content: 'I loooooove it ! My favorite piece EVER!!',
        rating: 5,
        media: {
          type: 'video' as const,
          poster: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/481c3eb1bcef489d84d3b69c881c431b.thumbnail.0000000000_800x.jpg?v=1770565793',
          video: 'https://cdn.shopify.com/videos/c/o/v/be9370aeb46e4762b8715c461a79ef47.mp4',
        },
      },
      {
        id: '3',
        author: 'Yaroslav I.',
        content:
          "I picked up the package and already had a quick look inside the box it's a really great product. I honestly haven't seen packaging this well thought out in a long time.",
        rating: 5,
        media: {
          type: 'video' as const,
          poster: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/e16722752a44428689d98ffecf6fa016.thumbnail.0000000000_800x.jpg?v=1770571582',
          video: 'https://cdn.shopify.com/videos/c/o/v/aa503626477c4e37a0596acdead3ae54.mp4',
        },
      },
      {
        id: '4',
        author: 'Debra G.',
        content:
          'The ritual of turning them on every morning, dimming them down at night and changing them out for a fresh perspective, served to be a unique and unexpected comfort through sometimes daily turmoil, muck and mud.',
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/In_an_immensely_difficult_year_where_any_sense_of_ease_or_peace_often_proved_elusive_I_found_th_6.jpg?v=1770570908&width=800' },
      },
      {
        id: '5',
        author: 'Gabriel M.',
        content:
          "Everything about it from the design to the concept is just perfect. Through this project, I discovered some truly exceptional artists, and I'm blown away by the talent featured. Honestly, every artist involved is astounding.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/unnamed_4.webp?v=1770560487&width=800' },
      },
      {
        id: '6',
        author: 'David G.',
        content:
          "I thought the idea was great and was happy to participate in the Kickstarter project. I'd say the main critic that I have would be that there are so many beautiful artworks to choose from that it makes it hard to decide which one to order 😊 I'm very very happy with the result and the lamp that I now have !",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/unnamed_9.webp?v=1770565576&width=800' },
      },
      {
        id: '7',
        author: 'Haya B.',
        content:
          "I just received the most wonderful 'Street lamp ' I ordered! It is well made, the packaging is sooo glamorous, the design is above and beyond and the ART IS AMAZING !! Definitely worth every penny! Loving it!",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/unnamed_1.webp?v=1770565151&width=800' },
      },
      {
        id: '8',
        author: 'Maayan F.',
        content:
          "Such prestige and chiq with this product! Every single bit lovely and lushhhh and the concept innovative I can't wait to see where they get to and watch them grow I'm sure they will! And am so honored to be in on it getting the first edition:)))\nAlso super easy process getting it♥️",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/unnamed_8.webp?v=1770560501&width=800' },
      },
      {
        id: '9',
        author: 'Lir P.',
        content:
          "An amazing product, full of elegant style, sophisticated and of course designed to a high standard. When I first saw the product at the exhibition, I already knew I wanted one!",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/526673363_768940875492834_8870128180377304790_n.jpg?v=1770565371&width=800' },
      },
      {
        id: '10',
        author: 'Cedric D.',
        content: 'I was already a fan from the beginning, but am even more so since receiving the lamp. I fear I have found a new addiction.',
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/unnamed_6.webp?v=1770560524&width=800' },
      },
      {
        id: '11',
        author: 'Andiva B',
        content:
          "One of my favorite pieces in the apartment! I first came across it on Kickstarter and was drawn to the design right away. Now that it's here, it really adds something special to the space. Friends always notice it and have something nice to say.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/525311351_18376112389131295_7956798693182725256_n_1.webp?v=1770569671&width=800' },
      },
      {
        id: '12',
        author: 'Debra G.',
        content:
          "I received my package today and can say that it was one of the most exciting unboxing experiences that I've had in quite some time. The lamp and artworks are stunning-absolutely exceeded my expectations. It is a straight-up honor to have this incredible art in my home.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/In_an_immensely_difficult_year_where_any_sense_of_ease_or_peace_often_proved_elusive_I_found_th.jpg?v=1770570885&width=800' },
      },
      {
        id: '13',
        author: 'Jerome M.',
        content: "New toy in the house. Thank you!\nJust received the lamp and I'm so happy with it!",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/618474944_25709629031983045_2543883703158680136_n.jpg?v=1770208979&width=800' },
      },
      {
        id: '14',
        author: 'Camila V.',
        content:
          "My lamp arrived, it's beautiful! \nI finally opened the box! It's incredible, I love it! Everything is so well packaged. It's amazing!",
        rating: 5,
        media: {
          type: 'video' as const,
          poster: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/e4c389d4b826457b91d26a849ddb61be.thumbnail.0000000000_800x.jpg?v=1770571269',
          video: 'https://cdn.shopify.com/videos/c/o/v/df16c8164d564677a32adb77c9a57ddd.mp4',
        },
      },
      {
        id: '15',
        author: 'Lisa G.',
        content:
          "Our family LOVES the lamp, and it is a centre piece in our living room so that our guests and our family can enjoy it together. We received it just in time for the holiday season and were blown away by the creativity and beauty.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/WhatsApp_Image_2026-02-07_at_4.38.11_PM.jpg?v=1770570289&width=800' },
      },
    ],
  },
  /** Displayed above the shipping / guarantee / returns row */
  trustBarTitle: "We've got you Covered",
  trustBar: [
    { label: 'Free worldwide shipping', description: 'We cover delivery to any destination.', icon: 'shipping' },
    { label: '12 month guarantee', description: 'Full coverage on your lamp.', icon: 'guarantee' },
    { label: 'Easy 30 days returns', description: 'No hassle if you change your mind.', icon: 'returns' },
  ],
  featuredArtistsCue: '',
  featuredArtistsScarcity: '', // Hidden for now: 'Editions are limited. Once sold out, they do not return.'
  collections: {
    freshArtDrops: {
      title: 'Fresh Art Drops',
      collectionHandle: 'season-2',
      linkText: 'View all',
      productsCount: 12,
    },
    mostPopular: {
      title: 'Most Popular',
      collectionHandle: 'season-1',
      linkText: 'View all',
      productsCount: 12,
    },
  },
  featuredArtists: {
    title: '100+ Artists. Every corner of the world.',
    subtitle: '',
    afterCarousel: '',
    description: '',
    linkText: 'Start your collection',
    linkHref: EXPERIENCE_URL,
    collections: [
      { handle: 'jerome-masi', location: 'Annecy', collectionHref: 'https://thestreetcollector.com/collections/jerome-masi' },
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
      { handle: 'sancho' },
      { handle: 'alice-bureau' },
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
      { handle: 'tiago-hesp', collectionHref: 'https://thestreetcollector.com/collections/tiago-hesp' },
      { handle: 'yoaz', location: 'Paris' },
    ],
  },
  funnelBridge: {
    title: 'What happens next',
    subtitle: 'Build your Street Lamp in minutes with a guided flow.',
    steps: [
      'Choose your lamp',
      'Preview and select artworks',
      'Review your setup and checkout',
    ],
    reassurance: 'Takes about 2 minutes. No account required to explore.',
    cta: {
      text: 'Start your collection',
      url: EXPERIENCE_URL,
    },
  },
  faq: {
    title: 'Questions?',
    groups: [
      {
        /** Empty title: home FAQ renders as a single centered list (no category chips). */
        title: '',
        items: [
          {
            question: 'How big are the Street Lamps?',
            answer:
              'Each Street Lamp measures about 21 × 14 × 7 cm (8.1 × 5.7 × 2.7 in) and weighs roughly 1.1 kg (2.4 lb). Compact enough for a desk or shelf, substantial enough to feel like a real design piece.',
          },
          {
            question: 'How long does shipping take?',
            answer:
              'Usually about three weeks. Expedited options are available in some countries. We will update you with your tracking number once the items are sent to you.',
          },
          {
            question: 'How long does the charge last?',
            answer:
              'On a full charge you’re looking at roughly 8 hours of run time from the 2500 mAh battery. Plug it in with USB-C or the magnetic cable and it’ll usually be good to go again in about 3–4 hours. Prefer to leave it on? No problem. You can run it plugged in all the time too.',
          },
          {
            question: 'Is it easy to swap the artworks on the lamp?',
            answer:
              'Super easy. Pieces slide in and out with a simple press-and-click mechanism, no tools needed. Swap them whenever you want to brighten the mood, refresh your space, or let a new piece inspire the room around you.',
          },
          {
            question: 'Do you ship internationally?',
            answer: 'Yes, to most countries in the world!',
          },
          {
            question: 'How do artwork prices change as an edition sells?',
            answer:
              'Editions move through fixed stages (Ground Floor through Final) as copies sell. List price only moves up the ladder — there are no flash sales on the model. What you see in the configurator reflects the same ladder we use in the database after orders sync.',
          },
          {
            question: 'What is The Reserve?',
            answer:
              'The Reserve is an optional membership that gives you a window of time to pay at a frozen artwork price while the public ladder advances. It is not a percentage-off discount; edition assignment after checkout still uses the same pipeline as every other order.',
          },
        ],
      },
    ],
  },
  finalCta: {
    headline: 'Not just a lamp. A living Art Collection',
    subheadline: '',
    cta: {
      text: 'Start your collection',
      url: EXPERIENCE_URL,
    },
  },
} as const
