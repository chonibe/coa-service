import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCollectorBalance } from '@/lib/banking/balance-calculator'

/**
 * GET /api/collector/credits/balance
 * 
 * Returns the authenticated collector's credit balance.
 * Used by the shop nav to show credits in the navigation chip.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json({ balance: 0 })
    }

    const balance = await calculateCollectorBalance(user.email)
    
    return NextResponse.json({ balance })
  } catch (error) {
    console.debug('Credits balance fetch error:', error)
    return NextResponse.json({ balance: 0 })
  }
}
