import artistResearchData from '@/content/artist-research-data.json'
import { articles as syncedArticles, type SyncedArticle } from '@/content/shopify-content'

export type EditorialArticleCategory =
  | 'City Field Guides'
  | 'Street-to-Studio Collecting'
  | 'Graphic Art & Print Culture'
  | 'Artists to Watch'
  | 'Collector Notes'

export type EditorialArticleSourceKind =
  | 'local-guide'
  | 'artist-enrichment'
  | 'artist-roundup'
  | 'benchmark-flagship'
  | 'shopify-fallback'

export interface EditorialCitation {
  id: string
  title: string
  href?: string
  source?: string
}

export interface EditorialImage {
  src: string
  alt: string
  caption?: string
  credit?: string
  citationIds?: string[]
}

export interface EditorialVideo {
  title: string
  url: string
  provider: string
  description?: string
  caption?: string
  embedUrl?: string
}

export type EditorialBlock =
  | { type: 'paragraph'; content: string; citationIds?: string[] }
  | { type: 'list'; items: string[]; citationIds?: string[] }
  | { type: 'quote'; content: string; attribution?: string; citationIds?: string[] }
  | { type: 'image'; image: EditorialImage; layout?: 'body' | 'wide' }
  | { type: 'video'; video: EditorialVideo; layout?: 'body' | 'wide' }

export interface EditorialSection {
  id: string
  title?: string
  blocks: EditorialBlock[]
}

export interface EditorialBody {
  sections: EditorialSection[]
}

export interface EditorialArticle {
  handle: string
  title: string
  deck: string
  excerpt: string
  articleFormat: 'field-guide' | 'walkthrough' | 'profile' | 'roundup' | 'checklist'
  contentHtml: string
  body?: EditorialBody
  heroImage: string | null
  heroAlt: string | null
  imageCredit: string | null
  publishedAt: string
  lastReviewedAt: string
  author: string
  tags: string[]
  category: EditorialArticleCategory
  topicCluster: string
  city?: string
  sourceKind: EditorialArticleSourceKind
  readingTime: number
  citations: EditorialCitation[]
  relatedArtistSlug?: string
}

interface ArtistResearchEntry {
  artistName?: string
  location?: string
  activeSince?: string
  heroHook?: string
  storyFullText?: string
  aboutPageUrl?: string
  additionalHistoryText?: string
  pullQuote?: string
  exhibitionsText?: string
  pressText?: string
  instagramHandle?: string
  sourcesLinks?: string
  processImage1Url?: string
  processImage1Label?: string
  processImage2Url?: string
  processImage2Label?: string
  processImage3Url?: string
  processImage3Label?: string
  processImage4Url?: string
  processImage4Label?: string
}

const PUBLISHED_AT = '2026-05-01T12:00:00.000Z'
const REVIEWED_AT = '2026-05-01T12:00:00.000Z'
const AUTHOR = 'Street Collector Editorial'

const STREET_ART_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dede_-_Golda_Levinski_street_01.jpg'
const TEL_AVIV_MUSEUM_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tel_Aviv_Museum_of_Art_(exterior,_general_view).jpg'
const SCREEN_PRINT_REGISTRATION_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Register_a_screen_print_using_acetate.jpg'
const SCREEN_PRINT_TOOLS_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Squeegee_and_ink_for_screen_printing.jpg'
const SCREEN_PRINTING_PROCESS_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Screenprinting-example-obin.jpg'
const SCREEN_PRINT_HAND_BENCH_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Screen_print_hand_bench_proffesional_print_bench_in_Squeegee_%26_Ink_studio.jpg'
const KIRYAT_HAMELACHA_PRINT_SHOP_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Screen_printing_faktory_in_Kiryat_Hamelacha_Tel_Aviv.jpg'
const FRAMED_WALL_ART_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Framed_wall_art_(Unsplash).jpg'
const BERLIN_WALL_MURAL_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Berlin_Wall_Mural_(4156638769).jpg'
const LISBON_STREET_ART_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lisbon_street_art_03_(13046007744).jpg'
const RISOGRAPH_MACHINE_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Risograph-herr-und-frau-rio-muc-2020.jpg'
const RISOGRAPH_PRINT_CLOSEUP_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Garden_Party,_close.jpg'
const HOT_OFF_THE_PRESS_BOOK_FAIR_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/1/18/Hot_Off_the_Press_Book_Fair_-_2024_-_08.jpg'
const ZINE_MAKING_TABLE_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/a/ae/Art_Experience_Center_Zine_Making_%286fd6e30c-7589-4c6c-85b6-fff5a2aa9dfd%29.jpg'
const PEOPLE_VIEWING_ZINES_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/e/ef/People_Viewing_Zines.jpg'
const EVENT_ZINE_PAGES_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/2/29/Event_zine_pages.jpg'
const ART_HANGING_WOOD_BUILDING_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/c/c8/Art_hanging_in_wood_building_%28Unsplash%29.jpg'
const PEOPLES_WALL_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/1/12/Seattle_-_The_People%27s_Wall_03.jpg'
const DAVID_RUFF_PRINT_WORKSHOP_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/d/d9/David_Ruff_working_at_The_Print_Workshop.jpg'
const TEL_AVIV_GRAFFITI_KISLEV_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Graffiti_in_Tel_Aviv_by_Street_Artist_Kis-Lev13.jpg'
const TEL_AVIV_MUSEUM_ARCHIVE_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/PikiWiki_Israel_46947_Tel_Aviv_Museum_building.jpg'
const WASH_OUT_BOOTH_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Wash_out_booth_for_screen_printing.jpg'
const CARRIS_MUSEUM_PRESS_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Carris_Museum_Press.jpg'
const ABSTRACT_ARTWORK_WHITE_ROOM_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Abstract_artwork_in_white_room_(Unsplash).jpg'
const FLAUNTER_INTERIOR_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Flaunter_-_Interior_(Unsplash).jpg'
const PRINTS_ON_A_WALL_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Prints_on_a_wall_(Unsplash).jpg'
const FEATURE_WALL_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Feature_Wall_(Unsplash).jpg'
const BERLIN_WALL_EAST_SIDE_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Berlin_Wall_-_East_Side_Gallery_(15758594025).jpg'
const LISBON_STREET_ART_2019_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lisbon_Street_Art_(2019)_(48938818007).jpg'
const COMPUTER_TO_SCREEN_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Computertoscreen.jpg'
const SCREEN_PRINTING_AT_NTAS_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Screen_printing_at_NTAS.jpg'
const DEDE_JAFFA_STREET_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dede_Jaffa_street.jpg'

const FIXED_FILTERS = [
  'City Field Guides',
  'Street-to-Studio Collecting',
  'Graphic Art & Print Culture',
  'Artists to Watch',
  'Collector Notes',
  'Tel Aviv',
  'Street Art',
  'Graphic Art',
]

const BENCHMARK_CITATIONS: EditorialCitation[] = [
  { id: '1', source: 'StreetArtNews', title: 'About StreetArtNews', href: 'https://streetartnews.net/about' },
  { id: '2', source: 'Artsy', title: 'How to Buy Street Art', href: 'https://www.artsy.net/article/artsy-editorial-buy-street-art' },
  { id: '3', source: 'Artsy', title: '5 Essential Tips for Collecting Street Art', href: 'https://www.artsy.net/article/artsy-editorial-5-essential-tips-collecting-street-art' },
  { id: '4', source: 'Artsy', title: '5 Things Art Collectors Need to Know About Buying Prints', href: 'https://www.artsy.net/article/artsy-editorial-5-things-art-collectors-buying-prints' },
  { id: '5', source: 'Widewalls', title: 'Widewalls collector discovery platform', href: 'https://www.widewalls.ch/' },
  { id: '6', source: 'Juxtapoz', title: 'Juxtapoz street art coverage', href: 'https://www.juxtapoz.com/street-art/' },
  { id: '7', source: 'Street Art Cities', title: 'Street Art Cities platform', href: 'https://streetartcities.com/' },
  { id: '8', source: 'Visit Tel Aviv', title: 'Visual Arts in Tel Aviv', href: 'https://www.visit-tel-aviv.com/en/Visual-Arts' },
  { id: '9', source: 'Tel Aviv Museum of Art', title: 'Museum overview', href: 'https://www.tamuseum.org.il/en/' },
  { id: '10', source: 'CCA Tel Aviv-Yafo', title: 'Center for Contemporary Art', href: 'https://cca.org.il/en/' },
  { id: '11', source: 'Wikimedia Commons', title: 'Register a screen print using acetate', href: 'https://commons.wikimedia.org/wiki/File:Register_a_screen_print_using_acetate.jpg' },
  { id: '12', source: 'Wikimedia Commons', title: 'Squeegee and ink for screen printing', href: 'https://commons.wikimedia.org/wiki/File:Squeegee_and_ink_for_screen_printing.jpg' },
  { id: '13', source: 'Wikimedia Commons', title: 'Screenprinting example', href: 'https://commons.wikimedia.org/wiki/File:Screenprinting-example-obin.jpg' },
  { id: '14', source: 'Wikimedia Commons', title: 'Screen print hand bench professional print bench in Squeegee & Ink studio', href: 'https://commons.wikimedia.org/wiki/File:Screen_print_hand_bench_proffesional_print_bench_in_Squeegee_%26_Ink_studio.jpg' },
  { id: '15', source: 'Wikimedia Commons', title: 'Screen printing factory in Kiryat Hamelacha Tel Aviv', href: 'https://commons.wikimedia.org/wiki/File:Screen_printing_faktory_in_Kiryat_Hamelacha_Tel_Aviv.jpg' },
  { id: '16', source: 'Wikimedia Commons', title: 'Framed wall art (Unsplash)', href: 'https://commons.wikimedia.org/wiki/File:Framed_wall_art_(Unsplash).jpg' },
  { id: '17', source: 'Tufenkian Fine Arts', title: 'Tanner Goldbeck x Modern Multiples "Winston Street" Screen Printing Process', href: 'https://www.tufenkianfinearts.com/video/16-tanner-goldbeck-x-modern-multiples-winston-street-screen-tanner-goldbeck/' },
]

function paragraph(content: string, citationIds?: string[]): EditorialBlock {
  return { type: 'paragraph', content, citationIds }
}

function list(items: string[], citationIds?: string[]): EditorialBlock {
  return { type: 'list', items, citationIds }
}

function quote(content: string, attribution?: string, citationIds?: string[]): EditorialBlock {
  return { type: 'quote', content, attribution, citationIds }
}

function imageBlock(image: EditorialImage, layout: 'body' | 'wide' = 'body'): EditorialBlock {
  return { type: 'image', image, layout }
}

function videoBlock(video: EditorialVideo, layout: 'body' | 'wide' = 'body'): EditorialBlock {
  return { type: 'video', video, layout }
}

function articleFromBody(article: Omit<EditorialArticle, 'contentHtml' | 'readingTime'>): EditorialArticle {
  const contentHtml = bodyToHtml(article.body)
  return {
    ...article,
    contentHtml,
    readingTime: readingTimeFromText(bodyToPlainText(article.body)),
  }
}

function sentenceCaseList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function bodyToPlainText(body: EditorialBody | undefined): string {
  if (!body) return ''

  return body.sections
    .flatMap((section) => [
      section.title || '',
      ...section.blocks.map((block) => {
        switch (block.type) {
          case 'paragraph':
            return block.content
          case 'list':
            return block.items.join(' ')
          case 'quote':
            return block.content
          case 'image':
            return `${block.image.caption || ''} ${block.image.credit || ''}`.trim()
          default:
            return ''
        }
      }),
    ])
    .join(' ')
}

