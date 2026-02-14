import { NextRequest, NextResponse } from 'next/server';
import { guardAdminRequest } from '@/lib/auth-guards';
import { getAdminEmailFromCookieStore } from '@/lib/admin-session';
import { createClient } from '@/lib/supabase/server';
import { createRefundDeduction } from '@/lib/banking/refund-deduction';
import { ensureCollectorAccount } from '@/lib/banking/account-manager';
import { invalidateVendorBalanceCache, clearBalanceCache } from '@/lib/vendor-balance-calculator';
import { logAdminAction } from '@/lib/audit-logger';

/**
 * POST /api/admin/payouts/reconcile-ledger
 *
 * Admin-only endpoint that scans and fixes the ledger in one operation:
 *
 * 1. Finds `payout_earned` entries whose orders are now voided/refunded
 *    and creates offsetting `refund_deduction` entries.
 *
 * 2. Finds items in `vendor_payout_items` (marked as paid) that lack
 *    a corresponding `payout_withdrawal` entry and creates them.
 *
 * Idempotent: safe to re-run — duplicate entries are checked before creation.
 */
export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request);
  if (auth.kind !== 'ok') {
    return auth.response;
  }

  const adminEmail = getAdminEmailFromCookieStore(request.cookies);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Admin email not found' }, { status: 401 });
  }

  const supabase = createClient();

  // Optional: dry-run mode via query param
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';

  const summary = {
    refundDeductions: { scanned: 0, created: 0, skipped: 0, errors: [] as string[] },
    missingWithdrawals: { scanned: 0, created: 0, skipped: 0, errors: [] as string[] },
    dryRun,
  };

  try {
    // ─── Step 1: Fix stale payout_earned entries for cancelled/refunded orders ───

    // Fetch all payout_earned entries (with line_item_id)
    let allEarnedEntries: any[] = [];
    let earnedFrom = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error, count } = await supabase
        .from('collector_ledger_entries')
        .select('id, collector_identifier, line_item_id, amount, metadata', { count: 'exact' })
        .eq('transaction_type', 'payout_earned')
        .eq('currency', 'USD')
        .not('line_item_id', 'is', null)
        .range(earnedFrom, earnedFrom + pageSize - 1);

      if (error) {
        console.error('[reconcile] Error fetching payout_earned entries:', error);
        break;
      }

      if (batch && batch.length > 0) {
        allEarnedEntries = [...allEarnedEntries, ...batch];
        earnedFrom += pageSize;
        hasMore = batch.length === pageSize && (count === null || earnedFrom < count);
      } else {
        hasMore = false;
      }
    }

    summary.refundDeductions.scanned = allEarnedEntries.length;
    console.log(`[reconcile] Scanning ${allEarnedEntries.length} payout_earned entries...`);

    // Get unique line_item_ids to check orders
    const lineItemIds = allEarnedEntries
      .map((e) => e.line_item_id)
      .filter(Boolean) as string[];

    // Batch-fetch line items with their order financial_status
    const lineItemOrderMap = new Map<string, { financial_status: string; order_id: string }>();
    for (let i = 0; i < lineItemIds.length; i += pageSize) {
      const chunk = lineItemIds.slice(i, i + pageSize);
      const { data: lineItems, error: liError } = await supabase
        .from('order_line_items_v2')
        .select('line_item_id, order_id, status, orders!inner(financial_status)')
        .in('line_item_id', chunk);

      if (liError) {
        console.error('[reconcile] Error fetching line items:', liError);
        continue;
      }

      lineItems?.forEach((li: any) => {
        lineItemOrderMap.set(li.line_item_id, {
          financial_status: (li.orders as any)?.financial_status || 'unknown',
          order_id: li.order_id,
        });
      });
    }

    // Batch-fetch existing refund_deduction entries to avoid re-checking each one
    const existingDeductions = new Set<string>();
    for (let i = 0; i < lineItemIds.length; i += pageSize) {
      const chunk = lineItemIds.slice(i, i + pageSize);
      const { data: deductions } = await supabase
        .from('collector_ledger_entries')
        .select('line_item_id')
        .eq('transaction_type', 'refund_deduction')
        .eq('currency', 'USD')
        .in('line_item_id', chunk);

      deductions?.forEach((d: any) => {
        if (d.line_item_id) existingDeductions.add(d.line_item_id);
      });
    }

    // Process: create refund_deduction for cancelled/voided/refunded orders
    const cancelledStatuses = new Set(['voided', 'refunded']);

    for (const entry of allEarnedEntries) {
      const orderInfo = lineItemOrderMap.get(entry.line_item_id);
      if (!orderInfo) continue;

      if (!cancelledStatuses.has(orderInfo.financial_status)) continue;

      // Check if deduction already exists
      if (existingDeductions.has(entry.line_item_id)) {
        summary.refundDeductions.skipped++;
        continue;
      }

      if (dryRun) {
        summary.refundDeductions.created++;
        continue;
      }

      // Create the refund deduction
      const result = await createRefundDeduction(
        entry.collector_identifier,
        entry.line_item_id,
        Math.abs(Number(entry.amount)),
        supabase,
        {
          reconciliation: true,
          original_earned_entry_id: entry.id,
          order_id: orderInfo.order_id,
          order_financial_status: orderInfo.financial_status,
          vendor_name: entry.metadata?.vendor_name || null,
        }
      );

      if (result.success && result.amountDeducted > 0) {
        summary.refundDeductions.created++;
        // Invalidate cache for this vendor
        if (entry.metadata?.vendor_name) {
          invalidateVendorBalanceCache(entry.metadata.vendor_name);
        }
      } else if (result.success && result.amountDeducted === 0) {
        summary.refundDeductions.skipped++; // Idempotent skip
      } else {
        summary.refundDeductions.errors.push(
          `Line item ${entry.line_item_id}: ${result.error}`
        );
      }
    }

    // ─── Step 2: Fix missing payout_withdrawal entries for paid items ───

    // Fetch all vendor_payout_items that have been paid
    let allPaidItems: any[] = [];
    let paidFrom = 0;
    hasMore = true;

    while (hasMore) {
      const { data: batch, error, count } = await supabase
        .from('vendor_payout_items')
        .select('line_item_id, order_id, amount, payout_id, payout_reference', { count: 'exact' })
        .or('payout_id.not.is.null,manually_marked_paid.eq.true')
        .range(paidFrom, paidFrom + pageSize - 1);

      if (error) {
        console.error('[reconcile] Error fetching paid items:', error);
        break;
      }

      if (batch && batch.length > 0) {
        allPaidItems = [...allPaidItems, ...batch];
        paidFrom += pageSize;
        hasMore = batch.length === pageSize && (count === null || paidFrom < count);
      } else {
        hasMore = false;
      }
    }

    summary.missingWithdrawals.scanned = allPaidItems.length;
    console.log(`[reconcile] Scanning ${allPaidItems.length} paid items for missing withdrawals...`);

    // Group paid items by payout_id to create withdrawals per payout
    const payoutGroups = new Map<number, { items: any[]; totalAmount: number }>();
    for (const item of allPaidItems) {
      if (!item.payout_id) continue; // Manual marks without a payout record — skip
      const group = payoutGroups.get(item.payout_id) || { items: [], totalAmount: 0 };
      group.items.push(item);
      group.totalAmount += Number(item.amount || 0);
      payoutGroups.set(item.payout_id, group);
    }

    // Check which payouts already have withdrawal entries
    const payoutIds = Array.from(payoutGroups.keys());
    const existingWithdrawals = new Set<number>();

    for (let i = 0; i < payoutIds.length; i += pageSize) {
      const chunk = payoutIds.slice(i, i + pageSize);
      const { data: withdrawals } = await supabase
        .from('collector_ledger_entries')
        .select('payout_id')
        .eq('transaction_type', 'payout_withdrawal')
        .eq('currency', 'USD')
        .in('payout_id', chunk);

      withdrawals?.forEach((w: any) => {
        if (w.payout_id) existingWithdrawals.add(w.payout_id);
      });
    }

    // Fetch payout records for metadata
    const payoutRecordsMap = new Map<number, any>();
    for (let i = 0; i < payoutIds.length; i += pageSize) {
      const chunk = payoutIds.slice(i, i + pageSize);
      const { data: payouts } = await supabase
        .from('vendor_payouts')
        .select('id, vendor_name, amount, reference, payout_date')
        .in('id', chunk);

      payouts?.forEach((p: any) => payoutRecordsMap.set(p.id, p));
    }

    for (const [payoutId, group] of payoutGroups) {
      if (existingWithdrawals.has(payoutId)) {
        summary.missingWithdrawals.skipped++;
        continue;
      }

      const payoutRecord = payoutRecordsMap.get(payoutId);
      if (!payoutRecord) {
        summary.missingWithdrawals.errors.push(`Payout ${payoutId}: record not found`);
        continue;
      }

      if (dryRun) {
        summary.missingWithdrawals.created++;
        continue;
      }

      // Resolve vendor → collector identifier
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, auth_id, vendor_name')
        .eq('vendor_name', payoutRecord.vendor_name)
        .single();

      if (!vendor) {
        summary.missingWithdrawals.errors.push(
          `Payout ${payoutId}: vendor "${payoutRecord.vendor_name}" not found`
        );
        continue;
      }

      const collectorIdentifier = vendor.auth_id || payoutRecord.vendor_name;

      // Ensure account exists
      try {
        await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id);
      } catch (e) {
        // Non-fatal — account might already exist
      }

      // Create the missing withdrawal entry
      const withdrawalAmount = Number(payoutRecord.amount) || group.totalAmount;
      const currentYear = new Date().getFullYear();

      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('collector_ledger_entries')
        .insert({
          collector_identifier: collectorIdentifier,
          transaction_type: 'payout_withdrawal',
          amount: -Math.abs(withdrawalAmount),
          currency: 'USD',
          payout_id: payoutId,
          description: `Payout withdrawal (reconciliation): ${payoutRecord.reference || `PAYOUT-${payoutId}`}`,
          metadata: {
            vendor_name: payoutRecord.vendor_name,
            payout_reference: payoutRecord.reference,
            payout_amount: withdrawalAmount,
            payout_date: payoutRecord.payout_date,
            reconciliation: true,
          },
          tax_year: currentYear,
          created_by: 'system-reconciliation',
        })
        .select('id')
        .single();

      if (ledgerError || !ledgerEntry) {
        summary.missingWithdrawals.errors.push(
          `Payout ${payoutId}: ${ledgerError?.message || 'insert failed'}`
        );
      } else {
        summary.missingWithdrawals.created++;
        invalidateVendorBalanceCache(payoutRecord.vendor_name);
      }
    }

    // Clear all balance caches after reconciliation
    clearBalanceCache();

    // Log admin action
    await logAdminAction({
      adminEmail,
      actionType: 'update',
      details: {
        action: 'ledger_reconciliation',
        dryRun,
        summary,
      },
    });

    console.log('[reconcile] Reconciliation complete:', JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      message: dryRun
        ? 'Dry run complete — no changes were made'
        : 'Ledger reconciliation complete',
      summary,
    });
  } catch (error: any) {
    console.error('[reconcile] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Reconciliation failed' },
      { status: 500 }
    );
  }
}
