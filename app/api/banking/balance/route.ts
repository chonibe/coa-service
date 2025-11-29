import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCollectorBalance, calculateUnifiedCollectorBalance, getTotalCreditsEarned } from '@/lib/banking/balance-calculator';
import { checkPerkUnlockStatus } from '@/lib/banking/perk-redemption';
import { getCollectorAccount } from '@/lib/banking/account-manager';

/**
 * GET /api/banking/balance
 * Get collector balance, account info, and perk unlock status
 * Query params: collector_identifier (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectorIdentifier = searchParams.get('collector_identifier');

    if (!collectorIdentifier) {
      return NextResponse.json(
        { error: 'collector_identifier is required' },
        { status: 400 }
      );
    }

    // Get account
    const account = await getCollectorAccount(collectorIdentifier);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get unified balance (both credits and USD)
    const unifiedBalance = await calculateUnifiedCollectorBalance(collectorIdentifier);

    // Get credits balance (for backward compatibility)
    const creditsBalance = await calculateCollectorBalance(collectorIdentifier);

    // Get perk unlock status
    const perkStatus = await checkPerkUnlockStatus(collectorIdentifier);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        collectorIdentifier: account.collectorIdentifier,
        accountType: account.accountType,
        accountStatus: account.accountStatus,
      },
      balance: {
        // Credits balance (for backward compatibility)
        balance: creditsBalance.balance,
        creditsEarned: creditsBalance.creditsEarned,
        creditsSpent: creditsBalance.creditsSpent,
        // Unified balance (credits and USD)
        creditsBalance: unifiedBalance.creditsBalance,
        usdBalance: unifiedBalance.usdBalance,
        totalCreditsEarned: unifiedBalance.totalCreditsEarned,
        totalUsdEarned: unifiedBalance.totalUsdEarned,
      },
      perks: perkStatus,
    });
  } catch (error: any) {
    console.error('Error getting balance:', error);
    return NextResponse.json(
      { error: 'Failed to get balance', message: error.message },
      { status: 500 }
    );
  }
}