function bodyToHtml(body: EditorialBody | undefined): string {
  if (!body) return ''

  return body.sections
    .map((section) => {
      const title = section.title ? `<h2 id="${escapeHtml(section.id)}">${escapeHtml(section.title)}</h2>` : ''
      const blocks = section.blocks
        .map((block) => {
          switch (block.type) {
            case 'paragraph':
              return `<p>${escapeHtml(block.content)}</p>`
            case 'list':
              return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
            case 'quote':
              return `<blockquote>${escapeHtml(block.content)}</blockquote>`
            case 'image':
              return `<figure><img src="${escapeHtml(block.image.src)}" alt="${escapeHtml(block.image.alt)}" />${
                block.image.caption || block.image.credit
                  ? `<figcaption>${escapeHtml(
                      [block.image.caption, block.image.credit ? `Credit: ${block.image.credit}` : null].filter(Boolean).join(' ')
                    )}</figcaption>`
                  : ''
              }</figure>`
            default:
              return ''
          }
        })
        .join('')

      return `${title}${blocks}`
    })
    .join('')
}

function readingTimeFromText(value: string): number {
  const words = value.split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.ceil(words / 210))
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cleanText(value: string | undefined | null): string {
  return (value || '')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

function firstSentence(value: string | undefined | null, fallback: string): string {
  const text = cleanText(value)
  if (!text) return fallback
  const match = text.match(/^(.{50,240}?[.!?])\s/)
  return match?.[1] || text.slice(0, 220)
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseSourceLinks(value: string | undefined): string[] {
  return cleanText(value)
    .split(/\s+/)
    .map((token) => token.replace(/[),.]+$/, ''))
    .filter((token) => token.startsWith('https://') && !token.includes('thestreetcollector.com'))
    .slice(0, 6)
}

function hostnameFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function isUsableImage(url: string | undefined): url is string {
  if (!url) return false
  return url.startsWith('https://')
}

function getArtistImage(entry: ArtistResearchEntry): string | null {
  return [entry.processImage1Url, entry.processImage2Url, entry.processImage3Url, entry.processImage4Url].find(isUsableImage) || null
}

function inferCollectorCues(entry: ArtistResearchEntry): string[] {
  const text = `${entry.storyFullText || ''} ${entry.additionalHistoryText || ''} ${entry.exhibitionsText || ''}`.toLowerCase()
  const cues = new Set<string>()

  if (/mural|street|graffiti|wall|public/.test(text)) {
    cues.add('Check whether the composition still holds tension once it leaves the wall and enters a domestic scale.')
  }
  if (/illustrat|vector|poster|graphic|typograph|design/.test(text)) {
    cues.add('Study line quality, negative space, and how fast the image reads from several distances.')
  }
  if (/paint|canvas|acrylic|ink|paper|drawing/.test(text)) {
    cues.add('Look at surface decisions, not just image subject, to see whether the materials carry conviction.')
  }
  if (cues.size < 3) {
    cues.add('Compare more than one work before buying so you can separate a durable language from one striking motif.')
  }
  if (cues.size < 4) {
    cues.add('Ask about edition size, production method, signature, and whether the chosen format feels native to the practice.')
  }

  return Array.from(cues).slice(0, 4)
}

function parseContextLines(value: string | undefined, limit: number): string[] {
  return (value || '')
    .split(/\r?\n/)
    .map((line) => cleanText(line.replace(/https?:\/\/\S+/g, '')))
    .filter(Boolean)
    .slice(0, limit)
}

function inferTags(entry: ArtistResearchEntry): string[] {
  const text = `${entry.location || ''} ${entry.storyFullText || ''} ${entry.exhibitionsText || ''}`.toLowerCase()
  const tags = new Set<string>(['Street Art'])
  if (/tel aviv|israel|jerusalem|haifa/.test(text)) tags.add('Tel Aviv')
  if (/illustrat|poster|graphic|design/.test(text)) tags.add('Graphic Art')
  return Array.from(tags)
}

type ArtistArticleFormat = 'studio-visit' | 'collector-walkthrough' | 'graphic-profile'

function chooseArtistArticleFormat(entry: ArtistResearchEntry): ArtistArticleFormat {
  const text = `${entry.storyFullText || ''} ${entry.additionalHistoryText || ''} ${entry.exhibitionsText || ''}`.toLowerCase()

  if (/illustrat|graphic|poster|design|typograph|character/.test(text)) {
    return 'graphic-profile'
  }

  if (/mural|street|graffiti|wall|public/.test(text)) {
    return 'collector-walkthrough'
  }

  return 'studio-visit'
}

function artistTitleForFormat(artistName: string, format: ArtistArticleFormat): string {
  switch (format) {
    case 'collector-walkthrough':
      return `${artistName}: How the Work Moves From Wall to Room`
    case 'graphic-profile':
      return `${artistName}: A Collector's Reading of the Graphic Language`
    default:
      return `${artistName}: Studio Notes for Collectors`
  }
}

function artistDeckForFormat(artistName: string, format: ArtistArticleFormat, hook: string): string {
  switch (format) {
    case 'collector-walkthrough':
      return `${hook} This is the collector version of the question: what survives when public work leaves the street and has to live indoors?`
    case 'graphic-profile':
      return `${hook} A closer read on line, repetition, graphic control, and what makes the work linger after the first glance.`
    default:
      return `${hook} A slower look at the practice, the pressure points in the work, and the questions worth asking before you buy.`
  }
}

function buildArtistBody(
  artistName: string,
  location: string,
  story: string,
  hook: string,
  cues: string[],
  contextLines: string[],
  image: string | null,
  citations: EditorialCitation[],
  pullQuote: string,
  format: ArtistArticleFormat
): EditorialBody {
  const firstCitationId = citations[0]?.id ? [citations[0].id] : undefined
  const citationIds = citations.map((citation) => citation.id)
  const placeText = location ? ` in ${location}` : ''
  const imageBlocks = image
    ? [
        imageBlock({
          src: image,
          alt: `Artwork or process image connected to ${artistName}`,
          caption: `Reference image connected to ${artistName}.`,
          credit: hostnameFromUrl(image) || 'Artist source',
          citationIds: firstCitationId,
        }),
      ]
    : []

  if (format === 'collector-walkthrough') {
    return {
      sections: [
        {
          id: 'first-impression',
          title: 'Start with the first impression',
          blocks: [
            paragraph(
              `Imagine meeting ${artistName}'s work before you know the backstory${placeText}. The first read matters: does it grab you through scale, pressure, wit, tenderness, or sheer graphic certainty? Good street-rooted work usually tells on itself fast.`,
              firstCitationId
            ),
            paragraph(story, firstCitationId),
            ...(pullQuote ? [quote(pullQuote, artistName, firstCitationId)] : []),
          ],
        },
        {
          id: 'what-holds-up',
          title: 'What keeps holding up after the first glance',
          blocks: [
            ...imageBlocks,
            paragraph(
              `${artistName} becomes more interesting when you stop asking whether the work is "street art" and start asking what actually carries over into a collection. It might be the silhouette, the pacing, the emotional restraint, or the way the image still reads when the wall and neighborhood noise disappear.`,
              firstCitationId
            ),
            list(cues),
          ],
        },
        {
          id: 'collector-walkthrough',
          title: 'A collector walkthrough',
          blocks: [
            paragraph(
              `If you were considering a piece tomorrow, the useful move would be to compare three things side by side: a public work, a studio-format work, and an edition if one exists. You are looking for continuity. The strongest practices feel related across formats without feeling flattened by them.`,
              citationIds.length ? citationIds : undefined
            ),
            paragraph(
              `That is usually where taste gets clearer. Some artists are unforgettable on the street and less convincing in a room. Others become more precise once they leave the wall. The collector's job is not to admire everything equally. It is to notice where the energy truly survives.`,
              citationIds.length ? citationIds : undefined
            ),
          ],
        },
        {
          id: 'public-record',
          title: 'What the public record tells you',
          blocks: contextLines.length
            ? [list(contextLines, citationIds.length ? citationIds : undefined)]
            : [paragraph(`The public record around ${artistName} is still thin, so this is a case where asking for better documentation matters.`)],
        },
      ],
    }
  }

  if (format === 'graphic-profile') {
    return {
      sections: [
        {
          id: 'why-this-work-sticks',
          title: 'Why this work sticks in the mind',
          blocks: [
            paragraph(
              `${artistName}'s work does not need a wall-sized gesture to make its point. The pull is usually more graphic than theatrical: line that arrives quickly, shapes that lock together cleanly, or an image logic that feels memorable before it feels explained.`,
              firstCitationId
            ),
            paragraph(hook, firstCitationId),
            ...(pullQuote ? [quote(pullQuote, artistName, firstCitationId)] : []),
          ],
        },
        {
          id: 'how-to-read-it',
          title: 'How to read it as a collector',
          blocks: [
            ...imageBlocks,
            paragraph(
              `This is the kind of practice that benefits from slower looking. Step back and the composition should still hold. Move closer and you should find decisions in the edges, spacing, color relationships, or hand that keep the work from feeling merely slick.`,
              firstCitationId
            ),
            list(cues),
          ],
        },
        {
          id: 'where-it-lives-best',
          title: 'Where the work lives best',
          blocks: [
            paragraph(
              `${artistName} makes the most sense for collectors who respond to graphic clarity but do not want dead surfaces. The sweet spot is usually a piece that keeps its snap from across the room while still giving you enough to return to when you are close.`,
              citationIds.length ? citationIds : undefined
            ),
            paragraph(
              `In practical terms, that means comparing formats carefully. Some graphic practices are strongest as prints. Others need scale, texture, or objecthood to really open up.`,
              citationIds.length ? citationIds : undefined
            ),
          ],
        },
        {
          id: 'public-record',
          title: 'What the public record adds',
          blocks: contextLines.length
            ? [list(contextLines, citationIds.length ? citationIds : undefined)]
            : [paragraph(`There is not much public scaffolding yet around ${artistName}, which makes the work itself even more important as evidence.`)],
        },
      ],
    }
  }

  return {
    sections: [
      {
        id: 'entering-the-studio',
        title: 'If you walked into the studio first',
        blocks: [
          paragraph(
            `The easiest way into ${artistName}'s practice is to imagine entering the studio before reading the press notes. What would tell you, almost immediately, that the work belongs to this artist and not someone nearby?`,
            firstCitationId
          ),
          paragraph(story, firstCitationId),
          ...(pullQuote ? [quote(pullQuote, artistName, firstCitationId)] : []),
        ],
      },
      {
        id: 'where-the-work-opens-up',
        title: 'Where the work starts to open up',
        blocks: [
          ...imageBlocks,
          paragraph(
            `${artistName} gets more legible once you look for repetition without sameness. It might be a recurring mood, a way of handling figures, a preference for compression over spectacle, or a visual restraint that lets one strong decision carry the room.`,
            firstCitationId
          ),
          list(cues),
        ],
      },
      {
        id: 'living-with-it',
        title: 'What living with the work might feel like',
        blocks: [
          paragraph(
            `Some work asks to dominate a room. Some work asks to be discovered over time. A useful collector question is which of those worlds ${artistName} belongs to, and whether that matches the way you actually live with art.`,
            citationIds.length ? citationIds : undefined
          ),
          paragraph(
            `That is where format matters. A print, painting, or object should not feel like a reduced version of the "real" work. It should feel like the right container for the same intelligence.`,
            citationIds.length ? citationIds : undefined
          ),
        ],
      },
      {
        id: 'public-record',
        title: 'What the public record gives you',
        blocks: contextLines.length
          ? [list(contextLines, citationIds.length ? citationIds : undefined)]
          : [paragraph(`The public record is still light here, so any serious purchase should come with better images, provenance details, and current work examples.`)],
      },
    ],
  }
}

const LOCAL_EDITORIAL_ARTICLES: EditorialArticle[] = [
  articleFromBody({
    handle: 'israeli-street-artists-a-look-at-some-of-the-countrys-talents',
    title: 'Israeli Street Art: A Collector’s Guide to Walls, Editions, and What Lasts',
    deck: 'A collector-first read on Israeli street art: what to look for on the wall, what changes in the studio, and which questions matter before you buy.',
    excerpt:
      'A collector-first read on Israeli street art: what to look for on the wall, what changes in the studio, and which questions matter before you buy.',
    articleFormat: 'field-guide',
    body: {
      sections: [
        {
          id: 'why-this-scene-matters',
          title: 'Why this scene matters to collectors',
          blocks: [
            paragraph(
              'Israeli street art has never been one tidy scene. It moves between fast graffiti, public murals, text-based interventions, activist imagery, neighborhood wit, and studio practices that still carry street pressure in their line, palette, and pacing.',
              ['1', '8']
            ),
            paragraph(
              'For collectors, that mix is the opportunity. The strongest artists from this ecosystem do not just make wall work that photographs well. They build visual languages that survive translation into prints, paintings, objects, and editions people can live with.',
              ['2', '3']
            ),
            quote('Start with the wall, not the name. The wall tells you whether the work can hold attention before the market starts helping it.', 'Street Collector editorial')
          ],
        },
        {
          id: 'where-to-look',
          title: 'Where to look before you buy',
          blocks: [
            imageBlock({
              src: STREET_ART_IMAGE,
              alt: 'Street artwork by Dede on Levinsky Street in Tel Aviv',
              caption: 'Levinsky and Florentin remain useful places to study motif, pacing, and wall-to-wall dialogue in Tel Aviv.',
              credit: 'Nizzan Cohen / Wikimedia Commons / CC BY 4.0',
              citationIds: ['8'],
            }),
            paragraph(
              'Florentin and Levinsky are still practical starting points because they let you compare styles quickly: poetic text work, character-driven murals, stencil logic, memorial gestures, and graphic interventions that read almost like poster culture in open air.',
              ['8']
            ),
            paragraph(
              'Jerusalem changes the temperature. Mahane Yehuda, shutters, religious imagery, and denser political memory create a different visual rhythm. Haifa often feels less flattened by tourism and more tied to crews, local histories, and painterly scale.',
              ['7']
            ),
          ],
        },
        {
          id: 'how-to-read-translation',
          title: 'How to judge the move from public wall to private collection',
          blocks: [
            paragraph(
              'Collectors should pay close attention to what an artist keeps when the work leaves the street. Strong street-to-studio practices usually preserve urgency through silhouette, negative space, surface tension, or repetition of a motif that still feels earned indoors.',
              ['2', '3']
            ),
            list([
              'Look for a repeatable visual language, not just a famous signature move.',
              'Compare mural energy with edition discipline. The print should feel designed for its scale.',
              'Ask whether the materials deepen the work or simply polish it for sale.',
              'Treat neighborhood context as part of the reading, not an optional anecdote.',
            ], ['2', '3']),
          ],
        },
        {
          id: 'artists-and-motifs',
          title: 'Artists and motifs worth tracking',
          blocks: [
            paragraph(
              'Dede remains useful to study because the bandage motif can read as vulnerability, repair, or visual shorthand depending on context. Nitzan Mintz demonstrates how text can behave like public architecture. Crews like Broken Fingaz show what happens when graphic confidence and spectacle become part of the collectible proposition.',
              ['1', '6']
            ),
            paragraph(
              'The goal is not to turn the scene into a ranking exercise. It is to learn which practices keep developing once they move between murals, editions, objects, collaborations, and gallery contexts.',
              ['2']
            ),
          ],
        },
        {
          id: 'collector-checklist',
          title: 'Collector checklist',
          blocks: [
            list([
              'Check edition size, publisher, signature, and production method before comparing price alone.',
              'Look at multiple works from the same artist to see whether the language expands or just repeats.',
              'Study the room-scale behavior of the work: distance, light, and what happens when it sits beside furniture and other art.',
              'Do not confuse scene visibility with collector fit. The best work for a collection is not always the loudest name on the wall.',
            ], ['2', '3', '4']),
          ],
        },
      ],
    },
    heroImage: TEL_AVIV_GRAFFITI_KISLEV_IMAGE,
    heroAlt: 'Street art in Tel Aviv by Kis-Lev',
    imageCredit: 'Photographer-26 / Wikimedia Commons / CC BY-SA 4.0',
    publishedAt: PUBLISHED_AT,
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Street Art', 'Tel Aviv', 'Collector Education'],
    category: 'City Field Guides',
    topicCluster: 'City Scene',
    city: 'Tel Aviv',
    sourceKind: 'local-guide',
    citations: BENCHMARK_CITATIONS.filter((citation) => ['1', '2', '3', '6', '7', '8'].includes(citation.id)),
  }),
  articleFromBody({
    handle: 'discover-the-best-tel-aviv-gifts-and-home-decor-from-modern-jewish-artists',
    title: 'How to Buy Tel Aviv Art for the Home Without Slipping Into Souvenir Mode',
    deck: 'A cleaner way to think about art and design from Tel Aviv: scale, material, mood, and what makes a piece feel lived with instead of merely local.',
    excerpt:
      'A cleaner way to think about art and design from Tel Aviv: scale, material, mood, and what makes a piece feel lived with instead of merely local.',
    articleFormat: 'field-guide',
    body: {
      sections: [
        {
          id: 'begin-with-the-room',
          title: 'Begin with the room, not the airport idea of the city',
          blocks: [
            paragraph(
              'Good Tel Aviv art for the home does not need to scream Tel Aviv. The city already has enough visual character: Bauhaus geometry, beach light, protest graphics, ceramic studios, poster language, artist-run spaces, and an unusually fluid relationship between design and fine art.',
              ['8', '9', '10']
            ),
            paragraph(
              'The better question is whether an object or edition keeps some of that intelligence once it enters a quieter room. That usually comes down to scale, material honesty, and whether the work carries more than just local flavor.',
              ['4', '8']
            ),
          ],
        },
        {
          id: 'choose-by-format',
          title: 'Choose by format before you choose by city',
          blocks: [
            list([
              'Prints work best when the image was designed for domestic scale, not merely reduced from a mural or exhibition wall.',
              'Ceramics and small objects matter when surface, weight, and light are part of the experience.',
              'Graphic works succeed in quieter spaces when line, color, and negative space still read from several distances.',
              'Larger works need breathing room; a strong purchase can still fail if the placement is wrong.',
            ], ['4']),
            imageBlock({
              src: TEL_AVIV_MUSEUM_IMAGE,
              alt: 'Exterior of the Tel Aviv Museum of Art',
              caption: 'Institutions help with context. They are useful for training your eye, not just for shopping ideas.',
              credit: 'JRodSilva / Wikimedia Commons / CC BY-SA 4.0',
              citationIds: ['9'],
            }),
          ],
        },
        {
          id: 'what-makes-it-meaningful',
          title: 'What actually makes a piece meaningful',
          blocks: [
            paragraph(
              'Meaningful decor is not decoration with a backstory taped on later. It is an object whose story changes how you see it: why the palette feels right, why the material matters, why the artist needed this format instead of another one.',
              ['4']
            ),
            list([
              'A short, honest artist story you can explain without padding.',
              'A real relationship to place, language, identity, or design history.',
              'Materials that support the idea rather than imitating value.',
              'A visual rhythm that fits the room you already have.',
            ], ['8']),
          ],
        },
        {
          id: 'where-to-browse',
          title: 'Where to browse with better eyes',
          blocks: [
            paragraph(
              'Use the Tel Aviv Museum, CCA Tel Aviv-Yafo, neighborhood walks, independent galleries, fairs, and artist studios as context builders. The point is not to buy in a rush. The point is to learn what kinds of objects and editions still feel alive after the city stops being loud in your head.',
              ['8', '9', '10']
            ),
          ],
        },
      ],
    },
    heroImage: TEL_AVIV_MUSEUM_ARCHIVE_IMAGE,
    heroAlt: 'Tel Aviv Museum building',
    imageCredit: 'PikiWiki Israel / Wikimedia Commons / CC BY 2.5',
    publishedAt: PUBLISHED_AT,
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Tel Aviv', 'Graphic Art', 'Home Display'],
    category: 'Collector Notes',
    topicCluster: 'Home Display',
    city: 'Tel Aviv',
    sourceKind: 'local-guide',
    citations: BENCHMARK_CITATIONS.filter((citation) => ['4', '8', '9', '10'].includes(citation.id)),
  }),
  articleFromBody({
    handle: 'exploring-the-vibrant-art-scene-in-tel-aviv',
    title: 'A Collector’s Field Guide to Tel Aviv’s Art Scene',
    deck: 'Museums, galleries, neighborhoods, fairs, and the questions that make a short trip to Tel Aviv more useful to a collector.',
    excerpt:
      'Museums, galleries, neighborhoods, fairs, and the questions that make a short trip to Tel Aviv more useful to a collector.',
    articleFormat: 'walkthrough',
    body: {
      sections: [
        {
          id: 'use-institutions',
          title: 'Use institutions for context, not just validation',
          blocks: [
            paragraph(
              'Tel Aviv rewards collectors who move slowly. The museum is not there to tell you what to buy. It is there to sharpen the questions you bring to galleries, neighborhood walls, artist studios, and edition tables later in the day.',
              ['9', '10']
            ),
            paragraph(
              'The Tel Aviv Museum of Art and CCA Tel Aviv-Yafo help frame the city across contemporary practice, architecture, installation, and civic mood. That frame matters because the local art ecosystem moves quickly between institutions, informal scenes, and commerce.',
              ['9', '10']
            ),
          ],
        },
        {
          id: 'walk-neighborhoods',
          title: 'Walk neighborhoods as if they were reading rooms',
          blocks: [
            paragraph(
              'Florentin is still the easiest place to start, but the goal is not to collect a camera roll of walls. It is to notice repetition: tags that keep surfacing, graphic habits that move from shutter to shutter, or a painterly hand that survives poor light and visual clutter.',
              ['7', '8']
            ),
            paragraph(
              'Kiryat Hamelacha matters because it compresses galleries, working studios, and local scene talk into a tighter footprint. Jaffa adds a different material and historical register. Together they help you see how place changes taste.',
              ['8']
            ),
          ],
        },
        {
          id: 'fairs-and-studios',
          title: 'Fairs and studios reveal different truths',
          blocks: [
            paragraph(
              'Fairs teach you how the market packages artists. Studios teach you what is still unresolved. Collectors need both views. You learn what the polished work looks like in public and what questions still haunt the practice in private.',
              ['2', '5']
            ),
            list([
              'At fairs, compare edition strategy, pricing, and consistency of presentation.',
              'In studios, ask what is changing in the work and which formats still feel experimental.',
              'In galleries, look at sequencing and whether the artist can sustain a body of work rather than a single striking piece.',
            ], ['2']),
          ],
        },
        {
          id: 'after-the-trip',
          title: 'After the trip, wait before you buy',
          blocks: [
            paragraph(
              'The best follow-up move is a shortlist, not an impulse. Revisit the artists online, compare works across formats, and ask which pieces keep opening up a week later. A useful city guide should complicate your taste before it confirms it.',
              ['2', '8']
            ),
          ],
        },
      ],
    },
    heroImage: DEDE_JAFFA_STREET_IMAGE,
    heroAlt: 'Dede street art in Jaffa, Tel Aviv',
    imageCredit: 'Nizzan Cohen / Wikimedia Commons / CC BY 4.0',
    publishedAt: PUBLISHED_AT,
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Tel Aviv', 'Street Art', 'Museums'],
    category: 'City Field Guides',
    topicCluster: 'City Scene',
    city: 'Tel Aviv',
    sourceKind: 'local-guide',
    citations: BENCHMARK_CITATIONS.filter((citation) => ['2', '5', '7', '8', '9', '10'].includes(citation.id)),
  }),
  articleFromBody({
    handle: 'how-to-collect-street-art-prints-without-buying-blind',
    title: 'What Makes a Street Art Print Worth Buying?',
    deck: 'A collector guide to the moment after the first spark: how to tell whether a street art print is just familiar, or actually worth living with.',
    excerpt:
      'A collector guide to the moment after the first spark: how to tell whether a street art print is just familiar, or actually worth living with.',
    articleFormat: 'checklist',
    body: {
      sections: [
        {
          id: 'the-first-mistake',
          title: 'The first mistake most buyers make',
          blocks: [
            paragraph(
              'Most people do not buy a street art print because they have carefully compared editions, printers, and paper stocks. They buy because something hits fast: a mural they once saw in person, an artist they already follow, a color combination that feels instantly alive. That part is normal. The mistake comes a minute later, when recognition gets confused with quality.',
              ['2', '3', '4']
            ),
            paragraph(
              'A good print should survive the loss of context. If the wall, the city, the Instagram post, and the artist hype all disappeared, the piece still needs to make sense as an object you would choose to live with.',
              ['2', '4']
            ),
            quote(
              'A street art print is worth buying when it still feels convincing after the story stops doing the work for it.',
              'Street Collector editorial'
            ),
            imageBlock({
              src: KIRYAT_HAMELACHA_PRINT_SHOP_IMAGE,
              alt: 'A screen printing workshop in Kiryat Hamelacha, Tel Aviv',
              caption: 'Street art prints make more sense when you remember they come out of real production environments, not abstract collector mythology.',
              credit: 'Nizzan Cohen / Wikimedia Commons / CC BY 4.0',
              citationIds: ['15'],
            }),
            list([
              'First, decide whether the image itself still works away from the wall.',
              'Then check whether the edition was made with care.',
              'Then test whether it belongs in your life rather than just your collector fantasy.',
            ], ['2', '4']),
          ],
        },
        {
          id: 'start-with-the-image',
          title: 'Start with the image before you start with the edition',
          blocks: [
            paragraph(
              'The first collector question is brutally simple: would I still want this if I had never seen the mural version? Some images depend on scale and public friction. Others tighten beautifully when they become prints. You are looking for the second kind.',
              ['3', '4']
            ),
            imageBlock({
              src: SCREEN_PRINT_REGISTRATION_IMAGE,
              alt: 'A printmaker registering a screen print using acetate in a studio',
              caption: 'Prints that are worth owning usually show evidence of care long before they reach the wall.',
              credit: 'Scrud123 / Wikimedia Commons / CC BY-SA 3.0',
              citationIds: ['11'],
            }),
            list([
              'Does the image still hold up at room scale, or does it rely on wall-size drama?',
              'Is the composition memorable because it is strong, or because it is famous?',
              'Does the print reveal something in the line, surface, or color that rewards slower looking?',
              'Would you still stop for it if the artist name were covered?',
            ], ['2', '3']),
          ],
        },
        {
          id: 'the-edition-part',
          title: 'Then look at the edition like an adult',
          blocks: [
            paragraph(
              'This is the part people either obsess over too early or ignore entirely. Edition details matter, but only after the image has earned your attention. Once it has, the edition tells you how seriously the work was produced and how carefully you should price your excitement.',
              ['2', '4']
            ),
            paragraph(
              'Think of this as the part of the article where instinct gets replaced by evidence. You are no longer asking, "Do I like it?" You are asking, "Was this made in a way that deserves the reaction I had?"',
              ['2', '4']
            ),
            imageBlock({
              src: SCREEN_PRINT_TOOLS_IMAGE,
              alt: 'Screen printing squeegee and ink on a trolley in a print studio',
              caption: 'Production details are not trivia. They are part of what separates a thoughtful edition from a casual cash-in.',
              credit: 'Scrud123 / Wikimedia Commons / CC BY-SA 3.0',
              citationIds: ['12'],
            }),
            imageBlock({
              src: SCREEN_PRINT_HAND_BENCH_IMAGE,
              alt: 'A professional hand bench used for screen printing in a studio',
              caption: 'When you ask who printed an edition, you are really asking how much craft and control sat behind the final sheet.',
              credit: 'Scrud123 / Wikimedia Commons / CC BY-SA 3.0',
              citationIds: ['14'],
            }),
            videoBlock({
              title: 'Watch: Tanner Goldbeck x Modern Multiples "Winston Street" screen printing process',
              url: 'https://www.tufenkianfinearts.com/video/16-tanner-goldbeck-x-modern-multiples-winston-street-screen-tanner-goldbeck/',
              provider: 'Tufenkian Fine Arts / YouTube',
            }),
            list([
              'Edition size: smaller is not automatically better, but oversized runs need a stronger reason to exist.',
              'Publisher or print studio: the people making the edition matter more than buyers sometimes admit.',
              'Signature and numbering: know whether you are looking at hand-signed, stamped, timed, open, or artist-proof material.',
              'Paper and production: if the image needs delicacy, the material should carry it.',
              'Timing: some prints are central to a practice; others feel like afterthoughts made to satisfy demand.',
            ], ['2', '3', '4']),
          ],
        },
        {
          id: 'condition-and-context',
          title: 'Condition, context, and the room test',
          blocks: [
            paragraph(
              'Condition is not glamorous, but it is part of whether a print deserves your money. So is context. The same edition can feel sharp in one room and completely dead in another. Good collectors do not separate those questions as neatly as the market does.',
              ['2', '4']
            ),
            imageBlock({
              src: FRAMED_WALL_ART_IMAGE,
              alt: 'Framed art prints displayed on a white wall in an interior',
              caption: 'The room test is real. A print that felt exciting in a browser still has to earn its place once it is framed and living with other objects.',
              credit: 'Crew / Wikimedia Commons / CC0',
              citationIds: ['16'],
            }, 'wide'),
            paragraph(
              'This is also where a lot of buyers get a little too abstract. A print does not live in "the market." It lives over a console, across from a chair, near a window, under a lamp, beside other things you chose. If it only works as a talking point, it probably is not the right buy.',
              ['2', '4']
            ),
            list([
              'Ask about corners, creases, sun exposure, prior framing, and storage.',
              'Think about viewing distance: some prints need a hallway glance, others need a chair nearby.',
              'Notice whether the work changes the room or simply fills it.',
              'Treat framing, light, and wall space as part of the purchase, not an afterthought.',
            ], ['2', '4']),
          ],
        },
        {
          id: 'questions-before-checkout',
          title: 'What to ask before you check out',
          blocks: [
            paragraph(
              'This is the moment where a thoughtful buyer separates from an impulsive one. You do not need to interrogate a seller, but you do want enough information to know whether you are buying a proper edition, a decent example of it, and a version you will still feel good about once it is framed.',
              ['2', '4']
            ),
            list([
              'Who printed the edition, and was it released directly by the artist, through a studio, or through a publisher?',
              'Is this exact print hand-signed, numbered, or from a timed or open release?',
              'Has it ever been framed, stored flat, exposed to sunlight, or shown in a humid room?',
              'Can I see close photos of edges, corners, and surface texture before paying?',
              'Why does this edition matter inside the artist\'s practice, beyond the fact that it sold well once?',
            ], ['2', '3', '4']),
            paragraph(
              'If those questions irritate the seller, that is information too. Good editions usually become easier to trust as details come into focus. Weak ones tend to get vaguer the longer you look at them.',
              ['2', '3']
            ),
          ],
        },
        {
          id: 'when-it-is-worth-it',
          title: 'So when is it actually worth buying?',
          blocks: [
            paragraph(
              'A street art print is worth buying when three things line up at once: the image still works without the backstory doing all the labor, the edition has been made with care, and the piece feels like it belongs in the life you actually live rather than the collector identity you imagine for yourself.',
              ['2', '3', '4']
            ),
            paragraph(
              'That answer is less sexy than hype, but it is better for your walls. Buy artists, not just moments. Compare more than one edition. Let taste be slower than urgency. And if a print feels more like proof that you were there than something you genuinely want to look at for years, leave it.',
              ['2', '3']
            ),
            quote(
              'The best print purchases feel quieter after the checkout and stronger six months later.',
              'Street Collector editorial'
            ),
          ],
        },
      ],
    },
    heroImage: SCREEN_PRINTING_AT_NTAS_IMAGE,
    heroAlt: 'Screen printing in a working studio',
    imageCredit: 'North Tyneside Art Studio / Wikimedia Commons',
    publishedAt: '2026-05-01T15:00:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Street Art', 'Graphic Art', 'Print Collecting'],
    category: 'Street-to-Studio Collecting',
    topicCluster: 'Buying Guides',
    sourceKind: 'benchmark-flagship',
    citations: BENCHMARK_CITATIONS.filter((citation) => ['2', '3', '4', '11', '12', '13', '14', '15', '16', '17'].includes(citation.id)),
  }),
  articleFromBody({
    handle: 'artist-guide-jerome-masi',
    title: 'Jerome Masi: Where Graphic Precision Starts to Feel Human',
    deck: 'A collector profile on Jerome Masi, whose prints and originals turn flat color, clean silhouettes, and stillness into something warmer and stranger than pure graphic polish.',
    excerpt:
      'A collector profile on Jerome Masi, whose prints and originals turn flat color, clean silhouettes, and stillness into something warmer and stranger than pure graphic polish.',
    articleFormat: 'profile',
    body: {
      sections: [
        {
          id: 'the-first-read',
          title: 'The first read',
          blocks: [
            paragraph(
              'At first glance, Jerome Masi can look almost too clean. The silhouettes are controlled, the color fields are flat, the compositions arrive quickly, and the emotional temperature stays cooler than the average figurative illustrator. Then you stay with the work for another minute and it starts doing something else.',
              ['1', '2', '3']
            ),
            paragraph(
              'What keeps the images alive is the gap between polish and feeling. The figures do not overperform. The scenes are often quiet, slightly suspended, a little withheld. That restraint is exactly what gives the work its charge.',
              ['1', '2']
            ),
            quote(
              "The work doesn't ask for attention by getting louder. It earns it by holding its nerve.",
              'Street Collector editorial'
            ),
          ],
        },
        {
          id: 'why-collectors-stop',
          title: 'Why collectors stop on this work',
          blocks: [
            paragraph(
              'Collectors who respond to Masi usually are not looking for maximal gesture. They are looking for an image that reads immediately but keeps a little privacy. His best pieces do that well: they snap from a distance, then slow down when you get close.',
              ['1', '2', '3']
            ),
            paragraph(
              'That matters because graphic work can easily become decorative in the weak sense of the word. Masi tends to avoid that trap. The simplification is real, but it is not empty. Line, spacing, and the pause inside the image do a lot of the emotional labor.',
              ['1', '2', '3']
            ),
            list([
              'The silhouette arrives fast.',
              'The color choices keep the image calm instead of noisy.',
              'The emotional tone stays slightly unresolved, which is why the work lingers.',
            ]),
          ],
        },
        {
          id: 'what-the-editions-reveal',
          title: 'What the editions reveal',
          blocks: [
            paragraph(
              'This is where the official shop becomes useful. It shows that Masi is not only making images that work on screen; he is also translating them into editions with enough specificity to matter to buyers. On the shop page, works like CHILDHOOD XL . RED and TWINS are listed as screen prints with clear size, paper, edition, and signing details.',
              ['1', '5']
            ),
            paragraph(
              'That is a better sign than people sometimes realize. When a graphic artist gives real attention to paper, scale, and edition logic, you start to understand whether the print is an afterthought or a native format. In Masi\'s case, the print side of the practice looks deliberate.',
              ['1', '5']
            ),
            list([
              'CHILDHOOD XL . RED: screenprint, 100 x 70 cm, edition of 10, numbered and hand-signed, Arches 88 paper.',
              'TWINS: limited screen print, 70 x 70 cm, edition of 50, numbered and signed, Arches 88 paper.',
              'Several prints in the shop are marked sold out, which suggests the edition side of the work has real follow-through rather than token presence.',
            ], ['5']),
          ],
        },
        {
          id: 'where-the-work-opens-up',
          title: 'Where the work opens up',
          blocks: [
            paragraph(
              'The best place to test a Jerome Masi piece is not in a crowded feed but in a quieter room. The work likes breathing space. It does not need a wall of visual noise around it, and it probably loses something if framed too aggressively or hung in a setting that asks it to shout.',
              ['1', '3']
            ),
            paragraph(
              'For a collector, that means thinking less about novelty and more about rhythm. Which piece keeps its poise from across the room? Which one still rewards a closer look? Which one feels composed rather than merely designed? That is the right threshold for this practice.',
              ['1', '2', '3']
            ),
          ],
        },
        {
          id: 'what-to-watch-for',
          title: 'What to watch for if you buy',
          blocks: [
            list([
              'Look for pieces where the calm is doing real work, not just creating surface neatness.',
              'Compare prints against originals and sculptures; Masi works across formats, and not every image will want the same kind of objecthood.',
              'Pay attention to edition details, because this is one of the practices where paper, scale, and signing meaningfully affect the result.',
              'Choose the work that still feels slightly mysterious after the first clean read.',
            ], ['1', '5']),
            paragraph(
              'That last point matters most. Plenty of graphic artists can give you clarity. Fewer can give you clarity with aftertaste. Masi, at his best, can.',
              ['1', '2']
            ),
          ],
        },
      ],
    },
    heroImage: 'https://www.lm-magazine.com/wp-content/uploads/2022/03/jerome-masi5.jpg',
    heroAlt: 'Artwork by Jerome Masi featured in LM Magazine',
    imageCredit: 'LM Magazine',
    publishedAt: '2026-05-01T16:00:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Graphic Art', 'Print Collecting', 'Artist Profile'],
    category: 'Artists to Watch',
    topicCluster: 'Artist Radar',
    city: 'Annecy',
    sourceKind: 'local-guide',
    citations: [
      { id: '1', source: 'jeromemasi.com', title: 'Official site', href: 'https://www.jeromemasi.com/' },
      { id: '2', source: 'LM Magazine', title: 'Jerome Masi interview', href: 'https://www.lm-magazine.com/blog/2022/03/01/jerome-masi-2/' },
      { id: '3', source: 'Senso', title: 'Jerome Masi profile', href: 'https://www.senso.art/en/jerome-masi' },
      { id: '4', source: 'Creasenso', title: 'Portfolio listing', href: 'https://www.creasenso.com/en/portfolios/image/illustration/jerome-masi' },
      { id: '5', source: 'jeromemasi.com', title: 'Shop / editions', href: 'https://www.jeromemasi.com/shop.html' },
    ],
    relatedArtistSlug: 'jerome-masi',
  }),
  articleFromBody({
    handle: 'limited-edition-vs-open-edition-what-every-street-art-collector-needs-to-know',
    title: 'Limited Edition vs. Open Edition: What Actually Matters to a Collector',
    deck: 'A practical guide to the print distinction people repeat most often and understand least: what limited and open edition really tell you, and what they definitely do not.',
    excerpt:
      'A practical guide to the print distinction people repeat most often and understand least: what limited and open edition really tell you, and what they definitely do not.',
    articleFormat: 'field-guide',
    body: {
      sections: [
        {
          id: 'the-basic-distinction',
          title: 'The basic distinction is simple. The buying decision is not.',
          blocks: [
            paragraph(
              'A limited edition means the artist or publisher has set a fixed number of prints. An open edition stays available without that ceiling. That part is straightforward. Where collectors get into trouble is assuming the limited edition is automatically the better object and the open edition is automatically a throwaway.',
              ['1', '2']
            ),
            paragraph(
              'Sometimes the limited edition is absolutely the more serious work. Sometimes it is just a smaller run attached to an image that still does not deserve your wall. The edition format tells you something about scarcity. It does not tell you everything about quality.',
              ['1', '2']
            ),
            imageBlock({
              src: CARRIS_MUSEUM_PRESS_IMAGE,
              alt: 'Historic print press in a museum setting',
              caption: 'Edition language matters, but production care matters just as much.',
              credit: 'Wikimedia Commons',
            }),
          ],
        },
        {
          id: 'what-limited-edition-signals',
          title: 'What a limited edition can signal',
          blocks: [
            list([
              'A clearer sense of scarcity, which matters if demand builds over time.',
              'A higher chance that the artist or publisher treated the edition as a considered release rather than a generic reproduction.',
              'More transparency around numbering, signing, paper, and production details.',
            ], ['1', '2']),
            paragraph(
              'That said, scarcity only matters if the image, material, and release context are strong enough to support it. A weak print in an edition of 20 is still a weak print.',
              ['1', '2']
            ),
          ],
        },
        {
          id: 'when-open-edition-still-works',
          title: 'When an open edition still makes sense',
          blocks: [
            paragraph(
              'Open editions can still be worth buying when the goal is access, not rarity. If you love the image, want to live with it, and the production is honest about what it is, an open edition can be a perfectly good purchase. It just belongs in a different mental category from a carefully produced small-run print.',
              ['1', '2']
            ),
            paragraph(
              'For newer collectors, open editions can also be useful training. They teach you what kinds of images and scales you want to live with before you spend more seriously on tighter editions.',
              ['1']
            ),
            imageBlock({
              src: ABSTRACT_ARTWORK_WHITE_ROOM_IMAGE,
              alt: 'Abstract artwork displayed in a quiet white interior',
              caption: 'The best test is still the room test: do you want to keep looking at it once it is actually living with you?',
              credit: 'Sven Brandsma / Unsplash / Wikimedia Commons / CC0',
            }, 'wide'),
          ],
        },
        {
          id: 'what-to-check-before-buying',
          title: 'What to check before buying either one',
          blocks: [
            list([
              'Who published it, and does that publisher have a decent track record?',
              'Is the print signed, numbered, stamped, or simply reproduced?',
              'What are the paper, size, and process details?',
              'Does the artist make prints as a real part of the practice, or just as merchandise?',
              'Would you still want the image if nobody mentioned the edition size first?',
            ], ['1', '2']),
            paragraph(
              'That last question is the one people skip. Collectors often get hypnotized by the run length before deciding whether the work is strong enough to carry the attention.',
              ['1']
            ),
          ],
        },
      ],
    },
    heroImage: WASH_OUT_BOOTH_IMAGE,
    heroAlt: 'Washout booth used in a screen-printing studio',
    imageCredit: 'Wikimedia Commons',
    publishedAt: '2026-05-01T16:30:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Print Collecting', 'Limited Editions', 'Collector Guide'],
    category: 'Street-to-Studio Collecting',
    topicCluster: 'Buying Guides',
    sourceKind: 'local-guide',
    citations: [
      { id: '1', source: 'Artsy', title: '5 Things Art Collectors Need to Know About Buying Prints', href: 'https://www.artsy.net/article/artsy-editorial-5-things-art-collectors-buying-prints' },
      { id: '2', source: 'Artsy', title: 'How to Buy Street Art', href: 'https://www.artsy.net/article/artsy-editorial-buy-street-art' },
      { id: '3', source: 'Wikimedia Commons', title: 'Register a screen print using acetate', href: 'https://commons.wikimedia.org/wiki/File:Register_a_screen_print_using_acetate.jpg' },
      { id: '4', source: 'Wikimedia Commons', title: 'Framed wall art (Unsplash)', href: 'https://commons.wikimedia.org/wiki/File:Framed_wall_art_(Unsplash).jpg' },
    ],
  }),
  articleFromBody({
    handle: 'the-best-street-art-cities-in-the-world-and-how-to-collect-them',
    title: 'The Best Street Art Cities in the World, and How to Collect What They Do Best',
    deck: 'A collector-minded city roundup that treats scenes as ecosystems rather than postcard backdrops: where the work hits hardest, and what each place tends to translate best into editions and objects.',
    excerpt:
      'A collector-minded city roundup that treats scenes as ecosystems rather than postcard backdrops: where the work hits hardest, and what each place tends to translate best into editions and objects.',
    articleFormat: 'roundup',
    body: {
      sections: [
        {
          id: 'why-cities-matter',
          title: 'Why the city still matters',
          blocks: [
            paragraph(
              'Collectors talk about artists, but scenes often explain the work better. A city shapes scale, wall politics, color habits, local materials, neighborhood rhythms, and the kind of graphic language that feels natural there. If you want to understand what a print or edition is carrying forward, it helps to know the city logic underneath it.',
              ['1', '2']
            ),
            paragraph(
              'That does not mean every mural deserves a print. It means some places produce visual languages that travel unusually well from the street into paper, objects, and interiors.',
              ['1']
            ),
          ],
        },
        {
          id: 'berlin',
          title: 'Berlin for abrasion and history',
          blocks: [
            imageBlock({
              src: BERLIN_WALL_MURAL_IMAGE,
              alt: 'Mural on the East Side Gallery in Berlin',
              caption: 'Berlin still gives artists permission to leave friction in the image.',
              credit: 'Thomas Quine / Wikimedia Commons / CC BY-SA 2.0',
            }),
            paragraph(
              'Berlin remains strong when you want work that still shows evidence of collision: politics, subculture, poster history, club graphics, and walls that never felt purely decorative. What translates well from Berlin is not always prettiness. It is often tension, abrasion, and a visual language that still remembers public space.',
              ['2', '3']
            ),
          ],
        },
        {
          id: 'tel-aviv',
          title: 'Tel Aviv for graphic wit and fast visual language',
          blocks: [
            paragraph(
              'Tel Aviv rewards collectors who like text, character, speed, and a certain looseness that still knows exactly what it is doing. The city\'s strongest work often moves quickly between mural logic, poster instincts, and studio editions that keep the same snap on paper.',
              ['1', '4']
            ),
            paragraph(
              'It is a scene where smaller works can still carry urban energy, which is why Tel Aviv often translates so well into prints and home-scale objects.',
              ['4']
            ),
          ],
        },
        {
          id: 'lisbon',
          title: 'Lisbon for texture, surface, and public memory',
          blocks: [
            imageBlock({
              src: LISBON_STREET_ART_IMAGE,
              alt: 'Street art on building facades in Lisbon',
              caption: 'Lisbon often gives street art a stronger relationship to architecture and surface than collectors expect.',
              credit: 'Pedro Ribeiro Simões / Wikimedia Commons / CC BY 2.0',
            }),
            paragraph(
              'Lisbon is one of the cities where surface really matters. Tile history, weathering, facades, and public memory all push the work toward texture and context. Collectors should look for artists who can carry that sense of place into editions without flattening it into generic mural nostalgia.',
              ['1', '5']
            ),
          ],
        },
        {
          id: 'london-and-paris',
          title: 'London and Paris for crossover energy',
          blocks: [
            paragraph(
              'London and Paris both matter because they make crossover visible. Street work there is constantly touching publishing, fashion, design, fair culture, and the institutional art world. That can dilute things at the weak end, but at the strong end it produces artists who understand how to move across formats without losing themselves.',
              ['6', '7', '8']
            ),
            list([
              'London tends to reward artists who can survive visibility without losing edge.',
              'Paris often gives you stronger bridges between urban art, fairs, editions, and exhibition culture.',
              'In both cities, the collector question is whether the work still feels alive once it leaves the wall and enters a more polished market context.',
            ]),
          ],
        },
        {
          id: 'how-to-collect-by-city',
          title: 'How to collect by city without collecting clichés',
          blocks: [
            list([
              'Buy the visual language, not just the travel memory.',
              'Ask what each scene does best on paper rather than assuming every mural should become a print.',
              'Let neighborhoods and local mediums teach you more than top-10 mural lists do.',
              'The right city-led collection should feel varied in mood, but coherent in why the works were chosen.',
            ], ['1', '2']),
          ],
        },
      ],
    },
    heroImage: LISBON_STREET_ART_2019_IMAGE,
    heroAlt: 'Street art in Lisbon',
    imageCredit: 'Wikimedia Commons',
    publishedAt: '2026-05-01T17:00:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Street Art', 'City Guides', 'Collector Guide'],
    category: 'City Field Guides',
    topicCluster: 'City Scene',
    sourceKind: 'local-guide',
    citations: [
      { id: '1', source: 'Street Art Cities', title: 'Platform overview', href: 'https://streetartcities.com/' },
      { id: '2', source: 'Berlin on Bike', title: 'Street Art Berlin blog', href: 'https://berlinonbike.de/en/blog/category/street-art-berlin/' },
      { id: '3', source: 'Berlin Art Link', title: 'Berlin exhibitions and events coverage', href: 'https://www.berlinartlink.com/' },
      { id: '4', source: 'Visit Tel Aviv', title: 'Visual Arts in Tel Aviv', href: 'https://www.visit-tel-aviv.com/en/Visual-Arts' },
      { id: '5', source: 'Wikimedia Commons', title: 'Lisbon street art 03', href: 'https://commons.wikimedia.org/wiki/File:Lisbon_street_art_03_(13046007744).jpg' },
      { id: '6', source: 'Giulia Blocal', title: 'Why I Travel for Street Art', href: 'https://giuliablocalblog.substack.com/p/street-art-travel' },
      { id: '7', source: 'Sortiraparis', title: 'Urban Art Fair 2025 in Paris', href: 'https://www.sortiraparis.com/en/what-to-do-in-paris/shows-and-fairs/articles/106056-urban-art-fair-2025-in-paris' },
      { id: '8', source: 'Beware Magazine', title: 'Street art exhibitions in Paris summer 2025', href: 'https://out.bewaremag.com/expositions-street-art-a-paris-ete-2025/' },
    ],
  }),
  articleFromBody({
    handle: 'riso-printing-the-lo-fi-medium-street-artists-are-obsessing-over',
    title: 'Riso Printing: Why Street Artists Keep Coming Back to This Beautifully Imperfect Medium',
    deck: 'A print-culture explainer on risograph work, why it attracts graphic-minded street artists, and what collectors should look for before treating it like just another cheap poster format.',
    excerpt:
      'A print-culture explainer on risograph work, why it attracts graphic-minded street artists, and what collectors should look for before treating it like just another cheap poster format.',
    articleFormat: 'field-guide',
    body: {
      sections: [
        {
          id: 'why-riso-keeps-showing-up',
          title: 'Why riso keeps showing up',
          blocks: [
            paragraph(
              'Risograph sits in a sweet spot that street artists and graphic artists understand immediately. It is fast, layered, a little unstable, color-forward, and imperfect in a way that feels alive rather than sloppy. You can see the hand of the process without needing the price point of a more labor-heavy print method.',
              ['1', '2']
            ),
            videoBlock({
              title: 'Intro to Risograph Printing with Olivia from Pindot Press',
              url: 'https://www.youtube.com/watch?v=1rfwKuXIhcE',
              provider: 'YouTube',
            }),
          ],
        },
        {
          id: 'what-collectors-are-actually-buying',
          title: 'What collectors are actually buying',
          blocks: [
            paragraph(
              'A good riso print is not just a cheaper version of a screenprint. It is a different object with a different emotional register. The color can misalign slightly. The ink sits differently. The sheet can feel more immediate, more provisional, more tied to zine culture and artist-led distribution.',
              ['1', '3']
            ),
            paragraph(
              'That is exactly why some collectors love it. Riso can preserve urgency in a way that cleaner print formats sometimes smooth out.',
              ['3']
            ),
            imageBlock({
              src: RISOGRAPH_PRINT_CLOSEUP_IMAGE,
              alt: 'Close view of a risograph print surface',
              caption: 'The charm is often in the slight slip, overlap, and grain you would try to eliminate in a cleaner commercial print.',
              credit: 'Benoît Prieur / Wikimedia Commons / CC0',
            }),
          ],
        },
        {
          id: 'how-it-differs-from-screenprint',
          title: 'How it differs from screenprint',
          blocks: [
            list([
              'Screenprints usually feel more deliberate, weighty, and edition-driven.',
              'Riso prints usually feel faster, more agile, and closer to print culture than to fine-print formality.',
              'Screenprint often rewards precision; riso often rewards character.',
              'A collector should not ask which one is better in the abstract. Ask which one is truer to the image and the artist.',
            ], ['1', '2', '3']),
          ],
        },
        {
          id: 'what-to-look-for-before-buying',
          title: 'What to look for before buying',
          blocks: [
            list([
              'Does the image benefit from the medium’s rougher edges and layered color?',
              'Is the edition described clearly, or is the print being sold as a vague art-object gesture?',
              'Does the paper, scale, and palette feel intentional?',
              'Would the work lose its spirit if it were cleaned up too much? If yes, riso may be the right format.',
            ], ['1', '2', '3']),
            paragraph(
              'The best riso prints feel like they were supposed to be made this way. The worst ones feel like somebody stopped halfway to a better print method.',
              ['3']
            ),
          ],
        },
      ],
    },
    heroImage: RISOGRAPH_MACHINE_IMAGE,
    heroAlt: 'Risograph machine in a studio',
    imageCredit: 'Kaethe17 / Wikimedia Commons / CC BY-SA 4.0',
    publishedAt: '2026-05-01T17:30:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Graphic Art', 'Print Culture', 'Risograph'],
    category: 'Graphic Art & Print Culture',
    topicCluster: 'Print Mediums',
    sourceKind: 'local-guide',
    citations: [
      { id: '1', source: 'RISO', title: 'Digital Duplicators', href: 'https://us.riso.com/products/digital-duplicators/' },
      { id: '2', source: 'RISO', title: 'What is RISO Art?', href: 'https://www.riso.co.jp/english/company/risoart/concept.html' },
      { id: '3', source: 'It\'s Nice That', title: 'Riso printing coverage', href: 'https://www.itsnicethat.com/search?tags=risograph' },
      { id: '4', source: 'Wikimedia Commons', title: 'Risograph machine photo', href: 'https://commons.wikimedia.org/wiki/File:Risograph-herr-und-frau-rio-muc-2020.jpg' },
      { id: '5', source: 'Wikimedia Commons', title: 'Garden Party, close', href: 'https://commons.wikimedia.org/wiki/File:Garden_Party,_close.jpg' },
    ],
  }),
  articleFromBody({
    handle: 'how-to-start-a-street-art-collection-on-any-budget',
    title: 'How to Start a Street Art Collection on Any Budget',
    deck: 'A realistic starting guide for people who love the culture but do not have blue-chip money: where to begin, what to prioritize, and how to buy your first pieces without rushing into the wrong ones.',
    excerpt:
      'A realistic starting guide for people who love the culture but do not have blue-chip money: where to begin, what to prioritize, and how to buy your first pieces without rushing into the wrong ones.',
    articleFormat: 'walkthrough',
    body: {
      sections: [
        {
          id: 'start-smaller-than-your-ego',
          title: 'Start smaller than your ego',
          blocks: [
            paragraph(
              'Most good collections do not begin with a grand thesis. They begin with one honest decision: buying something because the image keeps staying with you, then learning enough to understand why. Street art collecting works the same way. You do not need auction money to start. You need taste, patience, and enough discipline to avoid buying the first thing that flatters your idea of yourself.',
              ['1', '2']
            ),
            paragraph(
              'The practical entry point is usually editions, zines, small works on paper, artist-made objects, and release formats that still feel close to the artist rather than inflated by pure resale theatre.',
              ['1', '3']
            ),
            imageBlock({
              src: ART_HANGING_WOOD_BUILDING_IMAGE,
              alt: 'Framed art displayed in a home interior',
              caption: 'A first collection usually gets better when the work is chosen for a real room, not an imaginary future apartment.',
              credit: 'Clark Street Mercantile / Unsplash / Wikimedia Commons / CC0',
            }),
          ],
        },
        {
          id: 'buy-the-language-not-the-hype',
          title: 'Buy the language, not the hype',
          blocks: [
            paragraph(
              'A modest budget actually helps at the beginning because it forces better questions. Instead of chasing names, you start noticing what kind of visual language you return to: text-heavy work, rough print culture, graphic minimalism, painterly surfaces, political imagery, character-led pieces, or city-specific scenes.',
              ['1', '4']
            ),
            list([
              'Pick one lane first: prints, works on paper, zines, or small originals.',
              'Follow artists whose work still feels strong at domestic scale, not only on a giant wall.',
              'Compare at least three works before you buy one, so your taste becomes more specific.',
              'Leave room in the budget for framing, shipping, or simply waiting for a better piece.',
            ]),
          ],
        },
        {
          id: 'where-a-beginner-budget-goes-farthest',
          title: 'Where a beginner budget usually goes farthest',
          blocks: [
            paragraph(
              'If the goal is to learn while buying well, prints and paper are still the smartest place to begin. They let you study edition language, paper quality, signatures, publishers, and how different artists solve the wall-to-room problem without taking on the cost of a large original too early.',
              ['2', '3']
            ),
            imageBlock({
              src: DAVID_RUFF_PRINT_WORKSHOP_IMAGE,
              alt: 'Printmaker working in a workshop in San Francisco',
              caption: 'Spending time with real printmaking changes the way a collector reads paper, ink, and edition language.',
              credit: 'Susan Finnel Ruff / Wikimedia Commons / CC BY-SA 4.0',
            }),
            paragraph(
              'That does not mean everything affordable is worth having. Cheap can still be lazy. The useful test is whether the format feels native to the work, and whether the artist seems to care about how the piece exists once it leaves the screen or wall.',
              ['1', '2']
            ),
          ],
        },
        {
          id: 'what-your-first-year-should-actually-do',
          title: 'What your first year should actually do',
          blocks: [
            list([
              'Buy fewer things than you think.',
              'Keep images of the works you almost bought and compare them later.',
              'Let one or two small purchases teach you more than ten impulsive ones.',
              'Build a collection that sounds like your eye, not your feed.',
            ], ['1', '2']),
            paragraph(
              'A good early collection does not need to look expensive. It needs to look chosen. That is what makes people trust the taste before they trust the budget.',
              ['2']
            ),
          ],
        },
      ],
    },
    heroImage: PRINTS_ON_A_WALL_IMAGE,
    heroAlt: 'Framed prints arranged on a wall',
    imageCredit: 'Andrew Neel / Unsplash / Wikimedia Commons / CC0',
    publishedAt: '2026-05-01T18:00:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Street Art', 'Collector Guide', 'Prints'],
    category: 'Street-to-Studio Collecting',
    topicCluster: 'Collector Starters',
    sourceKind: 'benchmark-flagship',
    citations: [
      { id: '1', source: 'Artsy', title: '5 Essential Tips for Collecting Street Art', href: 'https://www.artsy.net/article/artsy-editorial-5-essential-tips-collecting-street-art' },
      { id: '2', source: 'Artsy', title: '5 Things Art Collectors Need to Know About Buying Prints', href: 'https://www.artsy.net/article/artsy-editorial-5-things-art-collectors-buying-prints' },
      { id: '3', source: 'Street Collector brief', title: 'SC_200_Blog_Briefs.xlsx - How to Start a Street Art Collection on Any Budget' },
      { id: '4', source: 'Printed Matter', title: 'Printed Matter catalog and editions context', href: 'https://www.printedmatter.org/' },
    ],
  }),
  articleFromBody({
    handle: 'what-is-a-certificate-of-authenticity-and-why-it-matters-for-street-art-prints',
    title: 'What a Certificate of Authenticity Actually Does for a Street Art Print',
    deck: 'The paperwork article collectors usually avoid until something feels off: what a certificate can tell you, what it cannot fix, and how it fits into the larger question of trust.',
    excerpt:
      'The paperwork article collectors usually avoid until something feels off: what a certificate can tell you, what it cannot fix, and how it fits into the larger question of trust.',
    articleFormat: 'field-guide',
    body: {
      sections: [
        {
          id: 'the-certificate-is-not-the-art',
          title: 'The certificate is not the art',
          blocks: [
            paragraph(
              'Collectors sometimes talk about certificates of authenticity as if they were magical documents. They are not. A certificate does not make a weak print stronger, and it does not rescue vague provenance. What it can do is document the relationship between the work, the artist or publisher, and the specific facts of the edition.',
              ['1', '2']
            ),
            imageBlock({
              src: SCREEN_PRINTING_PROCESS_IMAGE,
              alt: 'Screen-printing process in progress',
              caption: 'The more edition detail you understand, the easier it is to recognize when paperwork is saying something meaningful and when it is only performing seriousness.',
              credit: 'Wikimedia Commons',
            }),
          ],
        },
        {
          id: 'what-a-good-coa-should-cover',
          title: 'What a good COA should actually cover',
          blocks: [
            list([
              'Artist name and title of the work.',
              'Edition size and, when relevant, the number of the specific impression.',
              'Medium, support, and dimensions.',
              'Date of release or production.',
              'Issuer details: artist, publisher, gallery, or studio.',
              'Signature details when relevant.',
            ], ['1', '2']),
            paragraph(
              'That sounds basic, but it matters because street art editions often move through publishers, release platforms, collaborations, and artist-run drops. Clear paperwork helps you understand which part of that chain is standing behind the object.',
              ['1']
            ),
          ],
        },
        {
          id: 'what-a-coa-cannot-fix',
          title: 'What a COA cannot fix',
          blocks: [
            paragraph(
              'A certificate cannot compensate for bad images, no condition report, fuzzy seller language, or a print that feels disconnected from the artist’s actual practice. If the work itself raises questions, better paperwork is only one piece of the answer.',
              ['1', '3']
            ),
            list([
              'It cannot prove that a weak seller is suddenly reliable.',
              'It cannot replace provenance if the ownership history is already unclear.',
              'It cannot tell you whether the print is any good as an artwork.',
              'It cannot substitute for checking signatures, edition details, and overall condition yourself.',
            ], ['1', '3']),
          ],
        },
        {
          id: 'how-collectors-should-use-it',
          title: 'How collectors should use it',
          blocks: [
            paragraph(
              'Treat the certificate as part of a packet of evidence. The full packet is the print, the edition details, the seller, the images, the context of release, and the paperwork. When all of those agree with each other, confidence goes up. When one part feels theatrical while the others stay vague, slow down.',
              ['1', '2', '3']
            ),
            paragraph(
              'In practice, that mindset is far more useful than fetishizing the document itself. Serious collecting is not about accumulating paperwork. It is about understanding what the paperwork is doing for the work in front of you.',
              ['1']
            ),
          ],
        },
      ],
    },
    heroImage: COMPUTER_TO_SCREEN_IMAGE,
    heroAlt: 'Computer-to-screen print production setup',
    imageCredit: 'Wikimedia Commons',
    publishedAt: '2026-05-01T18:15:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Street Art', 'Authenticity', 'Prints'],
    category: 'Street-to-Studio Collecting',
    topicCluster: 'Edition Basics',
    sourceKind: 'benchmark-flagship',
    citations: [
      { id: '1', source: 'Artsy', title: 'What to Know Before Buying Prints', href: 'https://www.artsy.net/article/artsy-editorial-5-things-art-collectors-buying-prints' },
      { id: '2', source: 'Tate', title: 'Art Term: edition', href: 'https://www.tate.org.uk/art/art-terms/e/edition' },
      { id: '3', source: 'IFPDA', title: 'Fine print collecting resources', href: 'https://www.ifpda.org/' },
    ],
  }),
  articleFromBody({
    handle: 'the-art-of-the-zine-diy-print-culture-and-street-arts-paper-trail',
    title: 'The Art of the Zine: DIY Print Culture and Street Art’s Paper Trail',
    deck: 'A culture piece about the cheap, portable, deeply personal format that still tells you a great deal about how artists think before the gallery language arrives.',
    excerpt:
      'A culture piece about the cheap, portable, deeply personal format that still tells you a great deal about how artists think before the gallery language arrives.',
    articleFormat: 'walkthrough',
    body: {
      sections: [
        {
          id: 'why-zines-still-matter',
          title: 'Why zines still matter',
          blocks: [
            paragraph(
              'If murals are the public face of a scene, zines are often the pocket archive. They hold sketches, fragments, typography experiments, photo essays, Xerox grit, local jokes, scene gossip, and unfinished ideas that would be cleaned up too much in a gallery-ready edition. That is exactly why collectors who care about process keep coming back to them.',
              ['1', '2']
            ),
            imageBlock({
              src: ZINE_MAKING_TABLE_IMAGE,
              alt: 'Hand-drawn zines and cutting tools laid out on a table',
              caption: 'The zine format stays close to touch, sequencing, and hand decisions in a way polished editions often do not.',
              credit: 'National Park Service / Wikimedia Commons / Public Domain',
            }),
            videoBlock({
              title: 'How to Make a Zine: A Very Bay Area Tutorial',
              url: 'https://www.sfmoma.org/watch/art-bash-zine-workshop/',
              provider: 'SFMOMA',
            }),
          ],
        },
        {
          id: 'what-zines-capture-that-cleaner-editions-do-not',
          title: 'What zines capture that cleaner editions do not',
          blocks: [
            paragraph(
              'A good zine does not feel unfinished. It feels close. The drawings may be rougher, the reproduction cheaper, the sequencing stranger, but the voice is often less filtered. For artists moving between street culture, illustration, publishing, and print, that proximity can be more revealing than a polished release.',
              ['1', '3']
            ),
            paragraph(
              'This is where collectors can learn something useful. When an artist’s zines are compelling, you often get an early read on how they edit images, build rhythm, or think in series long before the larger market catches up.',
              ['2', '3']
            ),
            imageBlock({
              src: PEOPLE_VIEWING_ZINES_IMAGE,
              alt: 'People browsing local zines in a street-level space',
              caption: 'Zines often live in scenes, racks, and exchanges before they ever enter more formal collecting language.',
              credit: 'Museum of Reclaimed Urban Space / Wikimedia Commons / CC BY-SA 4.0',
            }),
          ],
        },
        {
          id: 'how-to-collect-zines-without-being-precious',
          title: 'How to collect zines without being precious',
          blocks: [
            imageBlock({
              src: EVENT_ZINE_PAGES_IMAGE,
              alt: 'Zine pages assembled for an art and feminism event publication',
              caption: 'The point is usually voice, circulation, and immediacy, not pristine object status.',
              credit: 'Gkuriger / Wikimedia Commons / CC BY-SA 4.0',
            }),
            list([
              'Look for voice and coherence before rarity.',
              'Pay attention to who published it and how the run was made.',
              'Treat wear honestly. Zines are handled objects, not sealed relics.',
              'If you love an artist’s prints, check whether the zines reveal the thinking behind them.',
            ], ['1', '2', '3']),
            paragraph(
              'Zine collecting gets awkward when people try to force it into luxury language. The point is not to pretend every stapled object is a masterpiece. The point is to recognize when a cheap format is carrying real artistic intelligence.',
              ['1']
            ),
          ],
        },
        {
          id: 'why-this-matters-for-street-collector',
          title: 'Why this matters for street art collecting',
          blocks: [
            paragraph(
              'Street art has always had a paper trail: stickers, paste-ups, photocopied flyers, posters, black books, artist books, and zines. If you ignore that ecology and look only at framed editions, you miss one of the most honest records of how scenes actually grow.',
              ['2', '3']
            ),
            paragraph(
              'For a collector, that matters because good taste is rarely built only from the final object. It grows from seeing the smaller formats that taught an artist how to think.',
              ['2']
            ),
          ],
        },
      ],
    },
    heroImage: HOT_OFF_THE_PRESS_BOOK_FAIR_IMAGE,
    heroAlt: 'Outdoor book and zine fair in Seattle',
    imageCredit: 'Joe Mabel / Wikimedia Commons / CC BY-SA 4.0',
    publishedAt: '2026-05-01T18:30:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Graphic Art', 'Print Culture', 'Zines'],
    category: 'Graphic Art & Print Culture',
    topicCluster: 'DIY Print Culture',
    sourceKind: 'benchmark-flagship',
    citations: [
      { id: '1', source: 'Printed Matter', title: 'Printed Matter', href: 'https://www.printedmatter.org/' },
      { id: '2', source: 'RISO', title: 'What is RISO Art?', href: 'https://www.riso.co.jp/english/company/risoart/concept.html' },
      { id: '3', source: 'It\'s Nice That', title: 'Risograph coverage', href: 'https://www.itsnicethat.com/search?tags=risograph' },
    ],
  }),
  articleFromBody({
    handle: 'public-art-vs-collectible-print-understanding-what-youre-actually-buying',
    title: 'Public Art vs. Collectible Print: What You’re Actually Buying',
    deck: 'A clearer way to think about the wall-to-room shift: why a mural and a print are not competing versions of the same thing, and how collectors can judge each on its own terms.',
    excerpt:
      'A clearer way to think about the wall-to-room shift: why a mural and a print are not competing versions of the same thing, and how collectors can judge each on its own terms.',
    articleFormat: 'field-guide',
    body: {
      sections: [
        {
          id: 'the-mistake-is-thinking-one-is-a-miniature-of-the-other',
          title: 'The mistake is thinking one is a miniature of the other',
          blocks: [
            paragraph(
              'A mural can carry risk, weather, scale, neighborhood tension, and improvisation. A print carries sequence, paper, finish, domestic scale, and the logic of repetition. When collectors confuse those experiences, they tend to either romanticize the wall or undersell the print.',
              ['1', '2']
            ),
            imageBlock({
              src: PEOPLES_WALL_IMAGE,
              alt: 'Street artwork in an urban setting',
              caption: 'A wall work lives inside a site, a route, and a city rhythm before it ever becomes a collectible image.',
              credit: 'Joe Mabel / Wikimedia Commons / CC BY-SA 4.0',
            }),
          ],
        },
        {
          id: 'what-public-art-is-doing',
          title: 'What public art is doing that a print cannot',
          blocks: [
            paragraph(
              'Public work is inseparable from context. It argues with architecture, decay, traffic, neighborhood memory, permission, trespass, local style, and the simple fact that people encounter it by accident. That is part of its force. The wall is not just a surface. It is a condition of meaning.',
              ['1', '3']
            ),
            list([
              'Scale changes how the body meets the image.',
              'Location changes how the image reads.',
              'Weather and time become part of the work’s life.',
              'The audience is mixed, accidental, and not self-selected.',
            ], ['1', '3']),
          ],
        },
        {
          id: 'what-a-collectible-print-needs-to-do-instead',
          title: 'What a collectible print needs to do instead',
          blocks: [
            paragraph(
              'A print does not need to imitate the drama of a mural to succeed. It needs to become convincing at the scale where people actually live with it. That usually means better composition, sharper editing, more deliberate color decisions, and an image that can survive repetition without feeling dead.',
              ['2', '4']
            ),
            imageBlock({
              src: FLAUNTER_INTERIOR_IMAGE,
              alt: 'Interior with framed artwork and shelving',
              caption: 'The collector test is whether the work still feels charged once it enters daily life.',
              credit: 'Flaunter / Unsplash / Wikimedia Commons / CC0',
            }),
            paragraph(
              'The best editions are not souvenirs of public work. They are separate objects with their own reason for existing.',
              ['2']
            ),
          ],
        },
        {
          id: 'how-to-judge-the-translation',
          title: 'How to judge the translation',
          blocks: [
            list([
              'Ask what the artist kept from the wall and what they were smart enough to leave behind.',
              'Look for a format that feels native to the image, not just marketable.',
              'Compare the emotional temperature of the mural and the print rather than expecting them to be identical.',
              'Treat the best print as a solved design problem, not a reduced mural.',
            ], ['1', '2', '4']),
            paragraph(
              'Once you see the distinction clearly, buying gets easier. You stop asking whether the print is as exciting as the wall and start asking whether it is persuasive as a print.',
              ['2']
            ),
          ],
        },
      ],
    },
    heroImage: BERLIN_WALL_EAST_SIDE_IMAGE,
    heroAlt: 'Berlin Wall East Side Gallery',
    imageCredit: 'Wikimedia Commons',
    publishedAt: '2026-05-01T18:45:00.000Z',
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Street Art', 'Prints', 'Collector Guide'],
    category: 'Street-to-Studio Collecting',
    topicCluster: 'Wall to Room',
    sourceKind: 'benchmark-flagship',
    citations: [
      { id: '1', source: 'Street Art Cities', title: 'Street Art Cities platform', href: 'https://streetartcities.com/' },
      { id: '2', source: 'Artsy', title: 'How to Buy Street Art', href: 'https://www.artsy.net/article/artsy-editorial-buy-street-art' },
      { id: '3', source: 'Juxtapoz', title: 'Street art coverage', href: 'https://www.juxtapoz.com/street-art/' },
      { id: '4', source: 'The Met', title: 'Screenprint and printmaking materials and techniques', href: 'https://www.metmuseum.org/perspectives/materials-and-techniques-printmaking-screenprint' },
    ],
  }),
]

