import { Metadata } from 'next'
import { Container, SectionWrapper, buttonVariants } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { MutedVideo } from '@/components/MutedVideo'
import { getStorePageContent } from '@/lib/content/site-content'

export const metadata: Metadata = {
  title: 'Affiliate Program',
  description:
    'Join the Street Collector affiliate program. Start at 10% commission, with higher tiers for stronger partners.',
  alternates: { canonical: '/shop/collab' },
}

const COLLABS_APPLY_URL =
  process.env.NEXT_PUBLIC_COLLABS_SIGNUP_URL ||
  'https://api.collabs.shopify.com/creator/signup/community_application/DjezgK7DizI?origin=THEME_EXTENSION'

const HERO_VIDEO_URL =
  'https://cdn.shopify.com/videos/c/vp/e16722752a44428689d98ffecf6fa016/e16722752a44428689d98ffecf6fa016.HD-1080p-4.8Mbps-71755744.mp4'
const collabContent = getStorePageContent('collab')

export default function CollabPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Video Hero */}
      <section className="relative w-full aspect-video bg-neutral-900 overflow-hidden">
        <MutedVideo
          src={HERO_VIDEO_URL}
          autoPlay
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          aria-label="Affiliate program hero video"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-white tracking-[-0.02em] drop-shadow-lg">
              {collabContent.hero.title}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-white/90 max-w-xl mx-auto">
              {collabContent.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            <div className="mb-12 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                {collabContent.pitch.title}
              </p>
              <p className="text-muted-foreground">
                {collabContent.pitch.body}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 mb-16">
              {collabContent.steps.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-experience-highlight/10 text-experience-highlight font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.body}
                </p>
              </div>
              ))}
            </div>

            <div className="rounded-2xl bg-muted p-8 sm:p-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {collabContent.apply.eyebrow}
              </p>
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                {collabContent.apply.title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {collabContent.apply.body}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={COLLABS_APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'primary' })}
                >
                  {collabContent.apply.createAccountCta}
                </a>
                <a
                  href={COLLABS_APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline' })}
                >
                  {collabContent.apply.signInCta}
                </a>
              </div>
            </div>
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
