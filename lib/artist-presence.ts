/**
 * This file outlines the concept of artist presence within collected works.
 * Like portraits in Harry Potter where characters occasionally visit their frames,
 * artists can "visit" their collectors through exclusive moments and content.
 */

export type PresenceType =
  | "whisper" // Subtle, intimate insights from the artist
  | "glimpse" // Visual windows into the artist's world
  | "artifact" // Tangible pieces of the creative process
  | "dialogue" // Direct, personal exchanges
  | "revelation" // Deeper understanding of the work's meaning

export interface ArtistPresence {
  type: PresenceType
  description: string
  experience: string
  examples: string[]
}

export const presenceTypes: Record<PresenceType, ArtistPresence> = {
  whisper: {
    type: "whisper",
    description: "Intimate thoughts and reflections shared directly from artist to collector",
    experience:
      "Like finding a note written just for you, these moments create a sense of being trusted with the artist's inner thoughts",
    examples: [
      "Voice notes describing a moment of inspiration",
      "Late-night reflections on the work's meaning",
      "Personal stories connected to the artwork's creation",
      "Doubts or challenges overcome during the creative process",
    ],
  },
  glimpse: {
    type: "glimpse",
    description: "Visual windows into the artist's world and process",
    experience: "As if the artwork's frame occasionally becomes a window into the artist's studio or life",
    examples: [
      "Time-lapse videos of the work being created",
      "Photos of the artist's workspace showing the piece in progress",
      "Visual tours of places that inspired the work",
      "Behind-the-scenes moments from the artist's creative life",
    ],
  },
  artifact: {
    type: "artifact",
    description: "Tangible pieces of the creative process shared exclusively",
    experience: "Owning not just the finished work, but pieces of its journey into existence",
    examples: [
      "Digital sketches or studies for the final piece",
      "Material samples or technique demonstrations",
      "Alternate versions or details not seen in the final work",
      "Playlists or reading lists that influenced the creation",
    ],
  },
  dialogue: {
    type: "dialogue",
    description: "Direct, personal exchanges between artist and collector",
    experience: "Moments where the distance between creator and collector dissolves into conversation",
    examples: [
      "Personal responses to collector questions about the work",
      "Video messages addressing the collector by name",
      "Invitations to provide feedback that shapes future works",
      "Shared appreciation for specific elements of the piece",
    ],
  },
  revelation: {
    type: "revelation",
    description: "Deeper insights into the work's meaning and context",
    experience: "Like having the artist occasionally appear to reveal new layers of meaning in the work",
    examples: [
      "Hidden symbolism or references explained",
      "How the piece connects to the artist's broader body of work",
      "Cultural or historical contexts that informed the creation",
      "The evolution of the concept from initial idea to final execution",
    ],
  },
}

// Determine which presence type would resonate most with a specific collector
export function suggestPresenceType(
  collectorPreferences: string[],
  collectionHistory: any[],
  artworkThemes: string[],
): PresenceType {
  // This would be more sophisticated in a real implementation

  // Collectors who ask questions might prefer dialogue
  if (collectorPreferences.includes("direct-communication") || collectorPreferences.includes("artist-relationship")) {
    return "dialogue"
  }

  // Collectors interested in process might prefer glimpses
  if (collectorPreferences.includes("process") || collectorPreferences.includes("technique")) {
    return "glimpse"
  }

  // Collectors interested in meaning might prefer revelations
  if (collectorPreferences.includes("meaning") || collectorPreferences.includes("symbolism")) {
    return "revelation"
  }

  // Collectors who value exclusivity might prefer artifacts
  if (collectorPreferences.includes("exclusivity") || collectorPreferences.includes("rarity")) {
    return "artifact"
  }

  // Default to whispers as they're intimate and personal
  return "whisper"
}

// Generate ideas for artist presence moments based on type
export function generatePresenceIdeas(presenceType: PresenceType, artwork: any): string[] {
  // In a real implementation, this would be more sophisticated
  // and potentially use AI to generate personalized ideas
  return presenceTypes[presenceType].examples
}