function buildArtistArticle(slug: string, entry: ArtistResearchEntry): EditorialArticle {
  const artistName = cleanText(entry.artistName) || slug.replace(/-/g, ' ')
  const location = cleanText(entry.location)
  const image = getArtistImage(entry)
  const hook = firstSentence(entry.heroHook || entry.storyFullText, `${artistName} has a practice worth slowing down for.`)
  const story = cleanText(entry.storyFullText) || hook
  const pullQuote = cleanText(entry.pullQuote)
  const citations = parseSourceLinks(entry.sourcesLinks).map((url, index) => ({
    id: String(index + 1),
    title: hostnameFromUrl(url) || url,
    href: url,
    source: hostnameFromUrl(url) || 'Web source',
  }))
  const contextLines = [...parseContextLines(entry.exhibitionsText, 3), ...parseContextLines(entry.pressText, 3)].slice(0, 4)
  const cues = inferCollectorCues(entry)
  const format = chooseArtistArticleFormat(entry)
  const deck = artistDeckForFormat(artistName, format, hook)

  return articleFromBody({
    handle: `artist-guide-${slug}`,
    title: artistTitleForFormat(artistName, format),
    deck,
    excerpt: deck,
    articleFormat: 'profile',
    body: buildArtistBody(artistName, location, story, hook, cues, contextLines, image, citations, pullQuote, format),
    heroImage: image,
    heroAlt: image ? `Artwork or process image connected to ${artistName}` : null,
    imageCredit: image ? `Reference image via ${hostnameFromUrl(image) || 'artist source'}` : null,
    publishedAt: PUBLISHED_AT,
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: inferTags(entry),
    category: 'Artists to Watch',
    topicCluster: 'Artist Radar',
    city: location || undefined,
    sourceKind: 'artist-enrichment',
    citations,
    relatedArtistSlug: slug,
  })
}

