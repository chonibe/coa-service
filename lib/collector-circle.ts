/**
 * This file outlines practical strategies for artists to enter a collector's actual social circle.
 * Unlike abstract connection philosophies, these approaches focus on real-world touchpoints and
 * genuine relationship building between artists and collectors.
 */

export type CircleEntry =
  | "shared-interest" // Connect through common interests, hobbies, or causes
  | "local-presence" // Local exhibitions, events, or mutual connections
  | "personal-touch" // Personalized communication and gestures
  | "value-adding" // Providing unique value to the collector
  | "trusted-introduction" // Being introduced by mutual connections

export interface CircleStrategy {
  type: CircleEntry
  description: string
  examples: string[]
  implementation: string
  metrics: string[]
}

export const circleStrategies: Record<CircleEntry, CircleStrategy> = {
  "shared-interest": {
    type: "shared-interest",
    description: "Connect through shared interests, hobbies, or causes that matter to both artist and collector",
    examples: [
      "Discussing favorite books, films, or music",
      "Supporting the same causes or charities",
      "Sharing travel experiences to similar locations",
      "Common backgrounds or educational experiences",
    ],
    implementation:
      "Research collector interests from social media or mutual connections. Reference these in communications and find genuine points of overlap.",
    metrics: [
      "Topics that generate extended conversations",
      "Collector-initiated followups on shared interests",
      "Invitations to interest-related events",
    ],
  },
  "local-presence": {
    type: "local-presence",
    description: "Establish a genuine presence in the collector's local community or social scene",
    examples: [
      "Attending the same gallery openings or cultural events",
      "Participating in local arts organizations",
      "Exhibiting at venues frequented by the collector",
      "Becoming part of the collector's extended professional network",
    ],
    implementation:
      "Map the collector's local arts engagement and strategically participate in those spaces without being intrusive.",
    metrics: [
      "Frequency of organic in-person encounters",
      "Mutual connections established",
      "Recognition at community events",
    ],
  },
  "personal-touch": {
    type: "personal-touch",
    description:
      "Create meaningful, non-generic interactions that demonstrate genuine interest in the collector as a person",
    examples: [
      "Remembering personal details and referencing them naturally",
      "Sending handwritten notes rather than typed messages",
      "Creating small customized works or sketches",
      "Marking important personal milestones with thoughtful gestures",
    ],
    implementation:
      "Maintain detailed but respectful notes on collector preferences and important dates. Schedule regular personalized touchpoints.",
    metrics: [
      "Collector responsiveness to personal gestures",
      "Reciprocal personal sharing from collector",
      "Tone shift in communications (more casual/friendly)",
    ],
  },
  "value-adding": {
    type: "value-adding",
    description: "Provide unique value to the collector beyond just creating art they can purchase",
    examples: [
      "Sharing insider knowledge about the art world",
      "Making introductions to other artists or galleries",
      "Offering expertise in related fields",
      "Providing early access to opportunities or information",
    ],
    implementation:
      "Identify collector needs or interests where you have valuable insights or connections to offer without expectation of immediate return.",
    metrics: [
      "Collector requests for your perspective or advice",
      "Valuable exchanges initiated by collector",
      "Acknowledgment of your helpful role",
    ],
  },
  "trusted-introduction": {
    type: "trusted-introduction",
    description: "Leverage mutual connections for warm introductions into the collector's circle",
    examples: [
      "Gallerist introductions to their close collectors",
      "Fellow artist referrals to their collector contacts",
      "Mutual friend connections at social events",
      "Industry professional recommendations",
    ],
    implementation:
      "Map your network for potential connection points to the collector. Nurture relationships with connectors who can facilitate meaningful introductions.",
    metrics: [
      "Quality of introductions received",
      "Depth of following conversations",
      "Subsequent direct contact initiated by collector",
    ],
  },
}

// Identify most promising circle entry strategies based on available information
export function identifyEntryStrategies(
  collectorProfile: any,
  artistProfile: any,
  priorInteractions: any[] = [],
): CircleEntry[] {
  const strategies: CircleEntry[] = []

  // Sample implementation using real data points
  // In a production app, this would analyze actual data

  // Check for shared interests
  if (collectorProfile.interests && artistProfile.interests) {
    const sharedInterests = collectorProfile.interests.filter((interest: string) =>
      artistProfile.interests.includes(interest),
    )
    if (sharedInterests.length > 0) {
      strategies.push("shared-interest")
    }
  }

  // Check for local presence opportunities
  if (
    collectorProfile.location &&
    artistProfile.location &&
    collectorProfile.location.city === artistProfile.location.city
  ) {
    strategies.push("local-presence")
  }

  // Check for prior positive personal interactions
  const hasPersonalHistory = priorInteractions.some(
    (interaction) => interaction.type === "personal" && interaction.sentiment === "positive",
  )
  if (hasPersonalHistory) {
    strategies.push("personal-touch")
  }

  // Check for value-adding opportunities
  if (artistProfile.expertise && collectorProfile.interests) {
    const relevantExpertise = artistProfile.expertise.some((skill: string) =>
      collectorProfile.interests.includes(skill),
    )
    if (relevantExpertise) {
      strategies.push("value-adding")
    }
  }

  // Check for mutual connections
  const hasMutualConnections = collectorProfile.connections?.some((connection: string) =>
    artistProfile.connections?.includes(connection),
  )
  if (hasMutualConnections) {
    strategies.push("trusted-introduction")
  }

  // If no strategies identified, default to personal-touch and shared-interest
  // as these can be developed with limited information
  if (strategies.length === 0) {
    strategies.push("personal-touch", "shared-interest")
  }

  return strategies
}

// Generate concrete next actions for an artist based on identified strategies
export function generateNextActions(strategies: CircleEntry[], collectorProfile: any): string[] {
  const actions: string[] = []

  strategies.forEach((strategy) => {
    switch (strategy) {
      case "shared-interest":
        if (collectorProfile.interests?.length > 0) {
          const interest = collectorProfile.interests[0]
          actions.push(`Share a thoughtful article or resource related to ${interest}`)
          actions.push(`Reference how ${interest} influences your work in your next communication`)
        } else {
          actions.push("Research collector's social media for interest clues")
        }
        break

      case "local-presence":
        actions.push("Identify top 3 events this collector is likely to attend in the next month")
        actions.push("Schedule your own exhibition or attendance at venues frequented by the collector")
        break

      case "personal-touch":
        actions.push("Create a small sketch or work inspired by a conversation with this collector")
        actions.push("Send a handwritten note marking an anniversary of their collection purchase")
        break

      case "value-adding":
        actions.push("Share exclusive insights about an upcoming art event relevant to their interests")
        actions.push("Offer introduction to another artist whose work would complement their collection")
        break

      case "trusted-introduction":
        actions.push("Contact mutual connection to facilitate a purposeful introduction")
        actions.push("Attend specific event where mutual connection can make in-person introduction")
        break
    }
  })

  return actions
}
