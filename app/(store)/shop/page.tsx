import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * /shop Route - Redirect to Street Collector Homepage
 *
 * The main shop landing shows the Street Collector–inspired homepage at /shop/street-collector.
 * Alternative home layouts: /shop/home, /shop/home-v2
 * Product listing is available at /shop/products
 */
export default function ShopPage() {
  redirect('/shop/street-collector')
}
