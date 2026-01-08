import { NextResponse } from "next/server";
import { searchCollectors } from "@/lib/collectors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const { collectors, total } = await searchCollectors({
      query: search,
      limit,
      offset
    });

    return NextResponse.json({
      collectors,
      total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("[Collectors API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

