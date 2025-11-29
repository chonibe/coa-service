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
  const startTime = Date.now();
  const requestId = `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] [balance] Request received`, {
    url: request.url,
    method: request.method,
  });

  try {
    const { searchParams } = new URL(request.url);
    const collectorIdentifier = searchParams.get('collector_identifier');

    console.log(`[${requestId}] [balance] Query params:`, {
      collector_identifier: collectorIdentifier ? collectorIdentifier.substring(0, 20) + '...' : null,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    if (!collectorIdentifier) {
      console.error(`[${requestId}] [balance] Missing collector_identifier`);
      return NextResponse.json(
        { error: 'collector_identifier is required', requestId },
        { status: 400 }
      );
    }

    // Get or create account
    let account;
    try {
      console.log(`[${requestId}] [balance] Getting/creating account for:`, {
        collectorIdentifier: collectorIdentifier.substring(0, 20) + '...',
      });

      const supabase = createClient();
      
      // Try to determine account type from the identifier
      // Check if it's a vendor (by vendor_name or auth_id)
      console.log(`[${requestId}] [balance] Checking if identifier is a vendor...`);
      const { data: vendor, error: vendorCheckError } = await supabase
        .from('vendors')
        .select('id, auth_id, vendor_name')
        .or(`vendor_name.eq.${collectorIdentifier},auth_id.eq.${collectorIdentifier}`)
        .maybeSingle();
      
      console.log(`[${requestId}] [balance] Vendor check result:`, {
        found: !!vendor,
        error: vendorCheckError,
        vendor: vendor ? {
          id: vendor.id,
          vendor_name: vendor.vendor_name,
          has_auth_id: !!vendor.auth_id,
        } : null,
      });
      
      if (vendor) {
        // It's a vendor - use auth_id as identifier (or vendor_name as fallback)
        const vendorCollectorIdentifier = vendor.auth_id || vendor.vendor_name;
        console.log(`[${requestId}] [balance] Creating/getting vendor account:`, {
          vendorCollectorIdentifier: vendorCollectorIdentifier.substring(0, 20) + '...',
          vendorId: vendor.id,
        });
        account = await getOrCreateCollectorAccount(vendorCollectorIdentifier, 'vendor', vendor.id);
      } else {
        // Try to get existing account first
        console.log(`[${requestId}] [balance] Checking for existing customer account...`);
        account = await getCollectorAccount(collectorIdentifier);
        
        // If account doesn't exist, create it as customer
        if (!account) {
          console.log(`[${requestId}] [balance] Creating new customer account...`);
          account = await getOrCreateCollectorAccount(collectorIdentifier, 'customer');
        }
      }

      console.log(`[${requestId}] [balance] Account result:`, {
        found: !!account,
        accountId: account?.id,
        accountType: account?.accountType,
        collectorIdentifier: account?.collectorIdentifier?.substring(0, 20) + '...',
      });
    } catch (error: any) {
      console.error(`[${requestId}] [balance] Error getting/creating collector account:`, {
        error: error.message,
        stack: error.stack,
        code: error.code,
      });
      // If it's a migration error, return a helpful message
      if (error.message?.includes('Database migration required')) {
        return NextResponse.json(
          { error: 'Database migration required', message: error.message, requestId },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to get account', message: error.message, requestId },
        { status: 500 }
      );
    }

    // Get unified balance (both credits and USD)
    let unifiedBalance;
    try {
      console.log(`[${requestId}] [balance] Calculating unified balance...`);
      unifiedBalance = await calculateUnifiedCollectorBalance(collectorIdentifier);
      console.log(`[${requestId}] [balance] Unified balance calculated:`, {
        creditsBalance: unifiedBalance.creditsBalance,
        usdBalance: unifiedBalance.usdBalance,
        totalCreditsEarned: unifiedBalance.totalCreditsEarned,
        totalUsdEarned: unifiedBalance.totalUsdEarned,
      });
    } catch (error: any) {
      console.error(`[${requestId}] [balance] Error calculating unified balance:`, {
        error: error.message,
        stack: error.stack,
      });
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

    const response = {
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
      requestId,
    };

    console.log(`[${requestId}] [balance] Success - returning balance:`, {
      accountType: account.accountType,
      creditsBalance: unifiedBalance.creditsBalance,
      usdBalance: unifiedBalance.usdBalance,
      duration: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`[${requestId}] [balance] Unexpected error:`, {
      error: error.message,
      stack: error.stack,
      duration: `${Date.now() - startTime}ms`,
    });
    return NextResponse.json(
      { error: 'Failed to get balance', message: error.message, requestId },
      { status: 500 }
    );
  }
}

