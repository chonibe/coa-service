import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Street Collector. Questions about your order, our stores, or current collections? Our team is here and ready to help.',
}

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@thestreetlamp.com'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-6">
              Contact Us
            </h1>
            <p className="text-lg text-[#1a1a1a]/80 mb-10">
              We love to hear from you. If you&apos;d like to get in touch about your online order, our stores, or current collections, our team is here and ready to help.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Email</h2>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[#2c4bce] hover:underline font-medium"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="text-sm text-[#1a1a1a]/60 mt-1">
                  The quickest way to reach us. We aim to respond within 24 hours during business days.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Support Hours</h2>
                <p className="text-[#1a1a1a]/80">
                  Monday to Friday: 8am – 8:30pm
                </p>
                <p className="text-sm text-[#1a1a1a]/60 mt-1">
                  Average response time: 24h
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Personal Data Requests</h2>
                <p className="text-[#1a1a1a]/80">
                  Our customer service team can also handle your personal data requests in relation to your rights stated in our Privacy Notice. You can write to us at the email above. If you wish to contact our Data Protection Officer, please include &quot;DPO&quot; in the subject line.
                </p>
              </div>
            </div>
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
