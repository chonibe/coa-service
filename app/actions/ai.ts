"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import type { Artist } from "@/types/perks"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function generatePersonalMessage(
  artist: Artist,
  collector: { name: string; email: string },
  certificateId: string,
): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: `
You are ${artist.name}, a talented artist. Write a personal message to ${collector.name}, who just collected your artwork (certificate ID: ${certificateId}).

This message should feel exclusive and special - like a direct communication from you to this specific collector. Make them feel like they're part of a select group who gets to interact with you in this special way.

Write a warm, personal message (1-2 paragraphs) thanking them for collecting your work. Don't mention AI or that this message was generated. Make it feel authentic and handcrafted. Sign the message as ${artist.name}.
`,
      temperature: 0.7,
      maxTokens: 300,
    })

    return text.trim()
  } catch (error) {
    console.error("Error generating personal message:", error)
    return null
  }
}

export async function analyzeCollectorFeedback(feedback: string, artistId: string): Promise<any> {
  try {
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: `
Analyze the following collector feedback about an artist's exclusive content:

"${feedback}"

Extract the following information:
1. Sentiment (positive, negative, neutral)
2. Key themes mentioned
3. Specific suggestions or requests
4. Areas of appreciation
5. Areas of improvement

Format the response as JSON.
`,
      temperature: 0.2,
      maxTokens: 500,
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("Error analyzing feedback:", error)
    return null
  }
}

export async function suggestPersonalizedPerks(
  artistId: string,
  collectorId: string,
  certificateId: string,
): Promise<any> {
  try {
    // Get artist and collector info from Supabase
    const { data: artist } = await supabase.from("artists").select("name, bio").eq("id", artistId).single()

    const { data: collector } = await supabase
      .from("collectors")
      .select("name, preferences")
      .eq("id", collectorId)
      .single()

    const { data: certificate } = await supabase
      .from("certificates")
      .select("artwork_title, artwork_description")
      .eq("id", certificateId)
      .single()

    if (!artist || !collector || !certificate) {
      throw new Error("Missing data for personalization")
    }

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: `
Based on the following information, suggest 3 personalized perks that the artist could offer to this specific collector.

Artist:
Name: ${artist.name}
Bio: ${artist.bio || "Not provided"}

Collector:
Name: ${collector.name}
Preferences: ${collector.preferences || "Not specified"}

Artwork:
Title: ${certificate.artwork_title}
Description: ${certificate.artwork_description || "Not provided"}

For each suggestion, provide:
1. A title for the perk
2. A brief description
3. The type of content (video, text, link, audio, code)
4. Why this would be valuable to this specific collector

IMPORTANT: Do NOT suggest any AI-generated images or artwork. Focus on authentic, artist-created content that creates a sense of exclusivity and special connection.

Format the response as JSON with an array of 3 perk suggestions.
`,
      temperature: 0.8,
      maxTokens: 800,
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("Error generating personalized perk suggestions:", error)
    return null
  }
}
