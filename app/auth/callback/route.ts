import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function sanitizeRedirectUri(baseUrl: string, path: string): string {
  // Remove trailing and leading slashes, then join with a single slash
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/+/, '')
  return `${cleanBaseUrl}/${cleanPath}`
}

function getRedirectUri(): string {
  // Prioritize environment-specific redirect URIs for Street Lamp
  const redirectUris = [
    process.env.NEXT_PUBLIC_VERCEL_REDIRECT_URI,
    process.env.NEXT_PUBLIC_PROD_REDIRECT_URI,
    process.env.NEXT_PUBLIC_LOCAL_REDIRECT_URI
  ].filter(Boolean)

  // Determine current environment with nuanced detection
  const isVercel = process.env.VERCEL === '1'
  const isProduction = process.env.NODE_ENV === 'production'
  const hasVercelUrl = !!process.env.VERCEL_URL

  let selectedRedirectUri: string | undefined

  // Prioritize based on environment
  if (isVercel || hasVercelUrl) {
    selectedRedirectUri = process.env.NEXT_PUBLIC_VERCEL_REDIRECT_URI
  } else if (isProduction) {
    selectedRedirectUri = process.env.NEXT_PUBLIC_PROD_REDIRECT_URI
  } else {
    // Default to local for development
    selectedRedirectUri = process.env.NEXT_PUBLIC_LOCAL_REDIRECT_URI
  }

  // Fallback and validation
  if (!selectedRedirectUri) {
    console.warn('No valid redirect URI could be determined')
    throw new Error('No valid redirect URI could be generated')
  }

  return selectedRedirectUri
}

export async function GET(request: NextRequest) {
  const shop = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com'

  try {
    // Fetch the logged-in customer's information
    const customerResponse = await fetch(`https://${shop}/admin/api/2024-01/customers.json`, {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
        'Content-Type': 'application/json'
      }
    })

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text()
      console.error('Customer Fetch Error:', errorText)
      throw new Error('Failed to fetch customer information')
    }

    const customerData = await customerResponse.json()
    const primaryCustomer = customerData.customers && customerData.customers[0]
    
    if (!primaryCustomer) {
      throw new Error('No customer found')
    }

    // Prepare cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }

    // Upsert customer in Supabase
    const { data: upsertedCustomer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        shopify_customer_id: primaryCustomer.id,
        email: primaryCustomer.email,
        first_name: primaryCustomer.first_name,
        last_name: primaryCustomer.last_name,
        metadata: {
          source: 'shopify_customer_login',
          last_login: new Date().toISOString()
        }
      }, {
        onConflict: 'shopify_customer_id'
      })

    if (customerError) {
      console.error('Customer Upsert Error:', customerError)
    }

    // Set cookies and redirect to dashboard
    const response = NextResponse.redirect(
      new URL(`/customer/dashboard`, request.url)
    )

    // Set essential cookies
    response.cookies.set('shopify_customer_id', primaryCustomer.id.toString(), cookieOptions)
    response.cookies.set('customer_email', primaryCustomer.email, cookieOptions)

    return response

  } catch (error) {
    console.error('Authentication Error:', error)
    return NextResponse.redirect(new URL('/customer/dashboard', request.url))
  }
} 