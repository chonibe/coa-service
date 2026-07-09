import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { getStorePageContent } from '@/lib/content/site-content'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join Street Collector. We are building a team that believes art belongs in the physical world. View our open positions.',
  alternates: { canonical: '/shop/careers' },
}

const CAREERS_URL = process.env.NEXT_PUBLIC_CAREERS_URL
const careersContent = getStorePageContent('careers')

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em] mb-8">
              {careersContent.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {careersContent.hero.subtitle}
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            {CAREERS_URL ? (
              <div className="space-y-6">
                <a
                  href={CAREERS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-semibold bg-[#047AFF] text-white rounded-[60px] hover:opacity-[0.85] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2"
                >
                  {careersContent.portal.ctaLabel}
                </a>
                <p className="text-muted-foreground text-sm">
                  {careersContent.portal.redirectNotice}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted p-8">
                <p className="text-muted-foreground mb-6">
                  {careersContent.fallback.body}
                </p>
                <a
                  href="mailto:info@thestreetlamp.com?subject=Careers%20Inquiry"
                  className="inline-flex items-center justify-center h-11 px-6 text-base font-semibold bg-[#047AFF] text-white rounded-[60px] hover:opacity-[0.85] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2"
                >
                  {careersContent.fallback.ctaLabel}
                </a>
              </div>
            )}
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
