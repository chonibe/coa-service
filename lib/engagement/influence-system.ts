// This system tracks collector influence and their journey toward creative collaboration

export type InfluenceLevel = "Collector" | "Supporter" | "Insider" | "Collaborator" | "Co-Creator"

export interface InfluenceProgress {
  currentLevel: InfluenceLevel
  pointsInLevel: number
  pointsToNextLevel: number
  percentToNextLevel: number
  totalPoints: number
  contributions: number
  feedbackCount: number
  ideasImplemented: number
  recognitionCount: number
}

const LEVEL_THRESHOLDS = {
  Collector: 0,
  Supporter: 100,
  Insider: 300,
  Collaborator: 700,
  "Co-Creator": 1500,
}

const LEVEL_BENEFITS = {
  Collector: ["Exclusive content access", "Artist updates"],
  Supporter: ["Early access to new content", "Feedback opportunities", "Name recognition"],
  Insider: ["Behind-the-scenes process videos", "Idea submission privileges", "Voting rights on artistic decisions"],
  Collaborator: ["Direct messaging with artist", "Influence on upcoming works", "Credit in selected works"],
  "Co-Creator": ["Collaborative creation opportunities", "Featured in artist's story", "VIP access to studio events"],
}

export function calculateInfluenceLevel(points: number): InfluenceLevel {
  if (points >= LEVEL_THRESHOLDS["Co-Creator"]) return "Co-Creator"
  if (points >= LEVEL_THRESHOLDS["Collaborator"]) return "Collaborator"
  if (points >= LEVEL_THRESHOLDS["Insider"]) return "Insider"
  if (points >= LEVEL_THRESHOLDS["Supporter"]) return "Supporter"
  return "Collector"
}

export function getNextLevel(currentLevel: InfluenceLevel): InfluenceLevel | null {
  switch (currentLevel) {
    case "Collector":
      return "Supporter"
    case "Supporter":
      return "Insider"
    case "Insider":
      return "Collaborator"
    case "Collaborator":
      return "Co-Creator"
    case "Co-Creator":
      return null
    default:
      return null
  }
}

export function calculateInfluenceProgress(
  points: number,
  contributions: number,
  feedbackCount: number,
  ideasImplemented: number,
  recognitionCount: number,
): InfluenceProgress {
  const currentLevel = calculateInfluenceLevel(points)
  const nextLevel = getNextLevel(currentLevel)

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel]
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : Number.POSITIVE_INFINITY

  const pointsInLevel = points - currentThreshold
  const pointsToNextLevel = nextThreshold - points
  const percentToNextLevel = nextLevel
    ? Math.min(100, Math.round((pointsInLevel / (nextThreshold - currentThreshold)) * 100))
    : 100

  return {
    currentLevel,
    pointsInLevel,
    pointsToNextLevel,
    percentToNextLevel,
    totalPoints: points,
    contributions,
    feedbackCount,
    ideasImplemented,
    recognitionCount,
  }
}

export function getLevelBenefits(level: InfluenceLevel): string[] {
  return LEVEL_BENEFITS[level] || []
}

export function getPointsForAction(action: string): number {
  const pointValues = {
    view_content: 5,
    maintain_streak: 10,
    streak_milestone: 50,
    provide_feedback: 25,
    submit_idea: 30,
    idea_implemented: 100,
    share_content: 15,
    attend_event: 40,
    direct_message: 20,
    receive_recognition: 75,
  }

  return pointValues[action as keyof typeof pointValues] || 0
}
