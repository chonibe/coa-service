import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { landingFontVariables } from '../home-v2/landing-fonts'
import { getStorePageContent } from '@/lib/content/site-content'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import styles from './home-v3.module.css'

const content = getStorePageContent('homeV2')

const TITLE = 'Street Collector — A New Home Landing'
const DESCRIPTION =
  'An alternative Street Collector landing page built around artist discovery, interchangeable artworks, and a clearer path into the collection.'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/shop/home-v3',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/shop/home-v3',
    siteName: 'Street Collector',
    type: 'website',
    images: [
      {
        url: content.urls.openGraphImageUrl,
        alt: 'Street Collector alternative landing page',
      },
    ],
  },
}

const featureCards = [
  {
    eyebrow: 'Collect',
    title: 'Own the work, not a generic print.',
    body:
      'Every edition comes from an independent artist in the roster. You collect through the artist, not through an anonymous decor grid.',
  },
  {
    eyebrow: 'Swap',
    title: 'Change the room in seconds.',
    body:
      'Keep the lamp. Rotate the artwork. Let the room shift with your taste instead of locking into one image for years.',
  },
  {
    eyebrow: 'Support',
    title: 'A real share goes back to the artist.',
    body:
      'This is not marketplace wallpaper. The work stays tied to a person, a practice, and a collector relationship that keeps building over time.',
  },
]

const merchandisingCards = [
  {
    title: 'Build your lamp setup',
    body: 'Start with the display, choose the first work, and see how the collection fits together.',
    href: '/experience',
    cta: 'Start with the lamp',
    tone: 'primary' as const,
  },
  {
    title: 'Meet the artists',
    body: 'Browse the roster, open artist pages, and collect through the names that actually stay with you.',
    href: '/shop/explore-artists',
    cta: 'Explore artists',
    tone: 'secondary' as const,
  },
]

export default function HomeV3Page() {
  const { hero, trust, artistsWall, testimonials, steps, finalCta, nav, urls } = content
  const artistTiles = artistsWall.tiles.slice(0, 12)
  const collectorQuotes = [
    ...testimonials.videos.map((item) => ({ author: item.author, quote: item.quote })),
    ...testimonials.texts.map((item) => ({ author: item.author, quote: item.quote })),
  ].slice(0, 4)

  return (
    <div className={`${styles.page} ${landingFontVariables}`}>
      <nav className={styles.nav} aria-label="Primary">
        <Link href={urls.home} aria-label="Street Collector Home">
          <Image
            src={nav.logoImageUrl}
            alt={nav.logoAlt}
            width={160}
            height={32}
            style={{ height: 32, width: 'auto', display: 'block' }}
            priority
          />
        </Link>
        <div className={styles.navLinks}>
          <Link href="/shop/explore-artists">Artists</Link>
          <Link href="/shop/faq">FAQ</Link>
          <Link href="/shop/contact">Contact</Link>
        </div>
        <Link href="/experience" className={styles.navCta}>
          Build your setup
        </Link>
      </nav>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroMedia}>
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={'videoPosterUrl' in hero ? (hero as { videoPosterUrl?: string }).videoPosterUrl : undefined}
            >
              <source src={hero.videoUrl} type="video/mp4" />
            </video>
          </div>

          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>{hero.eyebrow}</div>
            <h1 className={styles.heroTitle}>
              Not just a lamp.
              <br />
              <em>A living art collection.</em>
            </h1>
            <p className={styles.heroBody}>
              Collect limited-edition street art from independent artists, light it up, and keep
              changing the room without starting over.
            </p>
            <p className={styles.heroPricing}>
              Lamp from <strong>{hero.pricingLine.lampFrom}</strong> · Artworks from{' '}
              <strong>{hero.pricingLine.artworksFrom}</strong>
            </p>
            <div className={styles.heroActions}>
              <Link href="/experience" className={styles.primaryButton}>
                Build your setup
              </Link>
              <Link href="/shop/explore-artists" className={styles.secondaryButton}>
                Explore artists
              </Link>
            </div>
            <div className={styles.heroNote}>
              Free worldwide shipping · 12-month guarantee · 30-day returns
            </div>
          </div>
        </section>

        <section className={styles.trustRail} aria-label="Trust signals">
          {trust.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionIntro}>
            <div className={styles.eyebrow}>Why it lands</div>
            <h2 className={styles.sectionTitle}>
              The format stays useful.
              <br />
              <em>The collection keeps moving.</em>
            </h2>
          </div>
          <div className={styles.featureGrid}>
            {featureCards.map((card) => (
              <article key={card.title} className={styles.featureCard}>
                <div className={styles.cardEyebrow}>{card.eyebrow}</div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.merchSection}>
          <div className={styles.merchHeader}>
            <div className={styles.eyebrow}>Start anywhere</div>
            <h2 className={styles.sectionTitle}>
              Enter through the object.
              <br />
              <em>Or through the artist.</em>
            </h2>
          </div>
          <div className={styles.merchGrid}>
            {merchandisingCards.map((card) => (
              <article key={card.title} className={styles.merchCard}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <Link
                  href={card.href}
                  className={card.tone === 'primary' ? styles.primaryButton : styles.secondaryButton}
                >
                  {card.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.artistSection}>
          <div className={styles.sectionIntro}>
            <div className={styles.eyebrow}>{artistsWall.eyebrow}</div>
            <h2 className={styles.sectionTitle}>
              100+ artists.
              <br />
              <em>Across the roster.</em>
            </h2>
          </div>
          <div className={styles.artistGrid}>
            {artistTiles.map((artist) => (
              <article key={artist.name} className={styles.artistCard}>
                <div className={styles.artistImageWrap}>
                  <Image
                    src={artist.imageUrl}
                    alt={artist.name}
                    fill
                    sizes="(max-width: 820px) 50vw, 20vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.artistMeta}>
                  <span>{artist.name}</span>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.artistCta}>
            <Link href="/shop/explore-artists" className={styles.secondaryButton}>
              View all artists
            </Link>
          </div>
        </section>

        <section className={styles.stepsSection}>
          <div className={styles.sectionIntro}>
            <div className={styles.eyebrow}>{steps.eyebrow}</div>
            <h2 className={styles.sectionTitle}>
              Collect. Insert.
              <br />
              <em>Change.</em>
            </h2>
          </div>
          <div className={styles.stepGrid}>
            {steps.items.map((step, index) => (
              <article key={step.tabTitle} className={styles.stepCard}>
                <div className={styles.stepNumber}>0{index + 1}</div>
                <h3>{step.tabTitle}</h3>
                <p>{step.bodyText}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.quoteSection}>
          <div className={styles.sectionIntro}>
            <div className={styles.eyebrow}>Collector voices</div>
            <h2 className={styles.sectionTitle}>
              The work lands
              <br />
              <em>in real rooms.</em>
            </h2>
          </div>
          <div className={styles.quoteGrid}>
            {collectorQuotes.map((quote) => (
              <article
                key={`${quote.author}-${quote.quote.slice(0, 20)}`}
                className={styles.quoteCard}
              >
                <p>&quot;{quote.quote}&quot;</p>
                <span>{quote.author}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.finalSection}>
          <div className={styles.finalBackdrop} aria-hidden />
          <div className={styles.finalContent}>
            <h2 className={styles.finalTitle}>
              Your room deserves
              <br />
              <em>original art.</em>
            </h2>
            <p>{finalCta.subtitle}</p>
            <div className={styles.finalActions}>
              <Link href="/experience" className={styles.primaryButton}>
                Build your setup
              </Link>
              <Link href="/shop/explore-artists" className={styles.secondaryButton}>
                Meet the artists
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
