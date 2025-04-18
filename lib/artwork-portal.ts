/**
 * This file outlines the philosophy of artwork as a magical portal
 * connecting collectors to artists - similar to paintings in Harry Potter
 * where subjects occasionally visit their frames.
 *
 * The artwork itself becomes a living connection - a piece of the artist
 * that lives in the collector's space.
 */

export type PortalState =
  | "dormant" // The artwork is present but inactive
  | "resonating" // The artwork shows signs of activity
  | "awakened" // The artist is present/visiting through the artwork
  | "lingering" // Traces of recent artist presence remain
  | "responsive" // The artwork responds to collector interaction

export interface PortalEvent {
  type: "visit" | "message" | "revelation" | "invitation" | "transformation"
  description: string
  duration?: number // in seconds
  frequency?: "rare" | "occasional" | "regular"
  triggered_by?: "time" | "interaction" | "milestone" | "artist_action"
}

export const portalStates: Record<PortalState, string> = {
  dormant: "The artwork rests quietly in your space, a beautiful but silent presence.",
  resonating: "Something has changed - the artwork seems alive with subtle energy, as if preparing for something.",
  awakened: "The portal is active - the artist's presence flows through the artwork into your space.",
  lingering: "Though the artist has gone, traces of their recent presence remain in the artwork.",
  responsive: "The artwork responds to your attention, acknowledging your presence.",
}

// Events that can occur through the artwork portal
export const portalEvents: PortalEvent[] = [
  {
    type: "visit",
    description: "The artist appears through the artwork, sharing new perspectives or stories.",
    duration: 180, // 3 minutes
    frequency: "rare",
    triggered_by: "artist_action",
  },
  {
    type: "message",
    description: "A message from the artist materializes, meant only for you as the collector.",
    duration: 300, // 5 minutes
    frequency: "occasional",
    triggered_by: "time",
  },
  {
    type: "revelation",
    description: "The artwork reveals hidden details or meaning previously unseen.",
    duration: 240, // 4 minutes
    frequency: "regular",
    triggered_by: "interaction",
  },
  {
    type: "invitation",
    description: "The artwork becomes a doorway to an exclusive event or opportunity.",
    duration: 600, // 10 minutes
    frequency: "rare",
    triggered_by: "milestone",
  },
  {
    type: "transformation",
    description: "The artwork subtly shifts or changes, revealing new dimensions.",
    duration: 400, // ~7 minutes
    frequency: "occasional",
    triggered_by: "time",
  },
]

// Determine if a portal event should occur
export function shouldTriggerPortalEvent(
  lastEventTime: Date | null,
  interactionCount: number,
  collectionAge: number, // in days
  artistInitiated: boolean,
): boolean {
  // This would be a more sophisticated algorithm in production
  // For now, we'll use something simple

  // If artist initiated, always trigger
  if (artistInitiated) return true

  // If first week, more frequent events to establish connection
  if (collectionAge < 7) return Math.random() < 0.4

  // Base probability decreases over time but never disappears
  // This creates anticipation and special feelings when it happens
  const baseProbability = Math.max(0.05, 0.25 - collectionAge * 0.001)

  // Interaction increases probability slightly
  const interactionBonus = Math.min(0.2, interactionCount * 0.01)

  // Recency damper - less likely if recent event
  const recencyFactor = lastEventTime
    ? Math.min(1, (Date.now() - lastEventTime.getTime()) / (1000 * 60 * 60 * 24 * 3)) // 3 day recovery
    : 1

  return Math.random() < (baseProbability + interactionBonus) * recencyFactor
}

// Select which event should occur
export function selectPortalEvent(
  collectionAge: number,
  interactionCount: number,
  previousEvents: string[],
): PortalEvent {
  // Weight the events based on frequency and previous occurrences
  const weightedEvents = portalEvents.map((event) => {
    let weight = 1

    // Adjust weight by configured frequency
    if (event.frequency === "rare") weight *= 0.3
    if (event.frequency === "occasional") weight *= 0.6

    // Less weight if this event happened recently
    if (previousEvents.includes(event.type)) {
      weight *= 0.3
    }

    // Special conditions for certain events
    if (event.type === "invitation" && collectionAge < 14) {
      weight *= 0.1 // Invitations rare when newly collected
    }

    if (event.type === "revelation" && interactionCount > 5) {
      weight *= 1.5 // Revelations more common with engaged collectors
    }

    return { event, weight }
  })

  // Calculate total weight
  const totalWeight = weightedEvents.reduce((sum, item) => sum + item.weight, 0)

  // Random selection based on weight
  const random = Math.random() * totalWeight
  let cumulativeWeight = 0

  for (const { event, weight } of weightedEvents) {
    cumulativeWeight += weight
    if (random <= cumulativeWeight) {
      return event
    }
  }

  // Fallback
  return portalEvents[0]
}
