"use server"

import {
  getInstagramCredentials,
  getInstagramProfile,
  getInstagramMedia,
  getInstagramStories,
  testInstagramCredentials,
  debugToken,
} from "@/lib/services/instagram-graph-api"
import { supabaseAdmin } from "@/lib/supabase/client"

// Fetch Instagram profile for an artist
export async function fetchInstagramProfile(artistId: string) {
  try {
    // For now, hardcode to streetcollector_
    const username = "streetcollector_"

    // Try to get from cache first
    try {
      const { data: cachedProfile, error: cacheError } = await supabaseAdmin
        .from("instagram_profile_cache")
        .select("*")
        .eq("username", username)
        .single()

      if (cacheError) {
        console.log("Profile cache error:", cacheError.message)
      } else if (cachedProfile && new Date(cachedProfile.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        console.log("Using cached Instagram profile")
        return { profile: cachedProfile, fromCache: true }
      }
    } catch (error) {
      // Cache miss or table doesn't exist, continue to fetch from API
      console.log("Profile cache miss:", error)
    }

    // Get credentials
    const credentials = await getInstagramCredentials(artistId)

    if (!credentials || !credentials.instagram_business_id || !credentials.access_token) {
      console.warn("Missing Instagram credentials for profile fetch")
      return { error: "No Instagram credentials found", fallback: true, profile: getFallbackProfile() }
    }

    // Debug token to check its status
    const tokenInfo = await debugToken(credentials.access_token)
    if (tokenInfo.error || (tokenInfo.data && !tokenInfo.data.is_valid)) {
      console.error("Invalid access token:", tokenInfo)
      return { error: "Invalid access token", fallback: true, profile: getFallbackProfile() }
    }

    // Test credentials before making the actual API call
    const credentialsValid = await testInstagramCredentials(credentials.instagram_business_id, credentials.access_token)

    if (!credentialsValid) {
      console.warn("Instagram credentials are invalid")
      return { error: "Invalid Instagram credentials", fallback: true, profile: getFallbackProfile() }
    }

    // Fetch profile from Instagram
    const profile = await getInstagramProfile(credentials.instagram_business_id, credentials.access_token)

    if (!profile) {
      console.warn("Failed to fetch Instagram profile, using fallback")
      return { error: "Failed to fetch Instagram profile", fallback: true, profile: getFallbackProfile() }
    }

    // Cache the profile
    try {
      await supabaseAdmin.from("instagram_profile_cache").upsert({
        username: profile.username,
        profile_picture_url: profile.profile_picture_url,
        followers_count: profile.followers_count,
        media_count: profile.media_count,
        biography: profile.biography,
        name: profile.name,
        website: profile.website,
        updated_at: new Date().toISOString(),
      })
      console.log("Successfully cached Instagram profile")
    } catch (error) {
      // Ignore cache errors
      console.error("Error caching Instagram profile:", error)
    }

    return { profile }
  } catch (error) {
    console.error("Error fetching Instagram profile:", error)

    // Fallback to hardcoded data
    return {
      fallback: true,
      profile: getFallbackProfile(),
    }
  }
}

// Fetch Instagram media for an artist
export async function fetchInstagramMedia(artistId: string, limit = 6) {
  try {
    // For now, hardcode to streetcollector_
    const username = "streetcollector_"

    // Try to get from cache first
    try {
      const { data: cachedMedia, error: cacheError } = await supabaseAdmin
        .from("instagram_media_cache")
        .select("*")
        .eq("username", username)
        .order("timestamp", { ascending: false })
        .limit(limit)

      if (cacheError) {
        console.log("Media cache error:", cacheError.message)
      } else if (cachedMedia && cachedMedia.length > 0) {
        const oldestAllowed = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (new Date(cachedMedia[0].updated_at) > oldestAllowed) {
          console.log("Using cached Instagram media")
          return { media: cachedMedia, fromCache: true }
        }
      }
    } catch (error) {
      // Cache miss or table doesn't exist, continue to fetch from API
      console.log("Media cache miss:", error)
    }

    // Get credentials
    const credentials = await getInstagramCredentials(artistId)

    if (!credentials || !credentials.instagram_business_id || !credentials.access_token) {
      console.warn("Missing Instagram credentials for media fetch")
      return { error: "Invalid Instagram credentials", fallback: true, media: getFallbackMedia() }
    }

    // Debug token to check its status
    const tokenInfo = await debugToken(credentials.access_token)
    if (tokenInfo.error || (tokenInfo.data && !tokenInfo.data.is_valid)) {
      console.error("Invalid access token:", tokenInfo)
      return { error: "Invalid access token", fallback: true, media: getFallbackMedia() }
    }

    // Test credentials before making the actual API call
    const credentialsValid = await testInstagramCredentials(credentials.instagram_business_id, credentials.access_token)

    if (!credentialsValid) {
      console.warn("Instagram credentials are invalid")
      return { error: "Invalid Instagram credentials", fallback: true, media: getFallbackMedia() }
    }

    // Fetch media from Instagram
    const media = await getInstagramMedia(credentials.instagram_business_id, credentials.access_token, limit)

    if (!media || media.length === 0) {
      console.warn("Failed to fetch Instagram media, using fallback")
      return { error: "Failed to fetch Instagram media", fallback: true, media: getFallbackMedia() }
    }

    // Cache the media
    try {
      for (const item of media) {
        await supabaseAdmin.from("instagram_media_cache").upsert({
          instagram_media_id: item.id,
          username,
          media_type: item.media_type,
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url,
          permalink: item.permalink,
          caption: item.caption,
          timestamp: item.timestamp,
          updated_at: new Date().toISOString(),
        })
      }
      console.log("Successfully cached Instagram media")
    } catch (error) {
      // Ignore cache errors
      console.error("Error caching Instagram media:", error)
    }

    return { media }
  } catch (error) {
    console.error("Error fetching Instagram media:", error)

    // Fallback to hardcoded data
    return {
      fallback: true,
      media: getFallbackMedia(),
    }
  }
}

// Fetch Instagram stories for an artist
export async function fetchInstagramStories(artistId: string) {
  try {
    // For now, hardcode to streetcollector_
    const username = "streetcollector_"

    // Try to get from cache first
    try {
      const { data: cachedStories, error: cacheError } = await supabaseAdmin
        .from("instagram_stories_cache")
        .select("*")
        .eq("username", username)
        .order("timestamp", { ascending: false })

      if (cacheError) {
        console.log("Stories cache error:", cacheError.message)
      } else if (cachedStories && cachedStories.length > 0) {
        const oldestAllowed = new Date(Date.now() - 1 * 60 * 60 * 1000) // Stories cache for 1 hour
        if (new Date(cachedStories[0].updated_at) > oldestAllowed) {
          console.log("Using cached Instagram stories")
          return { stories: cachedStories, fromCache: true }
        }
      }
    } catch (error) {
      // Cache miss or table doesn't exist, continue to fetch from API
      console.log("Stories cache miss:", error)
    }

    // Get credentials
    const credentials = await getInstagramCredentials(artistId)

    if (!credentials || !credentials.instagram_business_id || !credentials.access_token) {
      console.warn("Missing Instagram credentials for stories fetch")
      return { error: "No Instagram credentials found", fallback: true, stories: getFallbackStories() }
    }

    // Debug token to check its status
    const tokenInfo = await debugToken(credentials.access_token)
    if (tokenInfo.error || (tokenInfo.data && !tokenInfo.data.is_valid)) {
      console.error("Invalid access token:", tokenInfo)
      return { error: "Invalid access token", fallback: true, stories: getFallbackStories() }
    }

    // Test credentials before making the actual API call
    const credentialsValid = await testInstagramCredentials(credentials.instagram_business_id, credentials.access_token)

    if (!credentialsValid) {
      console.warn("Instagram credentials are invalid")
      return { error: "Invalid Instagram credentials", fallback: true, stories: getFallbackStories() }
    }

    // Fetch stories from Instagram
    const stories = await getInstagramStories(credentials.instagram_business_id, credentials.access_token)

    if (!stories || stories.length === 0) {
      console.warn("Failed to fetch Instagram stories, using fallback")
      return { error: "Failed to fetch Instagram stories", fallback: true, stories: getFallbackStories() }
    }

    // Cache the stories
    try {
      for (const story of stories) {
        await supabaseAdmin.from("instagram_stories_cache").upsert({
          instagram_media_id: story.id,
          username,
          media_type: story.media_type,
          media_url: story.media_url,
          permalink: story.permalink,
          timestamp: story.timestamp,
          updated_at: new Date().toISOString(),
        })
      }
      console.log("Successfully cached Instagram stories")
    } catch (error) {
      // Ignore cache errors
      console.error("Error caching Instagram stories:", error)
    }

    return { stories }
  } catch (error) {
    console.error("Error fetching Instagram stories:", error)

    // Fallback to hardcoded data
    return {
      fallback: true,
      stories: getFallbackStories(),
    }
  }
}

// Mark a story as viewed
export async function markStoryViewed(storyId: string, collectorId: string) {
  try {
    await supabaseAdmin.from("instagram_story_views").upsert({
      collector_id: collectorId,
      instagram_media_id: storyId,
      viewed_at: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking story as viewed:", error)
    return { error: "Failed to mark story as viewed" }
  }
}

// Fallback data functions
function getFallbackProfile() {
  return {
    username: "streetcollector_",
    profile_picture_url: "/creative-portrait.png",
    followers_count: 8742,
    media_count: 215,
    biography: "Collecting street art and urban creativity. Documenting the ephemeral art of the streets.",
    name: "Street Collector",
    website: "https://streetcollector.com",
  }
}

function getFallbackMedia() {
  return [
    {
      id: "post1",
      caption:
        "New street art discovery in the downtown district. The way the artist uses color to create depth is remarkable. #streetart #urbanart",
      media_type: "IMAGE",
      media_url: "/chromatic-flow.png",
      permalink: "https://instagram.com/p/streetcollector_1",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "post2",
      caption: "Behind the scenes at the street art festival. So many talented artists bringing walls to life.",
      media_type: "IMAGE",
      media_url: "/cluttered-creative-space.png",
      permalink: "https://instagram.com/p/streetcollector_2",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "post3",
      caption:
        "This piece won't last long - the ephemeral nature of street art is what makes it so special. Catch it while you can at 5th and Main.",
      media_type: "IMAGE",
      media_url: "/thoughtful-gaze.png",
      permalink: "https://instagram.com/p/streetcollector_3",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "post4",
      caption:
        "Artist spotlight: @urban_painter has been transforming this neighborhood one wall at a time. Incredible talent.",
      media_type: "IMAGE",
      media_url: "/diverse-group-city.png",
      permalink: "https://instagram.com/p/streetcollector_4",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

function getFallbackStories() {
  return [
    {
      id: "story1",
      media_type: "IMAGE",
      media_url: "/cluttered-creative-space.png",
      permalink: "https://instagram.com/stories/streetcollector_/1",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "story2",
      media_type: "IMAGE",
      media_url: "/chromatic-flow.png",
      permalink: "https://instagram.com/stories/streetcollector_/2",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ]
}
