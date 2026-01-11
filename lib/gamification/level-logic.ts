import { getTotalCreditsEarned } from '@/lib/banking/balance-calculator';

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpRequiredForNextLevel: number;
  progress: number; // 0 to 100
  evolutionStage: number; // 1 to 4
  totalCreditsEarned: number;
  totalCredits: number;
}

/**
 * Calculate level based on total credits earned.
 * Level formula: level = floor(sqrt(totalCreditsEarned / 50)) + 1
 */
export function calculateLevel(totalCreditsEarned: number, currentBalance: number = 0): LevelInfo {
  const level = Math.floor(Math.sqrt(totalCreditsEarned / 50)) + 1;
  
  const currentLevelXpBase = Math.pow(level - 1, 2) * 50;
  const nextLevelXpBase = Math.pow(level, 2) * 50;
  
  const xpIntoLevel = totalCreditsEarned - currentLevelXpBase;
  const xpRequiredForNextLevel = nextLevelXpBase - currentLevelXpBase;
  const progress = Math.min(100, Math.floor((xpIntoLevel / xpRequiredForNextLevel) * 100));

  // Evolution stages based on level (REVISED for more frequent changes)
  let evolutionStage = 1;
  if (level >= 10) evolutionStage = 4;      // Legend at Level 10+ (~8,100 XP / $810 spent)
  else if (level >= 6) evolutionStage = 3;  // Artist at Level 6+ (~2,500 XP / $250 spent)
  else if (level >= 3) evolutionStage = 2;  // Tagger at Level 3+ (~400 XP / $40 collector spent)

  return {
    level,
    xpIntoLevel,
    xpRequiredForNextLevel,
    progress,
    evolutionStage,
    totalCreditsEarned,
    totalCredits: currentBalance,
  };
}

/**
 * Get the level info for a collector
 */
export async function getCollectorLevel(collectorIdentifier: string): Promise<LevelInfo> {
  const { calculateCollectorBalance, getTotalCreditsEarned } = await import('@/lib/banking/balance-calculator');
  const { getCollectorProfile } = await import('@/lib/collectors');
  
  const totalCreditsEarned = await getTotalCreditsEarned(collectorIdentifier);
  const balance = await calculateCollectorBalance(collectorIdentifier);
  
  // Backfill logic: If profile spend is higher than ledger credits, use spend as XP base
  // This ensures historical customers get their levels
  let xpBase = totalCreditsEarned;
  try {
    const profile = await getCollectorProfile(collectorIdentifier);
    if (profile && profile.total_spent > 0) {
      const spendCredits = Math.floor(profile.total_spent * 10);
      if (spendCredits > xpBase) {
        xpBase = spendCredits;
      }
    }
  } catch (err) {
    console.warn('[Level Logic] Could not fetch profile for backfill:', err);
  }
  
  return calculateLevel(xpBase, balance.balance);
}

