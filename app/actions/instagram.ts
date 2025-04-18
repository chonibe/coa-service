"use server"

import {
  getInstagramCredentials,
  getInstagramProfile,
  getInstagramMedia,
  getInstagramStories,
} from "@/lib/services/instagram-graph-api"
import { supabaseAdmin } from "@/lib/supabase/client"

// Fetch Instagram profile for an artist
export async function fetchInstagramProfile(artistId: string) {
  try {
    // For now, hardcode to streetcollector_
    const username = "streetcollector_"

    // Try to get from cache first
    try {
      const { data: cachedProfile } = await supabaseAdmin
        .from("instagram_profile_cache")
        .select("*")
        .eq("username", username)
        .single()

      if (cachedProfile && new Date(cachedProfile.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        return { profile: cachedProfile }
      }
    } catch (error) {
      // Cache miss or table doesn't exist, continue to fetch from API
    }

    // Get credentials
    const credentials = await getInstagramCredentials(artistId)

    if (!credentials) {
      return { error: "No Instagram credentials found" }
    }

    // Fetch profile from Instagram
    const profile = await getInstagramProfile(credentials.instagram_business_id, credentials.access_token)

    if (!profile) {
      return { error: "Failed to fetch Instagram profile" }
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
    } catch (error) {
      // Ignore cache errors
      console.error("Error caching Instagram profile:", error)
    }

    return { profile }
  } catch (error) {
    console.error("Error fetching Instagram profile:", error)

    // Fallback to hardcoded data for streetcollector_
    return {
      profile: {
        username: "streetcollector_",
        profile_picture_url: "/creative-portrait.png",
        followers_count: 8742,
        media_count: 215,
        biography: "Collecting street art and urban creativity. Documenting the ephemeral art of the streets.",
        name: "Street Collector",
        website: "https://streetcollector.com",
      },
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
      const { data: cachedMedia } = await supabaseAdmin
        .from("instagram_media_cache")
        .select("*")
        .eq("username", username)
        .order("timestamp", { ascending: false })
        .limit(limit)

      if (cachedMedia && cachedMedia.length > 0) {
        const oldestAllowed = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (new Date(cachedMedia[0].updated_at) > oldestAllowed) {
          return { media: cachedMedia }
        }
      }
    } catch (error) {
      // Cache miss or table doesn't exist, continue to fetch from API
    }

    // Get credentials
    const credentials = await getInstagramCredentials(artistId)

    if (!credentials) {
      return { error: "No Instagram credentials found" }
    }

    // Fetch media from Instagram
    const media = await getInstagramMedia(credentials.instagram_business_id, credentials.access_token, limit)

    if (!media || media.length === 0) {
      return { error: "Failed to fetch Instagram media" }
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
    } catch (error) {
      // Ignore cache errors
      console.error("Error caching Instagram media:", error)
    }

    return { media }
  } catch (error) {
    console.error("Error fetching Instagram media:", error)

    // Fallback to hardcoded data for streetcollector_
    return {
      media: [
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
      ],
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
      const { data: cachedStories } = await supabaseAdmin
        .from("instagram_stories_cache")
        .select("*")
        .eq("username", username)
        .order("timestamp", { ascending: false })

      if (cachedStories && cachedStories.length > 0) {
        const oldestAllowed = new Date(Date.now() - 1 * 60 * 60 * 1000) // Stories cache for 1 hour
        if (new Date(cachedStories[0].updated_at) > oldestAllowed) {
          return { stories: cachedStories }
        }
      }
    } catch (error) {
      // Cache miss or table doesn't exist, continue to fetch from API
    }

    // Get credentials
    const credentials = await getInstagramCredentials(artistId)

    if (!credentials) {
      return { error: "No Instagram credentials found" }
    }

    // Fetch stories from Instagram
    const stories = await getInstagramStories(credentials.instagram_business_id, credentials.access_token)

    if (!stories) {
      return { error: "Failed to fetch Instagram stories" }
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
    } catch (error) {
      // Ignore cache errors
      console.error("Error caching Instagram stories:", error)
    }

    return { stories }
  } catch (error) {
    console.error("Error fetching Instagram stories:", error)

    // Fallback to hardcoded data for streetcollector_
    return {
      stories: [
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
      ],
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
