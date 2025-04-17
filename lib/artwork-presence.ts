/**
 * This file outlines the philosophy of artwork as an active presence in the collector's space.
 * Inspired by street art, where the artwork becomes part of the viewer's daily environment
 * and creates an ongoing dialogue between artist, artwork, and collector.
 */

export type PresenceType =
  | "ambient" // The artwork subtly influences the space and mood
  | "provocative" // The artwork challenges and questions
  | "evolving" // The artwork reveals new aspects over time
  | "responsive" // The artwork seems to respond to the collector's presence
  | "territorial" // The artwork claims space and attention

export interface ArtworkPresence {
  type: PresenceType
  description: string
  artistIntent: string
  collectorExperience: string
}

export const presenceTypes: Record<PresenceType, ArtworkPresence> = {
  ambient: {
    type: "ambient",
    description: "A subtle but persistent influence on the space and mood",
    artistIntent: "Creating a work that becomes part of the environmental fabric",
    collectorExperience: "The artwork shifts your perception of the space around it",
  },
  provocative: {
    type: "provocative",
    description: "A challenging presence that demands engagement",
    artistIntent: "Inserting a voice that continues to question and provoke thought",
    collectorExperience: "The artwork confronts you with new questions each time you encounter it",
  },
  evolving: {
    type: "evolving",
    description: "A work that reveals itself differently over time",
    artistIntent: "Creating layers that unfold through continued observation",
    collectorExperience: "You discover new elements and meanings as you live with the work",
  },
  responsive: {
    type: "responsive",
    description: "A presence that seems to react to the viewer",
    artistIntent: "Creating work that mirrors or responds to the viewer's state",
    collectorExperience: "The artwork seems to change based on your mood or perspective",
  },
  territorial: {
    type: "territorial",
    description: "A work that claims and transforms its surrounding space",
    artistIntent: "Extending the artist's vision into the collector's environment",
    collectorExperience: "The artwork has claimed a territory in your space and consciousness",
  },
}

// Determine the dominant presence type based on artwork characteristics and collector interactions
export function determinePresenceType(
  artworkMood: string,
  placementContext: string,
  viewingFrequency: number,
  reportedImpact: string[],
): PresenceType {
  // This would be a more sophisticated algorithm in a real implementation
  // For now, we'll use a simple approach

  if (reportedImpact.includes("territorial") || reportedImpact.includes("claiming space")) {
    return "territorial"
  }

  if (reportedImpact.includes("changes") || reportedImpact.includes("different each time")) {
    return "evolving"
  }

  if (reportedImpact.includes("challenges") || reportedImpact.includes("questions")) {
    return "provocative"
  }

  if (reportedImpact.includes("responds") || reportedImpact.includes("mirrors")) {
    return "responsive"
  }

  return "ambient"
}

// Generate a reflection on how the artwork is present in the collector's space
export function generatePresenceReflection(presence: ArtworkPresence, artworkTitle: string): string {
  const reflections = {
    ambient: `"${artworkTitle}" has become part of your daily environment, subtly influencing the atmosphere and energy of the space. Like street art that transforms an urban landscape, this piece has changed how you experience your surroundings.`,

    provocative: `"${artworkTitle}" maintains a challenging presence in your space, continuing to ask questions and provoke thought. Like powerful street art that forces passersby to confront uncomfortable truths, this piece refuses to let you settle into complacency.`,

    evolving: `"${artworkTitle}" reveals itself differently as time passes, showing new facets and meanings. Like street art that interacts with changing light, weather, and context, this piece continues to unfold in your daily experience.`,

    responsive: `"${artworkTitle}" seems to respond to your presence and state of mind, reflecting different aspects of itself based on your perspective. Like street art that creates a dialogue with those who encounter it, this piece engages in an ongoing conversation with you.`,

    territorial: `"${artworkTitle}" has claimed territory in your space and consciousness. Like street art that transforms and reclaims public spaces, this piece has extended the artist's vision into your environment, creating a zone where their perspective intersects with your daily life.`,
  }

  return reflections[presence.type]
}
