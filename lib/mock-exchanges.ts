import type { PersonalExchange } from "./personal-connection"

// Mock personal exchanges between artist and collector
export const mockExchanges: PersonalExchange[] = [
  {
    type: "personal_story",
    content: `"Chromatic Flow #42" was created during a particularly challenging time in my life. Making it became a form of meditation for me, and I'm grateful it's found a home with someone who connects with it.\n\n- Chanchal Banga`,
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    readAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), // 1.5 days ago
    respondedTo: true,
  },
  {
    type: "process_note",
    content: `I was thinking you might like to know that when I created "Chromatic Flow #42", I spent nearly three weeks just on the color transitions. There's a section in the lower right that I reworked seven times before it felt right.\n\n- Chanchal Banga`,
    sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    readAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
    respondedTo: true,
  },
  {
    type: "question",
    content: `I'm curious - what part of "Chromatic Flow #42" first drew you in? I always find it fascinating which elements resonate with different people.\n\n- Chanchal Banga`,
    sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    readAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 29 days ago
    respondedTo: true,
  },
]

// Mock collector responses
export const mockResponses = [
  {
    id: "resp1",
    content:
      "Thank you for sharing that. It's amazing to hear about the personal connection you have with this piece. I've placed it in my living room where I can see it every day, and it brings a sense of calm that I really appreciate.",
    sentAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), // 1.5 days ago
    artistName: "Chanchal Banga",
    artworkTitle: "Chromatic Flow #42",
    collectorName: "Alex Morgan",
  },
  {
    id: "resp2",
    content:
      "That's fascinating! I had no idea so much work went into that section. Now when I look at it, I can see the incredible depth there. It's my favorite part of the piece, actually.",
    sentAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
    artistName: "Chanchal Banga",
    artworkTitle: "Chromatic Flow #42",
    collectorName: "Alex Morgan",
  },
  {
    id: "resp3",
    content:
      "It was definitely the way the colors transition in the center. There's something almost hypnotic about it. Every time I look at it, I notice something new.",
    sentAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 29 days ago
    artistName: "Chanchal Banga",
    artworkTitle: "Chromatic Flow #42",
    collectorName: "Alex Morgan",
  },
]
