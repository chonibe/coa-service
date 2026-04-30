import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Wholesale',
  description:
    'Partner with Street Collector. We collaborate with concept stores, museum shops, galleries, and design-led spaces. Wholesale partnerships reviewed by alignment.',
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

const detailsToInclude = [
  'Business Name',
  'Contact Person',
  'Business Address',
  'Phone Number',
  'Website or Instagram',
  'Business Type (concept store, museum shop, gallery, online store, etc.)',
  'Estimated Order Quantity',
  'Products of Interest (Lamp only, Lamp + Editions, Specific Artist Drops)',
  'Any Additional Information or Questions',
]

const whyPartner = [
  'Curated limited editions from international artists',
  'A collectible system, not a one-off product',
  'Strong storytelling that drives in-store engagement',
  'Limited production runs that create urgency',
  'Direct access to upcoming artist drops',
]

export default function WholesalePage() {
  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-6">
              Wholesale with Street Collector®
            </h1>
            <p className="text-lg text-[#1a1a1a]/80 mb-8">
              Thank you for your interest in partnering with Street Collector.
            </p>
            <p className="text-[#1a1a1a]/80 mb-12">
              We collaborate with carefully selected concept stores, museum shops, galleries, and design-led spaces that value contemporary art, storytelling, and collectible culture.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            <p className="text-[#1a1a1a]/80 mb-6">
              If you would like to carry The Street Lamp and selected artist editions in your store, please email us with the following information:
            </p>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4">Details to Include</h2>
            <ul className="space-y-2 mb-10">
              {detailsToInclude.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[#1a1a1a]/80">
                  <Check className="w-5 h-5 shrink-0 text-[#00a341] mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={WHOLESALE_MAILTO}
              className="inline-flex items-center justify-center h-14 px-8 text-lg font-semibold bg-[#047AFF] text-white rounded-[60px] hover:opacity-[0.85] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2"
            >
              Contact us
            </a>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.2} duration={0.8}>
            <div className="mt-16 pt-12 border-t border-[#1a1a1a]/10">
              <h2 className="text-xl font-semibold text-[#1a1a1a] mb-6">
                Why Partner with Street Collector
              </h2>
              <ul className="space-y-2 mb-8">
                {whyPartner.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[#1a1a1a]/80">
                    <Check className="w-5 h-5 shrink-0 text-[#00a341] mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#1a1a1a]/80 mb-4">
                We operate in limited production cycles. Wholesale partnerships are reviewed based on alignment with our brand and audience.
              </p>
              <p className="text-[#1a1a1a]/80 mb-4">
                New wholesale partners may begin with a reduced minimum order of <strong>30 lamps</strong> on their first order, subject to availability.
              </p>
              <p className="text-[#1a1a1a]/80">
                Shipping available worldwide. Lead times vary depending on edition availability.
              </p>
            </div>
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
