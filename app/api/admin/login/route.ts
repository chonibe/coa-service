import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/vendor-auth"
import { buildAdminSessionCookie } from "@/lib/admin-session"

export async function POST(_request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  try {
    // Try to get user from session (works for both password and OAuth logins)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Fallback to getSession if getUser fails
    let email: string | null = null
    if (user) {
      email = user.email?.toLowerCase() || null
    } else {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Failed to retrieve Supabase session for admin login:", sessionError)
        return NextResponse.json({ message: "Unable to verify session" }, { status: 500 })
      }
      
      email = session?.user?.email?.toLowerCase() || null
    }

    if (!email) {
      return NextResponse.json({ message: "Unauthorized - No email found in session" }, { status: 401 })
    }

    if (!isAdminEmail(email)) {
      return NextResponse.json({ message: "Forbidden - Email is not an admin email" }, { status: 403 })
    }

    // Ensure admin role exists in user_roles table
    if (user) {
      const serviceClient = createServiceClient()
      await serviceClient
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'admin',
          is_active: true,
          metadata: {
            source: 'admin_login_endpoint',
            email: email,
            ensured_at: new Date().toISOString()
          }
        }, {
          onConflict: 'user_id,role',
          ignoreDuplicates: false
        })
        .then(() => {
          console.log(`[admin/login] Admin role ensured for ${email}`)
        })
        .catch((error) => {
          console.error(`[admin/login] Failed to ensure admin role:`, error)
          // Non-critical error, continue with login
        })
    }

    const response = NextResponse.json({ success: true })
    const adminCookie = buildAdminSessionCookie(email)
    response.cookies.set(adminCookie.name, adminCookie.value, adminCookie.options)
    return response
  } catch (error: any) {
    console.error("Error in admin login:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
