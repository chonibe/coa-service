import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * /shop Route - Redirect to Homepage
 * 
 * The main shop landing should show the rich homepage content
 * (videos, featured products, etc.) at /shop/home
 * 
 * Product listing is available at /shop/products
 */
export default function ShopPage() {
  redirect('/shop/home')
}
