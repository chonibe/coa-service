import type { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { getCachedProductByHandle } from '@/lib/shop/cached-shop-data'
import { buildProductDescription, buildProductTitle } from '@/lib/seo/product-meta'
import { ProductDetailJsonLd } from '@/components/seo/ProductDetailJsonLd'

type Props = {
  children: React.ReactNode
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { handle } = await params
  const product = await getCachedProductByHandle(handle)
  if (!product) {
    return {
      title: 'Product | Street Collector',
      description: 'Limited edition street art prints and the Street Collector lamp.',
    }
  }

  const title = buildProductTitle(product)
  const description = buildProductDescription(product)
  const base = getCanonicalSiteOrigin()

  return {
    metadataBase: base,
    title,
    description,
    alternates: { canonical: `/shop/${handle}` },
    openGraph: {
      title,
      description,
      url: `/shop/${handle}`,
      siteName: 'Street Collector',
      type: 'website',
      images: product.featuredImage?.url
        ? [{ url: product.featuredImage.url, alt: product.title }]
        : undefined,
    },
    twitter: {
      card: product.featuredImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: product.featuredImage?.url ? [product.featuredImage.url] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

export default async function ShopProductLayout({ children, params }: Props) {
  const { handle } = await params
  const product = await getCachedProductByHandle(handle)

  return (
    <>
      {product ? <ProductDetailJsonLd product={product} /> : null}
      {children}
    </>
  )
}
