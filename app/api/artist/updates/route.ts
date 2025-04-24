import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get("artist")

    if (!artistName) {
      return NextResponse.json({ success: false, message: "Artist name is required" }, { status: 400 })
    }

    // In a real implementation, you would fetch updates from your database
    // For demo purposes, we'll return mock data

    const updates = [
      {
        id: `update-${artistName}-1`,
        title: "New Exhibition Announced",
        content: `I'm excited to announce my upcoming exhibition 'Reflections' opening next month at Gallery Modern. This will feature some of the limited editions you've collected.`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        type: "announcement",
      },
      {
        id: `update-${artistName}-2`,
        title: "Studio Process Video",
        content:
          "I've just uploaded a new video showing the creation process behind this limited edition. Exclusive for my collectors!",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
        type: "content",
        mediaUrl: "/creative-workspace.png",
      },
      {
        id: `update-${artistName}-3`,
        title: "Thank You to My Collectors",
        content:
          "I wanted to take a moment to thank all of you who have supported my work by collecting these limited editions. Your support means everything to me as an artist.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
        type: "message",
      },
    ]

    return NextResponse.json({
      success: true,
      updates,
    })
  } catch (error: any) {
    console.error("Error fetching artist updates:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch artist updates" },
      { status: 500 },
    )
  }
}
