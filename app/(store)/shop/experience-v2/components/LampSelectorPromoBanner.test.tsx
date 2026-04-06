import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LampSelectorPromoBanner } from './LampSelectorPromoBanner'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { alt, src } = props
    /* eslint-disable-next-line @next/next/no-img-element -- test double for next/image */
    return <img alt={String(alt ?? '')} src={String(src ?? '')} />
  },
}))

const minimalLamp = {
  id: 'gid://shopify/Product/1',
  handle: 'street-lamp',
  title: 'Street Lamp Pro',
  description: '',
  descriptionHtml: '',
  vendor: 'Street Collector',
  productType: '',
  tags: [],
  availableForSale: true,
  priceRange: {
    minVariantPrice: { amount: '199.00', currencyCode: 'USD' },
    maxVariantPrice: { amount: '199.00', currencyCode: 'USD' },
  },
  compareAtPriceRange: {
    minVariantPrice: { amount: '0', currencyCode: 'USD' },
    maxVariantPrice: { amount: '0', currencyCode: 'USD' },
  },
  featuredImage: { url: 'https://cdn.shopify.com/lamp.jpg', altText: null },
  images: { edges: [] },
  variants: { edges: [] },
  options: [],
  metafields: null,
} as ShopifyProduct

describe('LampSelectorPromoBanner', () => {
  it('calls onAddLamp when bundle CTA is clicked', () => {
    const onAddLamp = jest.fn()
    render(
      <LampSelectorPromoBanner
        lamp={minimalLamp}
        priceUsd={199}
        detailOpen={false}
        onOpenDetail={jest.fn()}
        onCloseDetail={jest.fn()}
        onAddLamp={onAddLamp}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /start your bundle with a street lamp/i }))
    expect(onAddLamp).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenDetail when header row is activated', () => {
    const onOpenDetail = jest.fn()
    render(
      <LampSelectorPromoBanner
        lamp={minimalLamp}
        priceUsd={199}
        detailOpen={false}
        onOpenDetail={onOpenDetail}
        onCloseDetail={jest.fn()}
        onAddLamp={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /view street lamp pro details/i }))
    expect(onOpenDetail).toHaveBeenCalledTimes(1)
  })

  it('calls onCloseDetail when collapse control is visible', () => {
    const onCloseDetail = jest.fn()
    render(
      <LampSelectorPromoBanner
        lamp={minimalLamp}
        priceUsd={199}
        detailOpen
        onOpenDetail={jest.fn()}
        onCloseDetail={onCloseDetail}
        onAddLamp={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /close lamp details/i }))
    expect(onCloseDetail).toHaveBeenCalledTimes(1)
  })
})
