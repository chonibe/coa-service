import { NextResponse } from "next/server"
import { getInstagramCredentials, testInstagramCredentials } from "@/lib/services/instagram-graph-api"
import { supabaseAdmin } from "@/lib/supabase/client"

export async function GET() {
  try {
    // Get credentials (without revealing full token)
    const credentials = await getInstagramCredentials("debug")

    // Create a safe version of credentials that doesn't expose the full token
    const safeCredentials = {
      page_id: credentials.page_id,
      instagram_business_id: credentials.instagram_business_id,
      access_token_status: credentials.access_token
        ? "Set (length: " + credentials.access_token.length + ")"
        : "Not set",
      token_expiry: credentials.token_expiry,
    }

    // Test credentials
    let credentialsValid = false
    if (credentials.instagram_business_id && credentials.access_token) {
      credentialsValid = await testInstagramCredentials(credentials.instagram_business_id, credentials.access_token)
    }

    // Check cache tables
    let cacheTablesStatus = {}
    try {
      // Check if tables exist
      const { data: profileCache, error: profileError } = await supabaseAdmin
        .from("instagram_profile_cache")
        .select("count")
        .limit(1)

      const { data: mediaCache, error: mediaError } = await supabaseAdmin
        .from("instagram_media_cache")
        .select("count")
        .limit(1)

      const { data: storiesCache, error: storiesError } = await supabaseAdmin
        .from("instagram_stories_cache")
        .select("count")
        .limit(1)

      cacheTablesStatus = {
        profile_cache: {
          exists: !profileError,
          error: profileError ? profileError.message : null,
        },
        media_cache: {
          exists: !mediaError,
          error: mediaError ? mediaError.message : null,
        },
        stories_cache: {
          exists: !storiesError,
          error: storiesError ? storiesError.message : null,
        },
      }
    } catch (error) {
      cacheTablesStatus = {
        error: error.message,
      }
    }

    return NextResponse.json({
      environment_variables: {
        FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID ? "Set" : "Not set",
        INSTAGRAM_BUSINESS_ID: process.env.INSTAGRAM_BUSINESS_ID ? "Set" : "Not set",
        INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN ? "Set" : "Not set",
      },
      credentials: safeCredentials,
      credentials_valid: credentialsValid,
      cache_tables: cacheTablesStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
