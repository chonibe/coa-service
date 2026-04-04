import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'

export type FaqPair = { question: string; answer: string }

const SC_EDITION_SENTENCE =
  'Each artwork on Street Collector is released as a limited run; edition sizes are shown on the product page.'

/**
 * FAQs shared between visible UI and FAQPage JSON-LD (must match exactly).
 */
export function buildArtistFaqPairs(artist: ArtistProfileApiResponse): FaqPair[] {
  const name = artist.name
  const editionCount = artist.stats?.editionCount ?? artist.products.length
  const q1 = `Is ${name}'s work available as a limited edition print?`
  const a1 = `Yes. You can collect ${name}'s limited edition street art prints on Street Collector, shipped with a Certificate of Authenticity.`

  const q2 = `How many artworks by ${name} are on Street Collector?`
  const a2 =
    editionCount > 0
      ? `Street Collector currently lists ${editionCount} limited edition artwork${editionCount === 1 ? '' : 's'} by ${name}. ${SC_EDITION_SENTENCE}`
      : `Browse ${name}'s collection on Street Collector for current limited edition releases. ${SC_EDITION_SENTENCE}`

  const q3 = 'What is Street Collector?'
  const a3 =
    'Street Collector is a premium illuminated art lamp with swappable limited-edition street art prints. Collect prints from independent artists, display them backlit, and own editioned work with a Certificate of Authenticity.'

  return [
    { question: q1, answer: a1 },
    { question: q2, answer: a2 },
    { question: q3, answer: a3 },
  ]
}

export function buildGlobalScFaqPairs(): FaqPair[] {
  return [
    {
      question: 'What is a limited edition street art print on Street Collector?',
      answer:
        'Limited edition prints are produced in a fixed quantity per artwork. They ship with a Certificate of Authenticity and are designed to be displayed in the Street Collector lamp or framed like traditional art prints.',
    },
    {
      question: 'How does the Street Collector lamp work?',
      answer:
        'The lamp is a backlit display. You swap vinyl prints in and out so your wall art can change with your collection.',
    },
    {
      question: 'What is a Certificate of Authenticity for art?',
      answer:
        'A Certificate of Authenticity documents the edition and provenance of your print. Street Collector provides COA documentation with eligible limited edition works.',
    },
  ]
}
