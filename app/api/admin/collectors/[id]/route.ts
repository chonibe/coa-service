import { NextResponse } from "next/server";
import { getCollectorProfile } from "@/lib/collectors";

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

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("[Collector API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

