import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { ContactFormClient } from './ContactFormClient'
import { getStorePageContent } from '@/lib/content/site-content'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact Street Collector for order questions, support, and general inquiries.',
  alternates: { canonical: '/shop/contact' },
}

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@thestreetlamp.com'
const contactContent = getStorePageContent('contact')

export default function ContactPage() {

  return (
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em] mb-6">
              {contactContent.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-10">
              {contactContent.hero.subtitle}
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">{contactContent.sidebar.emailTitle}</h2>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-experience-highlight hover:underline font-medium"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contactContent.sidebar.emailBody}
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">{contactContent.sidebar.hoursTitle}</h2>
                  <p className="text-muted-foreground">
                    {contactContent.sidebar.hoursBody}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contactContent.sidebar.hoursHint}
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">{contactContent.sidebar.dataTitle}</h2>
                  <p className="text-muted-foreground">
                    {contactContent.sidebar.dataBody}
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
