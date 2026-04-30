import { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { landingFontVariables } from '../landing-fonts'
import styles from '../landing.module.css'
import { LandingNav } from '../components/LandingNav'
import { LandingHero } from '../components/LandingHero'
import { TrustBar } from '../components/TrustBar'
import { MeetTheLamp } from '../components/MeetTheLamp'
import { StepsSection } from '../components/StepsSection'
import { ArtistsWall } from '../components/ArtistsWall'
import { TestimonialsSection } from '../components/TestimonialsSection'
import { GuaranteeSection } from '../components/GuaranteeSection'
import { FaqSectionLanding } from '../components/FaqSectionLanding'
import { FinalCta } from '../components/FinalCta'
import { LandingFooter } from '../components/LandingFooter'
import { MobileStickyCta } from '@/components/shop/MobileStickyCta'
import { JsonLd } from '@/components/seo/JsonLd'

const LANDING_TITLE =
  'Street Collector — Not Just a Lamp. A Living Art Collection.'
const LANDING_DESCRIPTION =
  'A premium backlit lamp with interchangeable street art prints from artists worldwide. Collect. Swap. Own something truly original.'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  alternates: {
    canonical: '/shop/home-v2',
  },
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    url: '/shop/home-v2',
    siteName: 'Street Collector',
    type: 'website',
    images: [
      {
        url: homeV2LandingContent.urls.openGraphImageUrl,
        alt: 'Street Collector lamp and art collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [homeV2LandingContent.urls.openGraphImageUrl],
  },
}

export const revalidate = 600

function buildLandingJsonLd() {
  const origin = getCanonicalSiteOrigin().toString().replace(/\/$/, '')
  const pageUrl = `${origin}/shop/home-v2/landing`
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeV2LandingContent.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  const videoObject = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Street Collector — A Living Art Collection',
    description: LANDING_DESCRIPTION,
    thumbnailUrl: [
      ('videoPosterUrl' in homeV2LandingContent.hero
        ? (homeV2LandingContent.hero as { videoPosterUrl?: string }).videoPosterUrl
        : undefined) ?? homeV2LandingContent.urls.openGraphImageUrl,
    ],
    contentUrl: homeV2LandingContent.hero.videoUrl,
    uploadDate: '2024-01-01',
  }
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: pageUrl,
    name: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Street Collector',
      url: origin,
    },
  }
  return [webPage, faqPage, videoObject]
}

export default function HomeV2LandingPage() {
  return (
    <div className={`${styles.page} ${landingFontVariables}`}>
      <JsonLd id="landing-jsonld" data={buildLandingJsonLd()} />
      <LandingNav />
      <main>
        <LandingHero />
        <TrustBar />
        <MeetTheLamp />
        <StepsSection />
        <ArtistsWall />
        <TestimonialsSection />
        <GuaranteeSection />
        <FaqSectionLanding />
        <FinalCta />
      </main>
      <LandingFooter />
      <MobileStickyCta
        href={homeV2LandingContent.urls.experience}
        label={homeV2LandingContent.hero.ctaText}
      />
    </div>
  )
}