function buildRoundupArticle(theme: string, handle: string, artists: Array<[string, ArtistResearchEntry]>, topicCluster: string): EditorialArticle | null {
  if (artists.length < 2) return null

  const artistList = artists.slice(0, 10)
  const items = artistList.map(([slug, entry]) => {
    const artistName = cleanText(entry.artistName) || slug.replace(/-/g, ' ')
    const hook = firstSentence(entry.heroHook || entry.storyFullText, `${artistName} has a practice worth tracking.`)
    return `${artistName} — ${hook}`
  })

  return articleFromBody({
    handle,
    title: theme,
    deck: 'A roundup for collectors who want a faster way into emerging names without pretending every file is already a finished profile.',
    excerpt: 'A roundup for collectors who want a faster way into emerging names without pretending every file is already a finished profile.',
    articleFormat: 'roundup',
    body: {
      sections: [
        {
          id: 'before-you-scroll',
          title: 'Before you scroll the names',
          blocks: [
            paragraph('This is not a ranking and it is not a promise that every artist here is ready for a full collector profile. Think of it as a table conversation: the names worth circling back to because something in the work has real traction.'),
            paragraph('Use the list the way a careful collector would: notice the image language first, then ask whether the available context is strong enough to support deeper attention.'),
          ],
        },
        {
          id: 'artists-to-return-to',
          title: 'Names worth a second look',
          blocks: [list(items)],
        },
        {
          id: 'how-to-use-the-list',
          title: 'How to use the list like a collector',
          blocks: [
            paragraph('When the public record is still thin, confidence comes from process rather than certainty. Ask for better images, edition information, provenance, and current availability before treating an emerging artist as a finished market story.'),
            paragraph(`The right follow-up is usually simple: pick two or three names from this list, compare how the work behaves across formats, and only then decide who deserves the longer read.`),
          ],
        },
      ],
    },
    heroImage: artistList.map(([, entry]) => getArtistImage(entry)).find(Boolean) || null,
    heroAlt: theme,
    imageCredit: 'Reference image from artist enrichment sources',
    publishedAt: PUBLISHED_AT,
    lastReviewedAt: REVIEWED_AT,
    author: AUTHOR,
    tags: ['Street Art'],
    category: 'Artists to Watch',
    topicCluster,
    sourceKind: 'artist-roundup',
    citations: [],
  })
}

