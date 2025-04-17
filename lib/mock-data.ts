import type { Artist, Perk } from "@/types/perks"
import type { InfluenceProgress } from "@/lib/engagement/influence-system"

// Mock artist data
export const mockArtist: Artist = {
  id: "artist123",
  name: "Chanchal Banga",
  profile_image_url: "/creative-portrait.png",
  bio: "Digital artist exploring the intersection of technology and consciousness through abstract forms and vibrant color relationships. My work examines how perception shapes our understanding of reality.",
}

// Mock perks data
export const mockPerks: Perk[] = [
  {
    id: "perk1",
    artist_id: "artist123",
    type: "personal-message",
    title: "A personal message for you",
    content:
      "Thank you for collecting my artwork! I'm thrilled to have you as a collector. I've been working on some exciting new pieces that I can't wait to share with you exclusively. Your support means everything to me as an artist.",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "perk2",
    artist_id: "artist123",
    type: "text",
    title: "Behind My Creative Process",
    content:
      "My creative process begins with meditation and gathering visual inspiration from nature. I then sketch concepts digitally before finalizing the composition. Each piece takes between 40-60 hours to complete, with most of that time spent on the intricate details that reveal themselves only upon close inspection.",
    is_active: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "perk3",
    artist_id: "artist123",
    type: "image",
    title: "Exclusive Sneak Peek",
    content: "A preview of my upcoming collection, exclusively for my collectors.",
    src: "/cluttered-creative-space.png",
    is_active: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Mock influence data
export const mockInfluence: InfluenceProgress = {
  currentLevel: "Supporter",
  pointsInLevel: 45,
  pointsToNextLevel: 155,
  percentToNextLevel: 45,
  totalPoints: 145,
  contributions: 3,
  feedbackCount: 2,
  ideasImplemented: 0,
  recognitionCount: 1,
}

// Mock contributors data
export const mockContributors = [
  {
    collectors: {
      name: "Alex Johnson",
      profile_image_url: "/thoughtful-gaze.png",
    },
    influence_points: 320,
    current_level: "Insider",
  },
  {
    collectors: {
      name: "Sam Rivera",
      profile_image_url: "/diverse-group-city.png",
    },
    influence_points: 180,
    current_level: "Supporter",
  },
]

// Mock implemented ideas
export const mockIdeas = [
  {
    id: "idea1",
    title: "Urban Decay Series",
    collectors: {
      name: "Jamie Smith",
    },
    implemented_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
