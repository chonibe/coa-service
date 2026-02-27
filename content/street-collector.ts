/**
 * Street Collector Page Content
 *
 * Media URLs from thestreetcollector.com HTML (og:image, CDN).
 * Used by app/shop/street-collector/page.tsx
 */

/** Single destination for all CTAs and momentum cues */
export const EXPERIENCE_URL = '/shop/experience'

export const streetCollectorContent = {
  experienceUrl: EXPERIENCE_URL,
  hero: {
    headline: 'Not just a lamp.',
    subheadline: 'A living Art Collection',
    microCue: "Discover this month's drop.",
    cta: {
      text: 'Start your collection',
      url: EXPERIENCE_URL,
    },
    /** Hero video from thestreetcollector.com CTA section */
    video: 'https://thestreetcollector.com/cdn/shop/videos/c/vp/684cd0c8b42142fdad8e4db442befa6e/684cd0c8b42142fdad8e4db442befa6e.HD-1080p-7.2Mbps-71666969.mp4?v=0',
    /** From og:image - Lamp_Reward_White.png (poster/fallback) */
    image: 'https://thestreetcollector.com/cdn/shop/files/Lamp_Reward_White.png?v=1721632485&width=2048',
  },
  /** Logo from favicon/apple-touch (Group_707.png) */
  logo: 'https://thestreetcollector.com/cdn/shop/files/Group_707.png?v=1767356535&width=2008',
  /** Meet the Street Lamp — one video, stages rotate via progress bar on texts */
  meetTheLamp: {
    title: 'Meet the Street Lamp',
    /** Desktop video URL */
    desktopVideo: 'https://cdn.shopify.com/videos/c/o/v/85f511b742be4bc7a16d0efbf50147e6.mp4',
    /** Mobile video URL */
    mobileVideo: 'https://cdn.shopify.com/videos/c/o/v/52f4f4d4f3ac49c5b24dd536bc55328c.mp4',
    /** Poster for video (shared) */
    poster: 'https://thestreetcollector.com/cdn/shop/files/preview_images/78fe4304b80245be921122d1cc75f389.thumbnail.0000000000_small.jpg?v=1770018285',
    stages: [
      {
        title: 'Choose your art',
        description:
          'Browse curated pieces from hundreds of artists worldwide and pick the perfect artwork for your collection.',
      },
      {
        title: 'Slide it in',
        description:
          'Change your display in seconds with the press-and-click mechanism—no tools, no hassle.',
      },
      {
        title: 'Set the light',
        description:
          'Adjust between multiple levels of brightness with a single tap, transforming your artwork, intensifying colors and bringing out intricate details.',
      },
      {
        title: 'Mount it',
        description:
          'Transform your art into a statement piece with our magnetic display feature, make it a sign.',
      },
      {
        title: 'Rotate anytime',
        description:
          'Showcase two artworks back-to-back and rotate whenever you want a change—inviting viewers to explore different perspectives in one captivating piece.',
      },
    ],
    cue: 'Explore available artworks.',
  },
  /** Value props with video + poster from thestreetcollector.com multi-column section */
  valuePropsSectionTitle: 'Bringing art into everyday life.',
  valueProps: [
    {
      title: 'Collect original art.',
      description:
        'No AI. No screens. Just original art, delivered to your door.',
      poster:
        'https://thestreetcollector.com/cdn/shop/files/preview_images/c000242048854bb49b49204261d425ec.thumbnail.0000000000_small.jpg?v=1770018276',
      video: 'https://cdn.shopify.com/videos/c/o/v/992cbfacfba54746b7b733120537c523.mp4',
    },
    {
      title: 'Live with it. Make it yours.',
      description:
        'Slide it in. Light it up. Swap in seconds. Art that evolves with you.',
      poster:
        'https://thestreetcollector.com/cdn/shop/files/preview_images/78fe4304b80245be921122d1cc75f389.thumbnail.0000000000_small.jpg?v=1770018285',
      video:
        'https://thestreetcollector.com/cdn/shop/videos/c/vp/78fe4304b80245be921122d1cc75f389/78fe4304b80245be921122d1cc75f389.HD-1080p-7.2Mbps-69787802.mp4?v=0',
    },
    {
      title: 'Support artists directly.',
      description:
        'Every piece fuels the next one. Your purchase keeps culture alive.',
      poster:
        'https://thestreetcollector.com/cdn/shop/files/preview_images/026dcfa99353451aa897d2ca139ca81e.thumbnail.0000000000_small.jpg?v=1770018244',
      video:
        'https://thestreetcollector.com/cdn/shop/videos/c/vp/026dcfa99353451aa897d2ca139ca81e/026dcfa99353451aa897d2ca139ca81e.HD-1080p-7.2Mbps-69787798.mp4?v=0',
    },
  ],
  valuePropsCue: 'Browse current editions.',
  /** Testimonials with media (video/image) from thestreetcollector.com AI testimonial carousel */
  testimonials: {
    title: 'Join 3000+ Collectors',
    subtitle: 'Start your collection.',
    quotes: [
      {
        id: '1',
        author: '@Rinegg',
        content:
          "Le meilleur combo lampe x visuel 🥵\n\nJ'aurai aimé que ce post soit sponsorisé mais non 👀\nAllez quand même checker ce qu'ils proposent parce que c'est vraiment canon ! @streetcollector_\n\nL'image trop cool que j'ai c'est @moritz.adam.schmitt 😍",
        rating: 5,
        media: {
          type: 'video' as const,
          poster: 'https://thestreetcollector.com/cdn/shop/files/preview_images/1eaf8197dddc4b9f852534a2932d51cb.thumbnail.0000000000_800x.jpg?v=1770573388',
          video: 'https://thestreetcollector.com/cdn/shop/videos/c/vp/1eaf8197dddc4b9f852534a2932d51cb/1eaf8197dddc4b9f852534a2932d51cb.HD-1080p-2.5Mbps-71761612.mp4?v=0',
        },
      },
      {
        id: '2',
        author: 'Mazarine E.',
        content: 'I loooooove it ! My favorite piece EVER!!',
        rating: 5,
        media: {
          type: 'video' as const,
          poster: 'https://thestreetcollector.com/cdn/shop/files/preview_images/481c3eb1bcef489d84d3b69c881c431b.thumbnail.0000000000_800x.jpg?v=1770565793',
          video: 'https://thestreetcollector.com/cdn/shop/videos/c/vp/481c3eb1bcef489d84d3b69c881c431b/481c3eb1bcef489d84d3b69c881c431b.HD-1080p-2.5Mbps-71736275.mp4?v=0',
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
          poster: 'https://thestreetcollector.com/cdn/shop/files/preview_images/e16722752a44428689d98ffecf6fa016.thumbnail.0000000000_800x.jpg?v=1770571582',
          video: 'https://thestreetcollector.com/cdn/shop/videos/c/vp/e16722752a44428689d98ffecf6fa016/e16722752a44428689d98ffecf6fa016.HD-1080p-4.8Mbps-71755744.mp4?v=0',
        },
      },
      {
        id: '4',
        author: 'Debra G.',
        content:
          'The ritual of turning them on every morning, dimming them down at night and changing them out for a fresh perspective, served to be a unique and unexpected comfort through sometimes daily turmoil, muck and mud.',
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/In_an_immensely_difficult_year_where_any_sense_of_ease_or_peace_often_proved_elusive_I_found_th_6.jpg?v=1770570908&width=800' },
      },
      {
        id: '5',
        author: 'Gabriel M.',
        content:
          "Everything about it from the design to the concept is just perfect. Through this project, I discovered some truly exceptional artists, and I'm blown away by the talent featured. Honestly, every artist involved is astounding.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/unnamed_4.webp?v=1770560487&width=800' },
      },
      {
        id: '6',
        author: 'David G.',
        content:
          "I thought the idea was great and was happy to participate in the Kickstarter project. I'd say the main critic that I have would be that there are so many beautiful artworks to choose from that it makes it hard to decide which one to order 😊 I'm very very happy with the result and the lamp that I now have !",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/unnamed_9.webp?v=1770565576&width=800' },
      },
      {
        id: '7',
        author: 'Haya B.',
        content:
          "I just received the most wonderful 'Street lamp ' I ordered! It is well made, the packaging is sooo glamorous, the design is above and beyond and the ART IS AMAZING !! Definitely worth every penny! Loving it!",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/unnamed_1.webp?v=1770565151&width=800' },
      },
      {
        id: '8',
        author: 'Maayan F.',
        content:
          "Such prestige and chiq with this product! Every single bit lovely and lushhhh and the concept innovative I can't wait to see where they get to and watch them grow I'm sure they will! And am so honored to be in on it getting the first edition:)))\nAlso super easy process getting it♥️",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/unnamed_8.webp?v=1770560501&width=800' },
      },
      {
        id: '9',
        author: 'Lir P.',
        content:
          "An amazing product, full of elegant style, sophisticated and of course designed to a high standard. When I first saw the product at the exhibition, I already knew I wanted one!",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/526673363_768940875492834_8870128180377304790_n.jpg?v=1770565371&width=800' },
      },
      {
        id: '10',
        author: 'Cedric D.',
        content: 'I was already a fan from the beginning, but am even more so since receiving the lamp. I fear I have found a new addiction.',
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/unnamed_6.webp?v=1770560524&width=800' },
      },
      {
        id: '11',
        author: 'Andiva B',
        content:
          "One of my favorite pieces in the apartment! I first came across it on Kickstarter and was drawn to the design right away. Now that it's here, it really adds something special to the space. Friends always notice it and have something nice to say.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/525311351_18376112389131295_7956798693182725256_n_1.webp?v=1770569671&width=800' },
      },
      {
        id: '12',
        author: 'Debra G.',
        content:
          "I received my package today and can say that it was one of the most exciting unboxing experiences that I've had in quite some time. The lamp and artworks are stunning-absolutely exceeded my expectations. It is a straight-up honor to have this incredible art in my home.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/In_an_immensely_difficult_year_where_any_sense_of_ease_or_peace_often_proved_elusive_I_found_th.jpg?v=1770570885&width=800' },
      },
      {
        id: '13',
        author: 'Jerome M.',
        content: "New toy in the house. Thank you!\nJust received the lamp and I'm so happy with it!",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/618474944_25709629031983045_2543883703158680136_n.jpg?v=1770208979&width=800' },
      },
      {
        id: '14',
        author: 'Camila V.',
        content:
          "My lamp arrived, it's beautiful! \nI finally opened the box! It's incredible, I love it! Everything is so well packaged. It's amazing!",
        rating: 5,
        media: {
          type: 'video' as const,
          poster: 'https://thestreetcollector.com/cdn/shop/files/preview_images/e4c389d4b826457b91d26a849ddb61be.thumbnail.0000000000_800x.jpg?v=1770571269',
          video: 'https://thestreetcollector.com/cdn/shop/videos/c/vp/e4c389d4b826457b91d26a849ddb61be/e4c389d4b826457b91d26a849ddb61be.HD-1080p-2.5Mbps-71754641.mp4?v=0',
        },
      },
      {
        id: '15',
        author: 'Lisa G.',
        content:
          "Our family LOVES the lamp, and it is a centre piece in our living room so that our guests and our family can enjoy it together. We received it just in time for the holiday season and were blown away by the creativity and beauty.",
        rating: 5,
        media: { type: 'image' as const, src: 'https://thestreetcollector.com/cdn/shop/files/WhatsApp_Image_2026-02-07_at_4.38.11_PM.jpg?v=1770570289&width=800' },
      },
    ],
  },
  trustBar: [
    { label: 'Free worldwide shipping', description: 'We cover delivery to any destination.', icon: 'shipping' },
    { label: '12 month guarantee', description: 'Full coverage on your lamp.', icon: 'guarantee' },
    { label: 'Easy 30 days returns', description: 'No hassle if you change your mind.', icon: 'returns' },
  ],
  trustBarCue: 'Ready to start?',
  featuredArtistsCue: 'View limited editions.',
  featuredArtistsScarcity: 'Editions are limited. Once sold out, they do not return.',
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
    title: 'In Collaboration With',
    subtitle: '',
    description:
      'Every month, we curate and showcase new artists from around the globe on our platform. Offering a dynamic array of styles and perspectives. From avant-garde digital and contemporary artists to boundary-pushing graphic designers and bold street artists, our collaborations guarantee a rich tapestry of unique artworks exclusively crafted for the Street Lamp. New York, Tokyo, Berlin, Tel Aviv, Los Angeles, Mexico City, Madrid, Paris, Cairo, and Mumbai… Each city has its own rhythm, and the art it inspires reflects its unique culture and spirit. “Art is different wherever you go.”',
    linkText: 'Start your collection',
    linkHref: EXPERIENCE_URL,
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
      { handle: 'tiago-hespart' },
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
    title: 'Questions before you start?',
    groups: [
      {
        title: 'About the Lamp',
        items: [
          {
            question: 'Can I mount the lamp on a wall?',
            answer:
              'Yes. The Street Lamp supports wall mounting and magnetic placement, so you can display it in portrait or landscape.',
          },
          {
            question: 'How do I control the lamp light?',
            answer:
              'Use the touch control to switch on/off, dim brightness, and cycle between warm, cold, and daylight tones.',
          },
          {
            question: 'How do I charge it?',
            answer:
              'The lamp charges via USB-C with the included magnetic cable and adapter.',
          },
        ],
      },
      {
        title: 'About Artworks',
        items: [
          {
            question: 'Can I change the artwork later?',
            answer:
              'Yes. The press-and-click mechanism is built for fast swaps, so your display can evolve anytime.',
          },
          {
            question: 'Are artworks limited edition?',
            answer:
              'Many drops are limited editions and include authenticity context, helping you collect with confidence.',
          },
          {
            question: 'Do artists benefit from purchases?',
            answer:
              'Yes. Street Collector is built to support independent artists through every collection cycle.',
          },
        ],
      },
      {
        title: 'Shipping & Delivery',
        items: [
          {
            question: 'Do you ship internationally?',
            answer:
              'Yes, international shipping is supported for eligible destinations.',
          },
          {
            question: 'Will I get tracking details?',
            answer:
              'Yes. You receive tracking information as soon as your order is dispatched.',
          },
          {
            question: 'Are taxes or duties included?',
            answer:
              'Import duties and local taxes may apply depending on destination and are handled by local customs.',
          },
        ],
      },
    ],
  },
  finalCta: {
    headline: 'Not just a lamp. A living Art Collection',
    subheadline: 'Buy the lamp once and change the artwork anytime.',
    cta: {
      text: 'Start your collection',
      url: EXPERIENCE_URL,
    },
  },
} as const