function isThinArtistArticle(entry: ArtistResearchEntry): boolean {
  const storyWords = cleanText(entry.storyFullText).split(/\s+/).filter(Boolean).length
  const contextWords = cleanText(`${entry.pressText || ''} ${entry.exhibitionsText || ''}`).split(/\s+/).filter(Boolean).length
  return storyWords < 45 && contextWords < 45
}

function uniqueArtistEntries(): Array<[string, ArtistResearchEntry]> {
  const seenNames = new Set<string>()

  return Object.entries(artistResearchData as Record<string, ArtistResearchEntry>).filter(([slug, entry]) => {
    const name = cleanText(entry.artistName).toLowerCase() || slug
    if (seenNames.has(name)) return false
    seenNames.add(name)
    return true
  })
}

function buildArtistArticles(): EditorialArticle[] {
  const entries = uniqueArtistEntries()
  const strongEntries = entries.filter(([, entry]) => !isThinArtistArticle(entry))
  const thinEntries = entries.filter(([, entry]) => isThinArtistArticle(entry))
  const artistArticles = strongEntries.map(([slug, entry]) => buildArtistArticle(slug, entry))

  const streetThin = thinEntries.filter(([, entry]) => /street|mural|graffiti|wall/i.test(`${entry.storyFullText || ''} ${entry.exhibitionsText || ''}`))
  const graphicThin = thinEntries.filter(([, entry]) => /illustrat|graphic|poster|character|animation/i.test(`${entry.storyFullText || ''} ${entry.additionalHistoryText || ''}`))
  const remainingThin = thinEntries.filter((entry) => !streetThin.includes(entry) && !graphicThin.includes(entry))

  const roundups = [
    buildRoundupArticle('Street-to-Studio Artists to Watch', 'roundup-street-to-studio-artists-to-watch', streetThin, 'Artist Radar'),
    buildRoundupArticle('Graphic Voices to Watch', 'roundup-graphic-voices-to-watch', graphicThin, 'Graphic Art'),
    buildRoundupArticle('Emerging Collector Notes from the Enrichment Files', 'roundup-emerging-collector-notes', remainingThin, 'Collector Notes'),
  ].filter(Boolean) as EditorialArticle[]

  return [...artistArticles, ...roundups]
}

