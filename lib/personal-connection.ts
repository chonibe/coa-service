/**
 * This file outlines the philosophy of creating a genuine personal connection
 * between artist and collector - one that feels natural, not engineered.
 */

// The stages of a personal relationship - these happen organically, not as gamified levels
export type RelationshipStage =
  | "acquaintance" // Initial connection through the artwork
  | "familiar" // Beginning to know each other's perspectives
  | "confidant" // Sharing deeper thoughts and processes
  | "collaborator" // Rare - a true meeting of minds

// Types of personal exchanges that might occur
export type ExchangeType =
  | "process_note" // Artist shares how they made something
  | "inspiration" // What sparked the work
  | "personal_story" // A personal connection to the work
  | "question" // Artist asks collector something
  | "recommendation" // Artist suggests something (book, music, etc.)
  | "gratitude" // Simple thanks

export interface PersonalExchange {
  type: ExchangeType
  content: string
  sentAt: Date
  readAt?: Date
  respondedTo: boolean
}

// Simple function to determine relationship stage based on history
// This is intentionally not algorithmic or gamified
export function determineRelationshipStage(
  exchangeCount: number,
  responseRate: number,
  timeSpan: number, // in days
): RelationshipStage {
  if (exchangeCount > 10 && responseRate > 0.7 && timeSpan > 90) return "collaborator"
  if (exchangeCount > 5 && responseRate > 0.5 && timeSpan > 30) return "confidant"
  if (exchangeCount > 2 && timeSpan > 14) return "familiar"
  return "acquaintance"
}

// Generate a simple, personal message from artist to collector
export function generatePersonalMessage(artistName: string, artworkTitle: string, exchangeType: ExchangeType): string {
  const messages = {
    process_note: `I was thinking you might like to know that when I created "${artworkTitle}", I spent nearly three weeks just on the color transitions. There's a section in the lower right that I reworked seven times before it felt right.`,

    inspiration: `I was walking through the city during a rainstorm when the idea for "${artworkTitle}" first came to me. The way the lights reflected in the puddles created this incredible sense of depth that I tried to capture in the piece.`,

    personal_story: `"${artworkTitle}" was created during a particularly challenging time in my life. Making it became a form of meditation for me, and I'm grateful it's found a home with someone who connects with it.`,

    question: `I'm curious - what part of "${artworkTitle}" first drew you in? I always find it fascinating which elements resonate with different people.`,

    recommendation: `I've been reading this book that deeply influenced my thinking while creating "${artworkTitle}" - it's called "The Secret Lives of Color" by Kassia St. Clair. If you enjoy the piece, you might find it interesting too.`,

    gratitude: `I just wanted to send a note of thanks. Knowing "${artworkTitle}" is in your space means a lot to me as an artist. It's why I create.`,
  }

  return `${messages[exchangeType]}\n\n- ${artistName}`
}
