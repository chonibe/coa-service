import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join Street Collector. We\'re building a team of passionate people who believe art belongs in the physical world. View our open positions.',
  alternates: { canonical: '/shop/careers' },
}

const CAREERS_URL = process.env.NEXT_PUBLIC_CAREERS_URL

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em] mb-8">
              Join Street Collector
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              We&apos;re building a team of passionate people who believe art belongs in the physical world—not just on screens. If you love contemporary art, storytelling, and bringing people together through collectible culture, we want to hear from you.
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
                  View Open Positions
                </a>
                <p className="text-muted-foreground text-sm">
                  You&apos;ll be redirected to our careers portal to browse and apply for open roles.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted p-8">
                <p className="text-muted-foreground mb-6">
                  If you think you would be a strong fit for Street Collector, send us a note. We&apos;re happy to hear from people who want to help shape what we&apos;re building.
                </p>
                <a
                  href="mailto:info@thestreetlamp.com?subject=Careers%20Inquiry"
                  className="inline-flex items-center justify-center h-11 px-6 text-base font-semibold bg-[#047AFF] text-white rounded-[60px] hover:opacity-[0.85] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2"
                >
                  Email us about careers
                </a>
              </div>
            )}
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
