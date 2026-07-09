import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { Check } from 'lucide-react'
import { getStorePageContent } from '@/lib/content/site-content'

export const metadata: Metadata = {
  title: 'Wholesale',
  description:
    'Wholesale partnerships for concept stores, museum shops, galleries, and design-led retail spaces.',
  alternates: { canonical: '/shop/wholesale' },
}

const WHOLESALE_EMAIL = 'info@thestreetlamp.com'
const WHOLESALE_MAILTO = `mailto:${WHOLESALE_EMAIL}?subject=Wholesale%20Inquiry&body=${encodeURIComponent(`Hi Street Collector,

I'm interested in partnering with you for wholesale. Please find my details below:

Business Name:
Contact Person:
Business Address:
Phone Number:
Website or Instagram:
Business Type (concept store, museum shop, gallery, online store, etc.):
Estimated Order Quantity:
Products of Interest (Lamp only, Lamp + Editions, Specific Artist Drops):
Any Additional Information or Questions:

Thank you,
`)}`

const wholesaleContent = getStorePageContent('wholesale')

export default function WholesalePage() {
  return (
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em] mb-6">
              {wholesaleContent.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {wholesaleContent.hero.subtitle}
            </p>
            <p className="text-muted-foreground mb-12">
              {wholesaleContent.intro}
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            <p className="text-muted-foreground mb-6">
              {wholesaleContent.details.intro}
            </p>
            <h2 className="text-xl font-semibold text-foreground mb-4">{wholesaleContent.details.title}</h2>
            <ul className="space-y-2 mb-10">
              {wholesaleContent.details.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <Check className="w-5 h-5 shrink-0 text-[#00a341] mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={WHOLESALE_MAILTO}
              className="inline-flex items-center justify-center h-14 px-8 text-lg font-semibold bg-[#047AFF] text-white rounded-[60px] hover:opacity-[0.85] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2"
            >
              {wholesaleContent.details.ctaLabel}
            </a>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.2} duration={0.8}>
            <div className="mt-16 pt-12 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                {wholesaleContent.partnerReasons.title}
              </h2>
              <ul className="space-y-2 mb-8">
                {wholesaleContent.partnerReasons.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground">
                    <Check className="w-5 h-5 shrink-0 text-[#00a341] mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {wholesaleContent.partnerReasons.notes.map((note, index) => (
                <p key={note} className={index < wholesaleContent.partnerReasons.notes.length - 1 ? 'text-muted-foreground mb-4' : 'text-muted-foreground'}>
                  {index === 1 ? (
                    <>
                      New wholesale partners may begin with a reduced minimum order of <strong>30 lamps</strong> on their first order, subject to availability.
                    </>
                  ) : (
                    note
                  )}
                </p>
              ))}
            </div>
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