function inferFallbackCategory(article: SyncedArticle): EditorialArticleCategory {
  const text = `${article.handle} ${article.title}`.toLowerCase()
  if (/tel-aviv|city|guide|neighborhood|scene/.test(text)) return 'City Field Guides'
  if (/print|edition|collect/.test(text)) return 'Street-to-Studio Collecting'
  if (/gift|decor|graphic|poster/.test(text)) return 'Collector Notes'
  return 'Collector Notes'
}

function syncedToEditorialArticle(article: SyncedArticle): EditorialArticle {
  const excerpt = article.excerpt || firstSentence(stripHtml(article.contentHtml), `Read ${article.title}.`)
  return {
    handle: article.handle,
    title: article.title,
    deck: excerpt,
    excerpt,
    articleFormat: 'field-guide',
    contentHtml: article.contentHtml,
    body: undefined,
    heroImage: article.imageUrl,
    heroAlt: article.imageAlt || article.title,
    imageCredit: article.imageUrl?.includes('shopify') ? 'Shopify-synced blog image' : null,
    publishedAt: article.publishedAt,
    lastReviewedAt: REVIEWED_AT,
    author: article.authorName,
    tags: article.tags.length ? article.tags : ['Street Art'],
    category: inferFallbackCategory(article),
    topicCluster: 'Legacy Shopify',
    sourceKind: 'shopify-fallback',
    readingTime: readingTimeFromText(stripHtml(article.contentHtml)),
    citations: [],
  }
}

