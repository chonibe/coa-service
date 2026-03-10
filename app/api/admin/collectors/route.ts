import { NextRequest, NextResponse } from "next/server";
import { searchCollectors } from "@/lib/collectors";
import { guardAdminRequest } from "@/lib/auth-guards"

export async function GET(request: NextRequest) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

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

