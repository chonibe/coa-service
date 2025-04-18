// Mock data for demonstrating collector circle entry
export const mockCollectorProfile = {
  id: "collector789",
  name: "Alex Mercer",
  profileImageUrl: "/thoughtful-gaze.png",
  location: {
    city: "Chicago",
    country: "USA",
  },
  interests: ["Contemporary Photography", "Jazz", "International Travel", "Coffee"],
  collectionFocus: [
    "Mid-career contemporary artists",
    "Works addressing urban life and technology",
    "Emerging photographers",
  ],
  readingList: [
    { title: "The Goldfinch", author: "Donna Tartt" },
    { title: "Just Kids", author: "Patti Smith" },
    { title: "On Photography", author: "Susan Sontag" },
  ],
  artistsFollowed: [
    { id: "artist111", name: "Maya Lin", profileImageUrl: "/creative-portrait.png" },
    { id: "artist222", name: "Takashi Murakami", profileImageUrl: "/diverse-professional-profiles.png" },
    { id: "artist333", name: "Cindy Sherman", profileImageUrl: "/mystical-forest-spirit.png" },
  ],
  favoriteGalleries: [
    { name: "Gagosian", location: "New York" },
    { name: "White Cube", location: "London" },
    { name: "Rhona Hoffman Gallery", location: "Chicago" },
  ],
  recentEvents: [
    { name: "Art Basel Miami", date: "December 2023" },
    { name: "Chicago Art Expo", date: "September 2023" },
    { name: "MCA Benefit Gala", date: "June 2023" },
  ],
  recentAcquisitions: [
    { title: "Untitled #12", artist: "Hiroshi Sugimoto", year: "2022", date: "3 months ago" },
    { title: "City Lights", artist: "Julie Mehretu", year: "2021", date: "6 months ago" },
  ],
  socialEngagement: [
    {
      type: "comment",
      content: "The depth of field in this series is remarkable",
      target: "On Maya Lin's recent work",
    },
    { type: "like", content: "Liked a post about emerging Chicago artists", target: "MCA Chicago's post" },
  ],
  externalProfiles: [
    { platform: "Instagram", url: "#" },
    { platform: "LinkedIn", url: "#" },
    { platform: "Artsy", url: "#" },
  ],
  insights:
    "Highly values personal studio visits and behind-the-scenes access. Prefers direct communication from artists rather than gallery intermediaries. Particularly interested in the intersection of art and social issues.",
  connections: ["gallery_owner_123", "curator_456", "collector_group_789"],
}

// Mutual connections with the artist
export const mockMutualConnections = [
  {
    id: "mutual_1",
    name: "Sarah Chen",
    role: "Gallery Director, Pace Gallery",
    profileImageUrl: "/diverse-professional-profiles.png",
    relationship: {
      toArtist: "Former exhibiting gallery",
      toCollector: "Regular art advisor",
    },
    introductionQuality: 95, // 0-100 score
  },
  {
    id: "mutual_2",
    name: "James Wilson",
    role: "Curator, MCA Chicago",
    profileImageUrl: "/diverse-group-city.png",
    relationship: {
      toArtist: "Included in group show (2022)",
      toCollector: "Board committee member",
    },
    introductionQuality: 80,
  },
]

// Recent interactions between collector and artist
export const mockInteractions = [
  {
    id: "interaction_1",
    date: "2023-11-15",
    type: "email",
    content: "Thank you for your purchase of 'Chromatic Flow #42'",
    sentiment: "positive",
    responseRate: "same-day",
    nextStep: "None recorded",
  },
  {
    id: "interaction_2",
    date: "2023-12-03",
    type: "direct_message",
    content: "Shared behind-the-scenes studio process photos",
    sentiment: "very_positive",
    responseRate: "within-hour",
    nextStep: "Collector asked about techniques",
  },
  {
    id: "interaction_3",
    date: "2024-01-20",
    type: "email",
    content: "Invitation to private studio visit",
    sentiment: "neutral",
    responseRate: "none",
    nextStep: "Follow-up needed",
  },
]

// Detected opportunities for connection
export const mockOpportunities = [
  {
    id: "opportunity_1",
    type: "event",
    title: "Chicago Art Expo Opening Night",
    date: "2024-05-15",
    description: "Collector is listed as attending. Artist has work in Booth 23.",
    connectionScore: 90,
  },
  {
    id: "opportunity_2",
    type: "interest",
    title: "Jazz Connection",
    description: "Collector follows jazz photographer Herman Leonard. Artist's new series features jazz influences.",
    connectionScore: 85,
  },
  {
    id: "opportunity_3",
    type: "mutual_connection",
    title: "Introduction via Sarah Chen",
    description: "Sarah recently mentioned the collector's interest in the artist's upcoming series.",
    connectionScore: 95,
  },
]
