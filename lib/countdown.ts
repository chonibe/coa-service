// lib/countdown.ts

export function getCountdownFromConfig(unlockConfig: any): { unlockAt: string } | null {
    // Check for unlock_at (one-time)
    if (unlockConfig?.unlock_at) {
      return { unlockAt: unlockConfig.unlock_at };
    }
    
    // Check for unlock_schedule (recurring)
    if (unlockConfig?.unlock_schedule) {
      // This is a placeholder for a more complex calculation based on a schedule.
      // For now, we'll assume the schedule always points to a future unlock_at.
      // In a real application, you'd iterate through the schedule to find the next valid unlock.
      if (Array.isArray(unlockConfig.unlock_schedule) && unlockConfig.unlock_schedule.length > 0) {
          // For simplicity, taking the first schedule entry's unlock_at
          const nextUnlock = unlockConfig.unlock_schedule.find((s: any) => new Date(s.unlock_at) > new Date());
          if (nextUnlock) {
              return { unlockAt: nextUnlock.unlock_at };
          }
      }
      // Fallback if no future schedule found or schedule is not an array
      return null;
    }
    
    return null;
  }
  
  export function formatCountdown(unlockAt: string): string {
    const unlockDate = new Date(unlockAt);
    const now = new Date();
    const diff = unlockDate.getTime() - now.getTime();
  
    if (diff <= 0) {
      return "Unlocked";
    }
  
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
  
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${remainingHours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${remainingMinutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
