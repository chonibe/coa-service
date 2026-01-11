import { createClient } from '@/lib/supabase/server';
import { rewardCreditsForSeriesCompletion } from '@/lib/banking/credit-reward';

/**
 * Check if a collector has completed a series and reward them if so.
 */
export async function checkAndRewardSeriesCompletion(
  userId: string,
  email: string,
  seriesId: string
): Promise<{ completed: boolean; alreadyRewarded: boolean; rewardResult?: any }> {
  const supabase = createClient();

  try {
    // 1. Get all members in the series
    const { data: members, error: membersError } = await supabase
      .from('artwork_series_members')
      .select('id, product_id, submission_id')
      .eq('series_id', seriesId);

    if (membersError || !members || members.length === 0) {
      return { completed: false, alreadyRewarded: false };
    }

    // 2. Get all line items owned by the collector
    const { data: ownedItems, error: itemsError } = await supabase
      .from('order_line_items_v2')
      .select('product_id, submission_id')
      .or(`owner_id.eq.${userId},owner_email.eq.${email}`)
      .eq('status', 'active');

    if (itemsError || !ownedItems) {
      return { completed: false, alreadyRewarded: false };
    }

    // 3. Check if every member is owned
    const ownedProductIds = new Set(ownedItems.map(i => i.product_id).filter(Boolean));
    const ownedSubmissionIds = new Set(ownedItems.map(i => i.submission_id).filter(Boolean));

    const isCompleted = members.every(member => {
      if (member.product_id) return ownedProductIds.has(member.product_id);
      if (member.submission_id) return ownedSubmissionIds.has(member.submission_id);
      return false;
    });

    if (!isCompleted) {
      return { completed: false, alreadyRewarded: false };
    }

    // 4. Reward credits
    const rewardResult = await rewardCreditsForSeriesCompletion(email, seriesId);

    return {
      completed: true,
      alreadyRewarded: rewardResult.creditsDeposited === 0 && rewardResult.success,
      rewardResult,
    };
  } catch (error) {
    console.error('Error checking series completion:', error);
    return { completed: false, alreadyRewarded: false };
  }
}

