import { INSTAGRAM_APP_SECRET, INSTAGRAM_ACCESS_TOKEN } from "@/lib/env"

const APP_SECRET = INSTAGRAM_APP_SECRET
const ACCESS_TOKEN = INSTAGRAM_ACCESS_TOKEN

// Helper function to generate app secret proof
function generateAppSecretProof(accessToken: string, appSecret: string): string {
  const crypto = require("crypto")
  const hmac = crypto.createHmac("sha256", appSecret)
  hmac.update(accessToken)
  return hmac.digest("hex")
}

// Function to fetch Instagram profile data
export async function getInstagramProfile(accountId: string) {
  const fields = "username,profile_picture_url,biography,followers_count,follows_count,media_count"
  const url = `https://graph.instagram.com/v19.0/${accountId}?fields=${fields}&access_token=${ACCESS_TOKEN}&appsecret_proof=${generateAppSecretProof(ACCESS_TOKEN, APP_SECRET)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram profile: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching Instagram profile:", error)
    throw error
  }
}

// Function to fetch Instagram media (posts)
export async function getInstagramMedia(accountId: string) {
  const fields = "id,media_type,media_url,permalink,caption,like_count,comments_count"
  const url = `https://graph.instagram.com/v19.0/${accountId}/media?fields=${fields}&access_token=${ACCESS_TOKEN}&appsecret_proof=${generateAppSecretProof(ACCESS_TOKEN, APP_SECRET)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram media: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching Instagram media:", error)
    throw error
  }
}

// Function to fetch Instagram stories
export async function getInstagramStories(accountId: string) {
  const fields = "media_type,media_url,permalink,timestamp"
  const url = `https://graph.instagram.com/v19.0/${accountId}/stories?fields=${fields}&access_token=${ACCESS_TOKEN}&appsecret_proof=${generateAppSecretProof(ACCESS_TOKEN, APP_SECRET)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram stories: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching Instagram stories:", error)
    throw error
  }
}
