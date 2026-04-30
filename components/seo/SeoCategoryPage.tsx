import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import type { SeoCategoryPage as SeoCategoryPageContent } from '@/content/seo-category-pages'
import { absoluteShopUrl } from '@/lib/seo/site-url'

type Props = {
  page: SeoCategoryPageContent
}

export function SeoCategoryPage({ page }: Props) {
  const pageUrl = absoluteShopUrl(`/${page.slug}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: page.h1,
        url: pageUrl,
        description: page.description,
        hasPart: page.relatedArticles?.map((article) => ({
          '@type': 'Article',
          name: article.label,
          url: absoluteShopUrl(article.href),
        })),
        isPartOf: {
          '@type': 'WebSite',
          name: 'Street Collector',
          url: absoluteShopUrl('/'),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteShopUrl('/') },
          { '@type': 'ListItem', position: 2, name: page.title, item: pageUrl },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <JsonLd id={`${page.slug}-jsonld`} data={jsonLd} />
      <section className="border-b border-[#1a1a1a]/10 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#047AFF]">
            Street Collector guide
          </p>
          <h1 className="font-serif text-4xl font-medium leading-tight tracking-normal text-[#1a1a1a] sm:text-5xl lg:text-6xl">
            {page.h1}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#1a1a1a]/75">
            {page.answer}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop/products"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#047AFF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0366d6]"
            >
              Shop artworks
            </Link>
            <Link
              href="/shop/explore-artists"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#1a1a1a]/20 px-5 py-3 text-sm font-semibold text-[#1a1a1a] transition-colors hover:border-[#1a1a1a]/40"
            >
              Explore artists
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <aside>
            <h2 className="font-serif text-2xl font-medium tracking-normal">Why it matters</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#1a1a1a]/75">
              {page.proof.map((item) => (
                <li key={item} className="border-l-2 border-[#047AFF] pl-4">
                  {item}
                </li>
              ))}
            </ul>
          </aside>
          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-serif text-2xl font-medium tracking-normal text-[#1a1a1a]">
                  {section.heading}
                </h2>
                <p className="mt-3 text-base leading-8 text-[#1a1a1a]/75">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f7] px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-medium tracking-normal">Questions collectors ask</h2>
          <div className="mt-8 divide-y divide-[#1a1a1a]/10">
            {page.faqs.map((faq) => (
              <div key={faq.question} className="py-6">
                <h3 className="text-lg font-semibold text-[#1a1a1a]">{faq.question}</h3>
                <p className="mt-2 text-base leading-7 text-[#1a1a1a]/70">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {page.relatedArticles && page.relatedArticles.length > 0 && (
            <div className="mb-10 border-b border-[#1a1a1a]/10 pb-10">
              <h2 className="font-serif text-2xl font-medium tracking-normal">Related guides</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {page.relatedArticles.map((article) => (
                  <Link
                    key={article.href}
                    href={article.href}
                    className="rounded-lg border border-[#1a1a1a]/10 p-4 text-sm font-semibold text-[#1a1a1a] transition-colors hover:border-[#047AFF] hover:text-[#047AFF]"
                  >
                    {article.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <h2 className="font-serif text-2xl font-medium tracking-normal">Keep exploring</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {page.related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#1a1a1a]/15 px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:border-[#047AFF] hover:text-[#047AFF]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
