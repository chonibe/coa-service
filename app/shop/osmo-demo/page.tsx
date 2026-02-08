/**
 * Osmo-Inspired Components Demo
 * 
 * Showcases all 4 Osmo-inspired components:
 * 1. ButtonRotate - Rolling button animations
 * 2. FlickCards - Interactive card grid
 * 3. AccordionFAQ - Smooth expand/collapse
 * 4. ModalSystem - GSAP-powered modals
 */

import { Metadata } from 'next'
import { Container, SectionWrapper } from '@/components/impact'
import { ButtonRotate } from '@/components/impact'
import { FlickCards } from '@/components/shop/FlickCards'
import { AccordionFAQ } from '@/components/sections/AccordionFAQ'
import { ModalSystem } from '@/components/sections/ModalSystem'
import { CircularCarousel } from '@/components/shop/CircularCarousel'
import { getCollection } from '@/lib/shopify/storefront-client'
import { homepageContent } from '@/content/homepage'

export const metadata: Metadata = {
  title: 'Osmo-Inspired Components - Street Collector',
  description: 'Demo of Osmo-inspired GSAP components',
}

export const dynamic = 'force-dynamic'

export default async function OsmoDemoPage() {
  // Fetch products for demos
  let bestSellers: any[] = []
  let newReleases: any[] = []

  try {
    const [bestSellersCollection, newReleasesCollection] = await Promise.all([
      getCollection(homepageContent.bestSellers.collectionHandle, { first: 8, sortKey: 'MANUAL' }).catch(() => null),
      getCollection(homepageContent.newReleases.collectionHandle, { first: 6, sortKey: 'MANUAL' }).catch(() => null),
    ])

    bestSellers = bestSellersCollection?.products.edges.map(e => e.node) || []
    newReleases = newReleasesCollection?.products.edges.map(e => e.node) || []
  } catch (error) {
    console.error('Failed to fetch products:', error)
  }

  // Transform products to FlickCard format
  const flickCardsData = newReleases.slice(0, 6).map((product, index) => ({
    id: product.id,
    title: product.title,
    description: product.description?.substring(0, 100),
    imageUrl: product.featuredImage?.url || '/placeholder.jpg',
    href: `/shop/${product.handle}`,
    tag: index === 0 ? 'New' : index === 1 ? 'Limited' : undefined,
    tagVariant: (index === 0 ? 'new' : index === 1 ? 'limited' : undefined) as 'new' | 'limited' | undefined,
  }))

  // FAQ data
  const faqCategories = [
    {
      id: 'shipping',
      title: 'Shipping',
      items: [
        {
          id: 'ship-1',
          question: 'Do you ship internationally?',
          answer: 'Yes! We ship to most countries worldwide. Shipping costs and delivery times vary by location.',
          defaultOpen: true,
        },
        {
          id: 'ship-2',
          question: 'How long does shipping take?',
          answer: 'Domestic orders typically arrive within 3-5 business days. International orders can take 7-14 business days depending on customs.',
        },
        {
          id: 'ship-3',
          question: 'Do you offer express shipping?',
          answer: 'Yes, express shipping options are available at checkout for faster delivery.',
        },
      ],
    },
    {
      id: 'returns',
      title: 'Returns',
      items: [
        {
          id: 'ret-1',
          question: 'What is your return policy?',
          answer: 'We accept returns within 30 days of delivery for a full refund, provided items are in original condition.',
        },
        {
          id: 'ret-2',
          question: 'How do I start a return?',
          answer: 'Contact our support team with your order number, and we\'ll provide a return shipping label.',
        },
      ],
    },
    {
      id: 'products',
      title: 'Products',
      items: [
        {
          id: 'prod-1',
          question: 'Are your artworks limited edition?',
          answer: 'Yes, all artworks are limited edition prints with certificates of authenticity.',
        },
        {
          id: 'prod-2',
          question: 'Can I request custom artwork?',
          answer: 'We occasionally accept custom commissions. Please contact us to discuss your project.',
        },
      ],
    },
  ]

  return (
    <main className="bg-white">
      {/* Hero Section with Rotating Buttons */}
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="default" paddingX="gutter">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-6">
              Osmo-Inspired Components
            </h1>
            <p className="text-xl text-[#1a1a1a]/70 mb-8">
              Interactive GSAP-powered components inspired by Osmo's design system
            </p>

            {/* Button Showcase */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <ButtonRotate variant="electric" size="lg" shape="pill">
                Explore Collection
              </ButtonRotate>
              <ButtonRotate variant="neutral" size="lg" shape="rounded">
                View All Products
              </ButtonRotate>
              <ButtonRotate variant="outline" size="md" shape="pill">
                Learn More
              </ButtonRotate>
              <ButtonRotate variant="purple" size="sm" shape="rounded">
                Join Now
              </ButtonRotate>
            </div>
          </div>
        </Container>
      </SectionWrapper>

      {/* Flick Cards Grid */}
      {flickCardsData.length > 0 && (
        <SectionWrapper spacing="lg" background="subtle">
          <Container maxWidth="default" paddingX="gutter">
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl sm:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                Flick Cards Gallery
              </h2>
              <p className="text-lg text-[#1a1a1a]/70">
                Interactive cards with magnetic hover and 3D rotation
              </p>
            </div>

            <FlickCards
              cards={flickCardsData}
              columns={{ mobile: 1, tablet: 2, desktop: 3 }}
              gap="lg"
              enableMagnetic={true}
              enableFlip={true}
            />
          </Container>
        </SectionWrapper>
      )}

      {/* Circular Carousel */}
      {bestSellers.length > 0 && (
        <CircularCarousel
          title="Product Carousel"
          description="Drag to browse, click to explore"
          products={bestSellers}
        />
      )}

      {/* Accordion FAQ */}
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl sm:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[#1a1a1a]/70">
              Smooth GSAP-powered accordion
            </p>
          </div>

          <AccordionFAQ
            categories={faqCategories}
            defaultCategory="shipping"
            closeSiblings={true}
          />
        </Container>
      </SectionWrapper>

      {/* Component Breakdown Section */}
      <SectionWrapper spacing="lg" background="subtle">
        <Container maxWidth="default" paddingX="gutter">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-semibold text-[#1a1a1a] mb-6">
              Components Overview
            </h2>
            
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-xl shadow-sm">
                <h3 className="font-semibold text-xl mb-2">1. ButtonRotate</h3>
                <p className="text-[#1a1a1a]/70">
                  3D rolling button effect with smooth GSAP transitions. Multiple label copies create seamless rotation on hover.
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-sm">
                <h3 className="font-semibold text-xl mb-2">2. FlickCards</h3>
                <p className="text-[#1a1a1a]/70">
                  Interactive card grid with magnetic hover, 3D perspective rotation, and staggered entrance animations.
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-sm">
                <h3 className="font-semibold text-xl mb-2">3. CircularCarousel</h3>
                <p className="text-[#1a1a1a]/70">
                  Product carousel with cards arranged in a semi-circle. Drag to rotate, cards fan out like a clock face showing 10, 12, 2 o'clock positions.
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-sm">
                <h3 className="font-semibold text-xl mb-2">4. AccordionFAQ</h3>
                <p className="text-[#1a1a1a]/70">
                  Categorized FAQ system with smooth GSAP expand/collapse, rotating icons, and auto-close siblings.
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-sm">
                <h3 className="font-semibold text-xl mb-2">5. ModalSystem</h3>
                <p className="text-[#1a1a1a]/70">
                  Portal-based modal with GSAP animations, backdrop blur, and smooth scale transitions.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>
    </main>
  )
}
