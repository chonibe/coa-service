import { createClient } from '@/lib/supabase/server';
import { 
  LAMP_UNLOCK_THRESHOLD_CREDITS, 
  PROOF_PRINT_UNLOCK_THRESHOLD_CREDITS 
} from './types';
import { getTotalCreditsEarned } from './balance-calculator';
import type { PerkRedemptionResult, CollectorPerkType } from './types';

/**
 * Redeem a perk (lamp or proof print)
 * Checks unlock eligibility on redemption
 * If threshold met, unlocks and redeems for free (0 credits)
 * 
 * @param collectorIdentifier - Collector identifier
 * @param perkType - 'lamp' or 'proof_print'
 * @param productSku - Product SKU for lamps (optional)
 * @param artworkSubmissionId - Artwork submission ID for proof prints (optional)
 */
export async function redeemPerk(
  collectorIdentifier: string,
  perkType: CollectorPerkType,
  productSku?: string,
  artworkSubmissionId?: string
): Promise<PerkRedemptionResult> {
  const supabase = createClient();

  try {
    // Get total credits earned (for unlock check)
    const totalCreditsEarned = await getTotalCreditsEarned(collectorIdentifier);

    // Determine unlock threshold
    const unlockThreshold = perkType === 'lamp' 
      ? LAMP_UNLOCK_THRESHOLD_CREDITS 
      : PROOF_PRINT_UNLOCK_THRESHOLD_CREDITS;

    // Check if unlocked
    const unlocked = totalCreditsEarned >= unlockThreshold;

    if (!unlocked) {
      return {
        success: false,
        unlocked: false,
        error: `Perk not unlocked. Earned: ${totalCreditsEarned} credits, Required: ${unlockThreshold} credits`,
      };
    }

    // Check if already redeemed (prevent duplicates)
    // For lamps, check by product_sku; for proof prints, check by artwork_submission_id
    const existingQuery = supabase
      .from('collector_perk_redemptions')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('perk_type', perkType)
      .eq('redemption_status', 'pending');

    if (perkType === 'lamp' && productSku) {
      existingQuery.eq('product_sku', productSku);
    } else if (perkType === 'proof_print' && artworkSubmissionId) {
      existingQuery.eq('artwork_submission_id', artworkSubmissionId);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      return {
        success: false,
        unlocked: true,
        error: 'Perk already redeemed',
      };
    }

    // Create redemption record (free - no credits deducted)
    const { data: redemption, error: redemptionError } = await supabase
      .from('collector_perk_redemptions')
      .insert({
        collector_identifier: collectorIdentifier,
        perk_type: perkType,
        product_sku: productSku || null,
        artwork_submission_id: artworkSubmissionId || null,
        unlocked_at: new Date().toISOString(),
        total_credits_earned_at_unlock: totalCreditsEarned,
        redemption_status: 'pending',
        ledger_entry_id: null, // No ledger entry for free perks
      })
      .select()
      .single();

    if (redemptionError || !redemption) {
      console.error('Error creating perk redemption:', redemptionError);
      return {
        success: false,
        unlocked: true,
        error: `Failed to create redemption: ${redemptionError?.message || 'Unknown error'}`,
      };
    }

    // Optionally create a ledger entry with 0 amount for tracking
    // (or leave it null since it's free)
    // For now, we'll leave ledger_entry_id as null

    return {
      success: true,
      redemptionId: redemption.id,
      unlocked: true,
      creditsEarnedAtUnlock: totalCreditsEarned,
    };
  } catch (error: any) {
    console.error('Error redeeming perk:', error);
    return {
      success: false,
      unlocked: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Check perk unlock status without redeeming
 */
export async function checkPerkUnlockStatus(
  collectorIdentifier: string
): Promise<{
  lamp: { unlocked: boolean; progress: number; creditsEarned: number; threshold: number };
  proofPrint: { unlocked: boolean; progress: number; creditsEarned: number; threshold: number };
}> {
  const totalCreditsEarned = await getTotalCreditsEarned(collectorIdentifier);

  const lampUnlocked = totalCreditsEarned >= LAMP_UNLOCK_THRESHOLD_CREDITS;
  const proofPrintUnlocked = totalCreditsEarned >= PROOF_PRINT_UNLOCK_THRESHOLD_CREDITS;

  return {
    lamp: {
      unlocked: lampUnlocked,
      progress: Math.min(100, (totalCreditsEarned / LAMP_UNLOCK_THRESHOLD_CREDITS) * 100),
      creditsEarned: totalCreditsEarned,
      threshold: LAMP_UNLOCK_THRESHOLD_CREDITS,
    },
    proofPrint: {
      unlocked: proofPrintUnlocked,
      progress: Math.min(100, (totalCreditsEarned / PROOF_PRINT_UNLOCK_THRESHOLD_CREDITS) * 100),
      creditsEarned: totalCreditsEarned,
      threshold: PROOF_PRINT_UNLOCK_THRESHOLD_CREDITS,
    },
  };
}

