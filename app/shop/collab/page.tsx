import { Metadata } from 'next'
import { Container, SectionWrapper, buttonVariants } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'

export const metadata: Metadata = {
  title: 'Affiliate Program',
  description:
    'Collect culture. Earn with it. Join the Street Collector affiliate program—start with 10% commission. Top performers unlock higher tiers.',
}

const COLLABS_APPLY_URL =
  process.env.NEXT_PUBLIC_COLLABS_SIGNUP_URL ||
  'https://api.collabs.shopify.com/creator/signup/community_application/DjezgK7DizI?origin=THEME_EXTENSION'

const HERO_VIDEO_URL =
  'https://cdn.shopify.com/videos/c/vp/e16722752a44428689d98ffecf6fa016/e16722752a44428689d98ffecf6fa016.HD-1080p-4.8Mbps-71755744.mp4'

export default function CollabPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Video Hero */}
      <section className="relative w-full aspect-video bg-neutral-900 overflow-hidden">
        <video
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          aria-label="Affiliate program hero video"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-white tracking-[-0.02em] drop-shadow-lg">
              Collect Culture. Earn With It.
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-white/90 max-w-xl mx-auto">
              As your impact grows, your commission increases.
            </p>
          </div>
        </div>
      </section>

      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            <div className="mb-12 text-center">
              <p className="text-lg font-semibold text-[#1a1a1a] mb-2">
                Start with 10% commission.
              </p>
              <p className="text-[#1a1a1a]/80">
                Top-performing partners unlock higher tiers and priority access to limited drops.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#2c4bce]/10 text-[#2c4bce] font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-2">Register</h3>
                <p className="text-sm text-[#1a1a1a]/80">
                  Click the button and register as a collab.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#2c4bce]/10 text-[#2c4bce] font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-2">Share</h3>
                <p className="text-sm text-[#1a1a1a]/80">
                  Share your unique collab link on your Facebook, Twitter, Blog, Website, or wherever you&apos;d like!
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#2c4bce]/10 text-[#2c4bce] font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-2">Get Commissions</h3>
                <p className="text-sm text-[#1a1a1a]/80">
                  Refer to your collabs dashboard and watch your commissions roll in!
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f5f5f5] p-8 sm:p-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#1a1a1a]/60 mb-2">
                Street Collector
              </p>
              <h3 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                Limited partner spots available.
              </h3>
              <p className="text-[#1a1a1a]/80 mb-6">
                To apply, create a Collab account or sign in to your existing one.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={COLLABS_APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'primary' })}
                >
                  Create account & apply
                </a>
                <a
                  href={COLLABS_APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Sign in to apply
                </a>
              </div>
            </div>
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
