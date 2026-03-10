import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .rpc('check_product_id_types')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check product ID types' },
      { status: 500 }
    )
  }
} 