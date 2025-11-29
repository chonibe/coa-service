import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Remove Physical Item, Virtual Event, Exclusive Access, Discount, and Credits Bonus
    await supabase
      .from("benefit_types")
      .delete()
      .in("name", ["Physical Item", "Virtual Event", "Exclusive Access", "Discount", "Credits Bonus"])

    // Add new circular benefit types
    const newTypes = [
      {
        name: "Hidden Series",
        description: "Unlock access to a hidden series only available to collectors who purchase this artwork",
        icon: "lock",
      },
      {
        name: "VIP Artwork Unlock",
        description: "Unlock a specific artwork from a VIP series",
        icon: "crown",
      },
      {
        name: "Early Drop Access",
        description: "Get early access to the next drop date before public release",
        icon: "clock",
      },
      {
        name: "Exclusive Visibility",
        description: "See series or artwork only visible to perk holders",
        icon: "eye",
      },
    ]

    for (const type of newTypes) {
      await supabase
        .from("benefit_types")
        .upsert(type, { onConflict: "name" })
    }

    // Update existing benefit types descriptions
    await supabase
      .from("benefit_types")
      .update({
        description: "Digital files such as PDFs, videos, or images that collectors can access",
      })
      .eq("name", "Digital Content")

    await supabase
      .from("benefit_types")
      .update({
        description: "Behind-the-scenes content showing your artistic process and journey",
      })
      .eq("name", "Behind the Scenes")

    return NextResponse.json({
      success: true,
      message: "Benefit types updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating benefit types:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

