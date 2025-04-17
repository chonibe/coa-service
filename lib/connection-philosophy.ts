/**
 * This file outlines the philosophical approach to the artist-collector connection.
 *
 * Core principles:
 * 1. Authenticity - All interactions should feel genuine and artist-driven
 * 2. Insight - Content should provide meaningful glimpses into the artist's process and thinking
 * 3. Reciprocity - The relationship should be mutually enriching, not transactional
 * 4. Subtlety - The experience should be understated, allowing the art and ideas to be central
 * 5. Depth - Prioritize meaningful connections over engagement metrics
 */

export type ConnectionStage =
  | "observer" // Initial stage - viewing and appreciating
  | "interpreter" // Beginning to understand the artist's intent
  | "correspondent" // Engaging in meaningful dialogue
  | "confidant" // Trusted with deeper insights and process
  | "collaborator" // Rare stage where ideas flow both ways

export interface ConnectionInsight {
  stage: ConnectionStage
  description: string
  artistPerspective: string
  collectorPerspective: string
}

export const connectionInsights: Record<ConnectionStage, ConnectionInsight> = {
  observer: {
    stage: "observer",
    description: "The beginning of understanding an artist's work",
    artistPerspective: "Sharing glimpses of process and inspiration",
    collectorPerspective: "Discovering the layers of meaning in collected works",
  },
  interpreter: {
    stage: "interpreter",
    description: "Finding personal meaning in the artist's vision",
    artistPerspective: "Revealing more context and intention behind the work",
    collectorPerspective: "Developing a personal relationship with the work's meaning",
  },
  correspondent: {
    stage: "correspondent",
    description: "A dialogue of ideas begins to form",
    artistPerspective: "Valuing the collector's perspective and insights",
    collectorPerspective: "Contributing thoughts that resonate with the artist",
  },
  confidant: {
    stage: "confidant",
    description: "A trusted relationship where deeper process is shared",
    artistPerspective: "Sharing vulnerable aspects of creation and doubt",
    collectorPerspective: "Providing a safe space for artistic exploration",
  },
  collaborator: {
    stage: "collaborator",
    description: "A rare symbiosis where ideas flow between both parties",
    artistPerspective: "Finding inspiration in the collector's perspective",
    collectorPerspective: "Seeing one's thoughts reflected in new works",
  },
}

export function determineConnectionStage(
  interactions: number,
  meaningfulExchanges: number,
  sharedInsights: number,
  timeWithWork: number,
): ConnectionStage {
  // This is intentionally not algorithmic or gamified
  // In a real implementation, this would be artist-determined
  // based on qualitative assessment of the relationship

  if (meaningfulExchanges > 5 && sharedInsights > 3) return "collaborator"
  if (meaningfulExchanges > 3 && timeWithWork > 10) return "confidant"
  if (meaningfulExchanges > 1 && interactions > 5) return "correspondent"
  if (interactions > 3 || timeWithWork > 5) return "interpreter"
  return "observer"
}
