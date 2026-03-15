/**
 * POST /api/shop/newsletter
 *
 * Newsletter signup - adds email to Shopify customer list with marketing consent.
 * Uses Shopify Admin API to create/update customer with accepts_marketing.
 */

import { NextResponse } from 'next/server'
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from '@/lib/env'
import { sendMetaServerEvent } from '@/lib/meta-conversions-server'
import { sendTikTokEvent } from '@/lib/tiktok-events-server'

const API_VERSION = '2024-01'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (!SHOPIFY_SHOP) {
      console.error('[newsletter] Shopify shop not configured')
      return NextResponse.json(
        { error: 'Newsletter signup is not configured' },
        { status: 503 }
      )
    }

    const baseUrl = `https://${SHOPIFY_SHOP}/admin/api/${API_VERSION}`

    // Try to create customer with marketing consent
    const createRes = await fetch(`${baseUrl}/customers.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        customer: {
          email,
          accepts_marketing: true,
          tags: 'newsletter-signup',
        },
      }),
    })

    if (createRes.ok) {
      // Fire Meta Lead event for newsletter signup
      await sendMetaServerEvent({
        eventName: 'Lead',
        userData: {
          em: email,
        },
        customData: {
          lead_type: 'newsletter',
        },
      }).catch((err) => {
        // Log but don't fail the request if Meta event fails
        console.error('[newsletter] Failed to send Meta Lead event:', err)
      })

      // Fire TikTok SubmitForm event for newsletter signup
      await sendTikTokEvent({
        event: 'SubmitForm',
        userData: {
          email,
        },
        properties: {
          content_type: 'newsletter_signup',
        },
      }).catch((err) => {
        // Log but don't fail the request if TikTok event fails
        console.error('[newsletter] Failed to send TikTok SubmitForm event:', err)
      })

      return NextResponse.json({ success: true })
    }

    const createData = await createRes.json().catch(() => ({}))
    const errors = createData?.errors || createData?.customer?.errors

    // If customer already exists (422), try to find and update marketing consent
    if (createRes.status === 422) {
      const searchRes = await fetch(
        `${baseUrl}/customers/search.json?query=email:${encodeURIComponent(email)}`,
        {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          },
        }
      )

      if (searchRes.ok) {
        const searchData = await searchRes.json()
        const customers = searchData?.customers || []
        const customer = customers[0]

        if (customer?.id) {
          const updateRes = await fetch(`${baseUrl}/customers/${customer.id}.json`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            },
            body: JSON.stringify({
              customer: {
                id: customer.id,
                accepts_marketing: true,
              },
            }),
          })

          if (updateRes.ok) {
            // Fire Meta Lead event for newsletter signup (update case)
            await sendMetaServerEvent({
              eventName: 'Lead',
              userData: {
                em: email,
              },
              customData: {
                lead_type: 'newsletter',
              },
            }).catch((err) => {
              // Log but don't fail the request if Meta event fails
              console.error('[newsletter] Failed to send Meta Lead event:', err)
            })

            // Fire TikTok SubmitForm event for newsletter signup (update case)
            await sendTikTokEvent({
              event: 'SubmitForm',
              userData: {
                email,
              },
              properties: {
                content_type: 'newsletter_signup',
              },
            }).catch((err) => {
              // Log but don't fail the request if TikTok event fails
              console.error('[newsletter] Failed to send TikTok SubmitForm event:', err)
            })

            return NextResponse.json({ success: true })
          }
        }
      }

      // Customer exists - treat as success (avoid revealing if email is in system)
      // Fire Meta Lead event even if customer already exists (they're still a lead)
      await sendMetaServerEvent({
        eventName: 'Lead',
        userData: {
          em: email,
        },
        customData: {
          lead_type: 'newsletter',
        },
      }).catch((err) => {
        // Log but don't fail the request if Meta event fails
        console.error('[newsletter] Failed to send Meta Lead event:', err)
      })

      // Fire TikTok SubmitForm event even if customer already exists
      await sendTikTokEvent({
        event: 'SubmitForm',
        userData: {
          email,
        },
        properties: {
          content_type: 'newsletter_signup',
        },
      }).catch((err) => {
        // Log but don't fail the request if TikTok event fails
        console.error('[newsletter] Failed to send TikTok SubmitForm event:', err)
      })

      return NextResponse.json({ success: true })
    }

    console.error('[newsletter] Shopify API error:', createRes.status, errors)
    return NextResponse.json(
      { error: 'Unable to complete signup. Please try again.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('[newsletter] Error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
