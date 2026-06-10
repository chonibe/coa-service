import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const execFileAsync = promisify(execFile)
const CACHE_TTL_MS = 1000 * 60 * 60 * 6

type InstagramProfileResponse = {
  profile: {
    handle: string
    url: string
    displayName?: string
    biography?: string
    website?: string
    avatarUrl?: string
    followersCount?: number
    followsCount?: number
    mediaCount?: number
  }
}

const profileCache = new Map<string, { expiresAt: number; payload: InstagramProfileResponse }>()

function sanitizeHandle(raw: string): string | null {
  const value = raw.trim().replace(/^@/, '')
  const match = value.match(/([a-zA-Z0-9._]+)/)
  return match?.[1] || null
}

type InstagramWebProfileResponse = {
  data?: {
    user?: {
      username?: string
      full_name?: string
      biography?: string
      external_url?: string
      profile_pic_url?: string
      profile_pic_url_hd?: string
      edge_followed_by?: { count?: number }
      edge_follow?: { count?: number }
      edge_owner_to_timeline_media?: { count?: number }
    }
  }
}

function profileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`
}

function normalizeProfile(handle: string, user?: InstagramWebProfileResponse['data']['user']): InstagramProfileResponse {
  return {
    profile: {
      handle,
      url: profileUrl(handle),
      displayName: user?.full_name?.trim() || undefined,
      biography: user?.biography?.trim() || undefined,
      website: user?.external_url?.trim() || undefined,
      avatarUrl: user?.profile_pic_url_hd?.trim() || user?.profile_pic_url?.trim() || undefined,
      followersCount: user?.edge_followed_by?.count,
      followsCount: user?.edge_follow?.count,
      mediaCount: user?.edge_owner_to_timeline_media?.count,
    },
  }
}

async function fetchInstagramProfile(handle: string): Promise<InstagramWebProfileResponse> {
  const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`, {
    headers: {
      Accept: 'application/json',
      Referer: `https://www.instagram.com/${handle}/`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'X-IG-App-ID': '936619743392459',
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Instagram fetch failed: ${res.status}`)
  }
  return (await res.json()) as InstagramWebProfileResponse
}

async function fetchInstagramProfileViaCurl(handle: string): Promise<InstagramWebProfileResponse> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`
  const { stdout } = await execFileAsync(
    'curl.exe',
    [
      '-sS',
      url,
      '-H',
      'Accept: application/json',
      '-H',
      `Referer: ${profileUrl(handle)}`,
      '-H',
      'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      '-H',
      'X-IG-App-ID: 936619743392459',
      '-H',
      'X-Requested-With: XMLHttpRequest',
    ],
    {
      windowsHide: true,
      timeout: 15000,
      maxBuffer: 1024 * 1024 * 5,
    }
  )
  return JSON.parse(stdout) as InstagramWebProfileResponse
}

export async function GET(request: NextRequest) {
  const handle = sanitizeHandle(new URL(request.url).searchParams.get('handle') || '')
  if (!handle) {
    return NextResponse.json({ error: 'Missing handle' }, { status: 400 })
  }

  const cached = profileCache.get(handle)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload)
  }

  try {
    let json: InstagramWebProfileResponse

    try {
      json = await fetchInstagramProfile(handle)
    } catch (error) {
      json = await fetchInstagramProfileViaCurl(handle)
      console.warn('[Instagram Profile API] Falling back to curl for handle', handle, error)
    }

    const payload = normalizeProfile(handle, json.data?.user)
    profileCache.set(handle, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[Instagram Profile API] Error for handle', handle, error)
    return NextResponse.json(
      {
        profile: {
          handle,
          url: `https://www.instagram.com/${handle}/`,
        },
      },
      { status: 200 }
    )
  }
}
