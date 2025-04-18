/**
 * This file outlines how artists can authentically become part of a collector's personal circle
 * through their artwork - not through flashy features, but through meaningful connection.
 */

export type CircleProximity =
  | "acquaintance" // Initial awareness
  | "guest" // Welcomed but still formal
  | "regular" // Familiar and comfortable presence
  | "confidant" // Trusted with personal thoughts
  | "inner-circle" // Part of the collector's intimate world

// The stages collectors go through as they integrate an artist into their life
export interface CircleStage {
  proximity: CircleProximity
  collectorPerspective: string
  artistOpportunity: string
}

export const circleStages: Record<CircleProximity, CircleStage> = {
  acquaintance: {
    proximity: "acquaintance",
    collectorPerspective: "I know of this artist's work",
    artistOpportunity: "Introduce yourself through the work, without demanding attention",
  },
  guest: {
    proximity: "guest",
    collectorPerspective: "I've welcomed this artist's vision into my space",
    artistOpportunity: "Respect the invitation, offer something of value, be courteous",
  },
  regular: {
    proximity: "regular",
    collectorPerspective: "This artist's perspective is part of my daily life",
    artistOpportunity: "Become familiar, reliable, bring consistent value",
  },
  confidant: {
    proximity: "confidant",
    collectorPerspective: "I share personal thoughts with this artist",
    artistOpportunity: "Listen deeply, reciprocate vulnerability, build trust",
  },
  "inner-circle": {
    proximity: "inner-circle",
    collectorPerspective: "This artist understands my world and is part of it",
    artistOpportunity: "Interweave your story with theirs, create shared meaning",
  },
}

// Simple function to determine the current stage
export function determineProximity(
  daysWithArtwork: number,
  messageExchanges: number,
  personalDetailsShared: string[],
  insightResponses: number,
): CircleProximity {
  if (insightResponses > 5 && personalDetailsShared.length > 3) {
    return "inner-circle"
  }

  if (insightResponses > 3 || personalDetailsShared.length > 1) {
    return "confidant"
  }

  if (daysWithArtwork > 30 || messageExchanges > 2) {
    return "regular"
  }

  if (daysWithArtwork > 7) {
    return "guest"
  }

  return "acquaintance"
}

// Generate a thoughtful reflection based on the current proximity
export function generateProximityReflection(proximity: CircleProximity): string {
  const reflections = {
    acquaintance:
      "You're beginning to form a connection with the artist through their work. Like meeting someone new, these initial interactions shape future possibilities.",

    guest:
      "You've welcomed the artist's vision into your personal space. Their perspective has become part of your environment, like a guest whose presence you've chosen to invite in.",

    regular:
      "The artist's voice has become a familiar presence in your daily life. Their work speaks to you in different contexts and moods, like a regular visitor whose company you enjoy.",

    confidant:
      "You've begun to share your own thoughts and perspectives with the artist. A mutual exchange has developed, built on trust and shared understanding.",

    "inner-circle":
      "The artist's work has become interwoven with your personal narrative. Their perspective has influenced how you see the world, and your engagement has influenced their creative journey.",
  }

  return reflections[proximity]
}
