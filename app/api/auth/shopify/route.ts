import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      )
    }

    // Verify customer exists in Shopify
    const shopifyResponse = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2023-10/customers/${customerId}.json`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    )

    if (!shopifyResponse.ok) {
      return NextResponse.json(
        { error: "Invalid Shopify customer" },
        { status: 401 }
      )
    }

    // Create or sign in user in Supabase
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${customerId}@shopify.com`,
      password: customerId,
    })

    if (signInError) {
      // If sign in fails, create a new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `${customerId}@shopify.com`,
        password: customerId,
        options: {
          data: {
            customer_id: customerId
          },
        },
      })

      if (signUpError) {
        console.error("Error creating user:", signUpError)
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        session: signUpData.session,
        user: signUpData.user,
      })
    }

    return NextResponse.json({
      success: true,
      session: signInData.session,
      user: signInData.user,
    })
  } catch (error: any) {
    console.error("Authentication error:", error)
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    )
  }
} 