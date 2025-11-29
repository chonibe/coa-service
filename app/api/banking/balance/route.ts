import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCollectorBalance, calculateUnifiedCollectorBalance, getTotalCreditsEarned } from '@/lib/banking/balance-calculator';
import { checkPerkUnlockStatus } from '@/lib/banking/perk-redemption';
import { getCollectorAccount, getOrCreateCollectorAccount } from '@/lib/banking/account-manager';

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

    // Get or create account
    let account;
    try {
      const supabase = createClient();
      
      // Try to determine account type from the identifier
      // Check if it's a vendor (by vendor_name or auth_id)
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, auth_id, vendor_name')
        .or(`vendor_name.eq.${collectorIdentifier},auth_id.eq.${collectorIdentifier}`)
        .maybeSingle();
      
      if (vendor) {
        // It's a vendor - use auth_id as identifier (or vendor_name as fallback)
        const vendorCollectorIdentifier = vendor.auth_id || vendor.vendor_name;
        account = await getOrCreateCollectorAccount(vendorCollectorIdentifier, 'vendor', vendor.id);
      } else {
        // Try to get existing account first
        account = await getCollectorAccount(collectorIdentifier);
        
        // If account doesn't exist, create it as customer
        if (!account) {
          account = await getOrCreateCollectorAccount(collectorIdentifier, 'customer');
        }
      }
    } catch (error: any) {
      console.error('Error getting/creating collector account:', error);
      // If it's a migration error, return a helpful message
      if (error.message?.includes('Database migration required')) {
        return NextResponse.json(
          { error: 'Database migration required', message: error.message },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to get account', message: error.message },
        { status: 500 }
      );
    }

    // Get unified balance (both credits and USD)
    let unifiedBalance;
    try {
      unifiedBalance = await calculateUnifiedCollectorBalance(collectorIdentifier);
    } catch (error: any) {
      console.error('Error calculating unified balance:', error);
      // Return default balance if calculation fails
      unifiedBalance = {
        creditsBalance: 0,
        usdBalance: 0,
        totalCreditsEarned: 0,
        totalUsdEarned: 0,
      };
    }

    // Get credits balance (for backward compatibility)
    let creditsBalance;
    try {
      creditsBalance = await calculateCollectorBalance(collectorIdentifier);
    } catch (error: any) {
      console.error('Error calculating credits balance:', error);
      // Return default balance if calculation fails
      creditsBalance = {
        balance: 0,
        creditsEarned: 0,
        creditsSpent: 0,
      };
    }

    // Get perk unlock status
    let perkStatus;
    try {
      perkStatus = await checkPerkUnlockStatus(collectorIdentifier);
    } catch (error: any) {
      console.error('Error checking perk status:', error);
      // Return empty perk status if check fails
      perkStatus = {
        unlockedPerks: [],
        lockedPerks: [],
      };
    }

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

