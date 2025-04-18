// This service handles Instagram integration for artists

interface InstagramStory {
  id: string
  mediaType: "IMAGE" | "VIDEO"
  mediaUrl: string
  timestamp: string
  expirationTimestamp: string
}

interface InstagramPost {
  id: string
  caption: string
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  mediaUrl: string
  permalink: string
  timestamp: string
  thumbnailUrl?: string
}

interface InstagramArtistProfile {
  username: string
  profilePictureUrl: string
  followersCount: number
  postsCount: number
  bio: string
  isVerified: boolean
}

// In a real implementation, this would use Instagram's Graph API
// For demo purposes, we'll use mock data and simple embedding

export async function getArtistInstagramProfile(artistId: string): Promise<InstagramArtistProfile | null> {
  try {
    // In a real implementation, you would fetch this from your database
    // where you've stored the connected Instagram accounts

    // For demo purposes, return mock data for the specified test account
    return {
      username: "streetcollector_",
      profilePictureUrl: "/creative-portrait.png",
      followersCount: 8742,
      postsCount: 215,
      bio: "Collecting street art and urban creativity. Documenting the ephemeral art of the streets.",
      isVerified: false,
    }
  } catch (error) {
    console.error("Error fetching Instagram profile:", error)
    return null
  }
}

export async function getArtistInstagramStories(artistId: string): Promise<InstagramStory[]> {
  try {
    // In a real implementation, you would use Instagram's Graph API
    // This requires proper authentication and permissions

    // For demo purposes, return mock data for the specified test account
    return [
      {
        id: "story1",
        mediaType: "IMAGE",
        mediaUrl: "/cluttered-creative-space.png",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        expirationTimestamp: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
      },
      {
        id: "story2",
        mediaType: "IMAGE",
        mediaUrl: "/chromatic-flow.png",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        expirationTimestamp: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // 20 hours from now
      },
    ]
  } catch (error) {
    console.error("Error fetching Instagram stories:", error)
    return []
  }
}

export async function getArtistRecentPosts(artistId: string, limit = 6): Promise<InstagramPost[]> {
  try {
    // In a real implementation, you would use Instagram's Graph API

    // For demo purposes, return mock data for the specified test account
    return [
      {
        id: "post1",
        caption:
          "New street art discovery in the downtown district. The way the artist uses color to create depth is remarkable. #streetart #urbanart",
        mediaType: "IMAGE",
        mediaUrl: "/chromatic-flow.png",
        permalink: "https://instagram.com/p/streetcollector_1",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        id: "post2",
        caption: "Behind the scenes at the street art festival. So many talented artists bringing walls to life.",
        mediaType: "IMAGE",
        mediaUrl: "/cluttered-creative-space.png",
        permalink: "https://instagram.com/p/streetcollector_2",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
      {
        id: "post3",
        caption:
          "This piece won't last long - the ephemeral nature of street art is what makes it so special. Catch it while you can at 5th and Main.",
        mediaType: "IMAGE",
        mediaUrl: "/thoughtful-gaze.png",
        permalink: "https://instagram.com/p/streetcollector_3",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      },
      {
        id: "post4",
        caption:
          "Artist spotlight: @urban_painter has been transforming this neighborhood one wall at a time. Incredible talent.",
        mediaType: "IMAGE",
        mediaUrl: "/diverse-group-city.png",
        permalink: "https://instagram.com/p/streetcollector_4",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      },
    ]
  } catch (error) {
    console.error("Error fetching Instagram posts:", error)
    return []
  }
}

// Get the embed code for an Instagram post
export function getInstagramEmbedCode(postId: string): string {
  return `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${postId}/" data-instgrm-version="14"></blockquote><script async src="//www.instagram.com/embed.js"></script>`
}

// Check if an artist has connected their Instagram account
export async function hasConnectedInstagram(artistId: string): Promise<boolean> {
  try {
    // In a real implementation, you would check your database

    // For demo purposes, return true
    return true
  } catch (error) {
    console.error("Error checking Instagram connection:", error)
    return false
  }
}

// Connect an artist's Instagram account (admin function)
export async function connectInstagramAccount(artistId: string, accessToken: string): Promise<boolean> {
  try {
    // In a real implementation, you would store the access token securely
    // and use it to make API calls

    console.log(`Connected Instagram for artist ${artistId} with token ${accessToken.substring(0, 5)}...`)
    return true
  } catch (error) {
    console.error("Error connecting Instagram account:", error)
    return false
  }
}

// In a real implementation, this would fetch real data from Instagram's API
// For now, we'll create a function that would be used in production
export async function fetchRealInstagramData(username: string, accessToken: string) {
  // This is a placeholder for the real implementation
  // In production, you would use the Instagram Graph API
  // Example: https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=ACCESS_TOKEN

  console.log(`Would fetch real data for ${username} using token ${accessToken.substring(0, 5)}...`)

  // Return mock data for now
  return {
    profile: {
      username: "streetcollector_",
      profile_picture_url: "/creative-portrait.png",
      followers_count: 8742,
      media_count: 215,
      biography: "Collecting street art and urban creativity. Documenting the ephemeral art of the streets.",
      is_verified: false,
    },
    media: [
      // Media items would be returned here
    ],
  }
}
