import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guardAdminRequest } from "@/lib/auth-guards";

export async function GET(request: NextRequest) {
  // Guard the request for admin only
  const guardResult = guardAdminRequest(request);
  if (guardResult.kind !== "ok") {
    return guardResult.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const supabase = createClient();
    
    // Fetch logs from the sql_execution_audit table
    const { data, error, count } = await supabase
      .from("sql_execution_audit")
      .select("*", { count: "exact" })
      .order("executed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: data,
      pagination: {
        total: count,
        limit,
        offset,
      }
    });
  } catch (error) {
    console.error("Unexpected error fetching audit logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