function uniqueArticlesByHandle(articles: EditorialArticle[]): EditorialArticle[] {
  const seen = new Set<string>()
  return articles.filter((article) => {
    if (seen.has(article.handle)) return false
    seen.add(article.handle)
    return true
  })
}

export const localEditorialArticles: EditorialArticle[] = uniqueArticlesByHandle([...LOCAL_EDITORIAL_ARTICLES, ...buildArtistArticles()])

export function getAllEditorialArticles(): EditorialArticle[] {
  const localHandles = new Set(localEditorialArticles.map((article) => article.handle))
  const fallbackArticles = syncedArticles.filter((article) => !localHandles.has(article.handle)).map(syncedToEditorialArticle)

  return [...localEditorialArticles, ...fallbackArticles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getEditorialArticle(handle: string): EditorialArticle | undefined {
  return getAllEditorialArticles().find((article) => article.handle === handle)
}

export function getEditorialFilters(): string[] {
  const availableFilters = new Set<string>()

  getAllEditorialArticles().forEach((article) => {
    availableFilters.add(article.category)
    article.tags.forEach((tag) => {
      if (FIXED_FILTERS.includes(tag)) {
        availableFilters.add(tag)
      }
    })
  })

  return FIXED_FILTERS.filter((filter) => availableFilters.has(filter))
}

export function getRelatedEditorialArticles(article: EditorialArticle, limit = 3): EditorialArticle[] {
  return getAllEditorialArticles()
    .filter((candidate) => candidate.handle !== article.handle)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => article.tags.includes(tag)).length
      const categoryScore = candidate.category === article.category ? 2 : 0
      const topicScore = candidate.topicCluster === article.topicCluster ? 1 : 0
      return { candidate, score: sharedTags + categoryScore + topicScore }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.candidate)
}

export function getEditorialArticleHandles(): Array<{ handle: string }> {
  return getAllEditorialArticles().map((article) => ({ handle: article.handle }))
}
