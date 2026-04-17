import type { Metadata } from "next"
import Link from "next/link"
import { Container, SectionWrapper, Button } from "@/components/impact"
import { ScrollReveal } from "@/components/blocks"
import { SUPPORT_EMAIL, supportMailto } from "@/lib/constants/support"

export const metadata: Metadata = {
  title: "For artists — The Street Collector",
  description:
    "A portal for the artists we work with. Sell limited editions, track sales, and run your catalog on the same brand that ships your work to collectors.",
}

const steps = [
  {
    n: "01",
    title: "Apply",
    body:
      "Share your work and a little about your practice. We review every application; no automated gates.",
  },
  {
    n: "02",
    title: "We get in touch",
    body:
      "If it's a match, we reach out to align on the first edition, pricing, and how your work ships to collectors.",
  },
  {
    n: "03",
    title: "Your portal",
    body:
      "Once you're on board, sign in here to manage editions, track sales, and request payouts on your schedule.",
  },
]

const bullets = [
  {
    title: "Your work, on real lamps",
    body:
      "We print and ship physical pieces that collectors keep — no abstract royalties, no invisible licensing.",
  },
  {
    title: "One portal, not five tabs",
    body:
      "Sales, payouts, catalog, and messages live in the same quiet place. You don't need to learn a new tool every week.",
  },
  {
    title: "Paid for the work you did",
    body:
      "We track every edition you sell, pay in USD, and let you request payouts when the balance is yours.",
  },
]

export default function ForArtistsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-6">
              For artists
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] tracking-[-0.02em] leading-[1.05] mb-8">
              A portal for the artists we work with.
            </h1>
            <p className="font-body text-lg sm:text-xl text-[#1a1a1a]/70 leading-relaxed max-w-2xl mb-10">
              Sell limited editions, track sales, and run your catalog on the same brand
              that ships your work to collectors around the world.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild variant="primary" size="lg">
                <Link href="/for-artists/apply">Apply to join</Link>
              </Button>
              <Link
                href="/login?intent=vendor"
                className="font-body text-sm font-medium text-[#1a1a1a] underline underline-offset-4"
              >
                Already an artist? Sign in
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </SectionWrapper>

      {/* What we do for you */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" delay={0.05} duration={0.8}>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-10">
              What the portal gives you
            </h2>
          </ScrollReveal>
          <div className="grid gap-8 md:grid-cols-3">
            {bullets.map((b, idx) => (
              <ScrollReveal
                key={b.title}
                animation="fadeUp"
                delay={0.1 + idx * 0.05}
                duration={0.8}
              >
                <div className="border-t border-[#1a1a1a]/10 pt-6">
                  <h3 className="font-heading text-lg font-semibold text-[#1a1a1a] mb-3">
                    {b.title}
                  </h3>
                  <p className="font-body text-[#1a1a1a]/70 leading-relaxed">
                    {b.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </SectionWrapper>

      {/* How it works */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-10">
              How it works
            </h2>
          </ScrollReveal>
          <div className="space-y-10">
            {steps.map((step, idx) => (
              <ScrollReveal
                key={step.n}
                animation="fadeUp"
                delay={0.05 + idx * 0.05}
                duration={0.8}
              >
                <div className="flex gap-6 sm:gap-10">
                  <span className="font-heading text-2xl sm:text-3xl text-[#1a1a1a]/40 w-14 shrink-0">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] mb-2">
                      {step.title}
                    </h3>
                    <p className="font-body text-[#1a1a1a]/70 leading-relaxed max-w-xl">
                      {step.body}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </SectionWrapper>

      {/* How to apply CTA */}
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <div className="border-t border-[#1a1a1a]/10 pt-10">
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                Ready to apply?
              </h2>
              <p className="font-body text-[#1a1a1a]/70 leading-relaxed max-w-xl mb-8">
                Tell us a little about your practice. We read every application ourselves
                and typically reply within two weeks. Questions first?{" "}
                <a
                  href={supportMailto("Artist portal question")}
                  className="underline underline-offset-4"
                >
                  Email {SUPPORT_EMAIL}
                </a>
                .
              </p>
              <Button asChild variant="primary" size="lg">
                <Link href="/for-artists/apply">Start your application</Link>
              </Button>
            </div>
          </ScrollReveal>
        </Container>
      </SectionWrapper>
    </main>
  )
}
