import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { ContactFormClient } from './ContactFormClient'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact Street Collector for order questions, support, and general inquiries.',
  alternates: { canonical: '/shop/contact' },
}

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@thestreetlamp.com'

export default function ContactPage() {

  return (
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em] mb-6">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground mb-10">
              If you need help with an order, have a question about the collection, or just need the right person, write to us here.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Email</h2>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-experience-highlight hover:underline font-medium"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usually the fastest way to reach us. We aim to reply within one business day.
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Support Hours</h2>
                  <p className="text-muted-foreground">
                    Monday to Friday: 8am – 8:30pm
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Typical response time: within 24 hours
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Personal Data Requests</h2>
                  <p className="text-muted-foreground">
                    You can also use this inbox for personal data requests covered by our Privacy Notice. If your message is for our Data Protection Officer, include &quot;DPO&quot; in the subject line.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ContactFormClient contactEmail={CONTACT_EMAIL} />
          </div>
        </Container>
      </SectionWrapper>
    </main>
  )
}
