/**
 * API: Get role change audit log
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdmin } from "@/lib/rbac/middleware"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const supabase = createServiceClient()

    // Get audit logs
    const { data: logsData, error: logsError } = await supabase
      .from("user_role_audit_log")
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(100)

    if (logsError) {
      console.error("[admin/users/audit-log] Error fetching logs:", logsError)
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      )
    }

    // Get user emails for the logs
    const userIds = [...new Set(logsData?.map(log => log.user_id) || [])]
    const performedByIds = [...new Set(logsData?.filter(log => log.performed_by).map(log => log.performed_by!) || [])]
    const allUserIds = [...new Set([...userIds, ...performedByIds])]

    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap = new Map(authUsers?.users.map(u => [u.id, u.email]) || [])

    // Enrich logs with email addresses
    const logs = logsData?.map(log => ({
      ...log,
      user_email: emailMap.get(log.user_id) || "Unknown",
      performed_by_email: log.performed_by ? emailMap.get(log.performed_by) || "System" : "System",
    }))

    return NextResponse.json({
      logs,
      total: logs?.length || 0,
    })
  } catch (error: any) {
    console.error("[admin/users/audit-log] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})
