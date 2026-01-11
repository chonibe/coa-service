import { NextResponse } from "next/server";
import { getCollectorProfile } from "@/lib/collectors";
import { getCollectorAvatar } from "@/lib/gamification/avatar";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id; // This can be user_id or user_email

  try {
    const profile = await getCollectorProfile(id);

    if (!profile) {
      return NextResponse.json({ error: "Collector not found" }, { status: 404 });
    }

    // Attempt to get avatar data
    let avatar = null;
    if (profile.user_id && profile.user_email) {
      try {
        avatar = await getCollectorAvatar(profile.user_id, profile.user_email);
      } catch (avatarError) {
        console.warn("[Collector API] Could not fetch registered avatar:", avatarError);
      }
    } else if (profile.user_email) {
      // Fallback for guest/unregistered collectors
      try {
        const { getCollectorLevel } = await import('@/lib/gamification/level-logic');
        const xpInfo = await getCollectorLevel(profile.user_email);
        avatar = {
          level: xpInfo.level,
          evolutionStage: xpInfo.evolutionStage,
          xpInfo,
          equippedItems: {},
          inventory: []
        };
      } catch (guestError) {
        console.warn("[Collector API] Could not fetch guest avatar:", guestError);
      }
    }

    return NextResponse.json({
      ...profile,
      avatar
    });
  } catch (error: any) {
    console.error("[Collector API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

