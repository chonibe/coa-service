import { Metadata } from 'next'
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

const LANDING_TITLE =
  'Street Collector — Not Just a Lamp. A Living Art Collection.'
const LANDING_DESCRIPTION =
  'A premium backlit lamp with interchangeable street art prints from artists worldwide. Collect. Swap. Own something truly original.'

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://app.thestreetcollector.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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

export const dynamic = 'force-dynamic'

export default function HomeV2LandingPage() {
  return (
    <div className={`${styles.page} ${landingFontVariables}`}>
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
    </div>
  )
}

