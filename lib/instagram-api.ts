// Mock data for development without actual Instagram API access
const MOCK_MODE = process.env.NODE_ENV === "development"

export async function fetchInstagramProfile(username: string) {
  if (MOCK_MODE) {
    return mockInstagramProfile(username)
  }

  try {
    // In production, you would use the actual Instagram Graph API
    // This is where you'd implement the real API call using your INSTAGRAM_ACCESS_TOKEN
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!accessToken) {
      throw new Error("Instagram access token not configured")
    }

    // Implement your actual Instagram API call here
    // For example:
    // const response = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count,followers_count&access_token=${accessToken}`)
    // const data = await response.json()

    // For now, return mock data
    return mockInstagramProfile(username)
  } catch (error) {
    console.error("Error fetching Instagram profile:", error)
    throw error
  }
}

export async function fetchInstagramMedia(username: string, limit = 12) {
  if (MOCK_MODE) {
    return mockInstagramMedia(username, limit)
  }

  try {
    // In production, you would use the actual Instagram Graph API
    // This is where you'd implement the real API call using your INSTAGRAM_ACCESS_TOKEN
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!accessToken) {
      throw new Error("Instagram access token not configured")
    }

    // Implement your actual Instagram API call here
    // For example:
    // const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=${limit}&access_token=${accessToken}`)
    // const data = await response.json()

    // For now, return mock data
    return mockInstagramMedia(username, limit)
  } catch (error) {
    console.error("Error fetching Instagram media:", error)
    throw error
  }
}

export async function getInstagramStories(accountId: string) {
  if (MOCK_MODE) {
    return mockInstagramStories(accountId)
  }

  try {
    // In production, you would use the actual Instagram Graph API
    // This is where you'd implement the real API call using your INSTAGRAM_ACCESS_TOKEN
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!accessToken) {
      throw new Error("Instagram access token not configured")
    }

    // Implement your actual Instagram API call here
    // Note: Fetching stories requires special permissions and is more complex

    // For now, return mock data
    return mockInstagramStories(accountId)
  } catch (error) {
    console.error("Error fetching Instagram stories:", error)
    throw error
  }
}

// Mock data functions for development
function mockInstagramProfile(username: string) {
  return {
    username,
    profile_picture_url: `https://ui-avatars.com/api/?name=${username}&background=random`,
    followers_count: Math.floor(Math.random() * 10000) + 1000,
    media_count: Math.floor(Math.random() * 100) + 10,
    biography: `This is a mock biography for ${username}. In production, this would be fetched from the Instagram API.`,
    name: username.charAt(0).toUpperCase() + username.slice(1),
    website: `https://${username}.com`,
  }
}

function mockInstagramMedia(username: string, limit = 12) {
  const media = []

  for (let i = 0; i < limit; i++) {
    const id = `mock_${username}_${i}_${Date.now()}`
    const isVideo = Math.random() > 0.7

    media.push({
      id,
      media_type: isVideo ? "VIDEO" : "IMAGE",
      media_url: isVideo
        ? `https://picsum.photos/seed/${username}${i}/800/800`
        : `https://picsum.photos/seed/${username}${i}/800/800`,
      thumbnail_url: isVideo ? `https://picsum.photos/seed/${username}${i}/400/400` : null,
      permalink: `https://instagram.com/p/${id}`,
      caption: `This is a mock caption for post #${i + 1} by ${username}. #mockdata #development`,
      timestamp: new Date(Date.now() - i * 86400000).toISOString(), // Each post is 1 day older
    })
  }

  return media
}

function mockInstagramStories(accountId: string) {
  const stories = []

  for (let i = 0; i < 5; i++) {
    const id = `mock_story_${accountId}_${i}_${Date.now()}`
    const isVideo = Math.random() > 0.5

    stories.push({
      id,
      media_type: isVideo ? "VIDEO" : "IMAGE",
      media_url: isVideo
        ? `https://picsum.photos/seed/story_${accountId}${i}/1080/1920`
        : `https://picsum.photos/seed/story_${accountId}${i}/1080/1920`,
      permalink: `https://instagram.com/stories/${accountId}/${id}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(), // Each story is 1 hour older
      expires_at: new Date(Date.now() - i * 3600000 + 86400000).toISOString(),
    })
  }

  return {
    data: stories,
  }
}
