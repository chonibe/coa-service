import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPage as getPageFromShopify } from '@/lib/shopify/pages'
import { getPage as getSyncedPage, hasPage } from '@/content/shopify-content'
import { Container, SectionWrapper, Breadcrumb } from '@/components/impact'
import { ScrollReveal, ParallaxLayer } from '@/components/blocks'

// =============================================================================
// METADATA
// =============================================================================

interface PageParams {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { handle } = await params
  
  // Try synced content first, then fall back to API
  let title = handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  let description = ''
  
  if (hasPage(handle)) {
    const page = getSyncedPage(handle)
    if (page) {
      title = page.title
      description = page.bodySummary
    }
  } else {
    const page = await getPageFromShopify(handle)
    if (page) {
      title = page.seo?.title || page.title
      description = page.seo?.description || page.bodySummary
    }
  }
  
  return {
    title: `${title} | Street Collector`,
    description: description || `Learn more about ${title}`,
  }
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function ShopifyPage({ params }: PageParams) {
  const { handle } = await params
  
  // Try synced content first for faster load
  if (hasPage(handle)) {
    const page = getSyncedPage(handle)
    if (page) {
      return <PageContent title={page.title} body={page.body} />
    }
  }
  
  // Fall back to API if not in synced content
  const page = await getPageFromShopify(handle)
  
  if (!page) {
    notFound()
  }
  
  return <PageContent title={page.title} body={page.body} />
}

// =============================================================================
// PAGE CONTENT COMPONENT
// =============================================================================

function PageContent({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Home', href: '/shop' },
              { label: 'Pages', href: '/shop' },
              { label: title }
            ]}
            className="mb-6"
          />
          
          {/* Page Title with Scroll Reveal */}
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-8">
              {title}
            </h1>
          </ScrollReveal>
          
          {/* Page Content with Scroll Reveal */}
          <ScrollReveal animation="fadeUp" delay={0.2} duration={0.8}>
            <div 
              className="prose prose-lg max-w-none
                prose-headings:font-heading prose-headings:font-semibold prose-headings:text-[#1a1a1a]
                prose-p:text-[#1a1a1a]/80 prose-p:leading-relaxed
                prose-a:text-[#2c4bce] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[#1a1a1a]
                prose-ul:text-[#1a1a1a]/80 prose-ol:text-[#1a1a1a]/80
                prose-img:rounded-xl
              "
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </ScrollReveal>
        </Container>
      </SectionWrapper>
    </main>
  )
}
