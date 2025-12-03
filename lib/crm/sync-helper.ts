import { createClient as createServiceClient } from "@/lib/supabase/server"

/**
 * Check if Gmail sync is needed based on last sync time
 * Returns true if sync should run (never synced, or last sync was more than threshold ago)
 */
export async function shouldSyncGmail(
  userId: string,
  thresholdMinutes: number = 15
): Promise<boolean> {
  try {
    const serviceSupabase = createServiceClient()
    
    // Get user data to check last sync time
    const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(userId)
    
    if (userError || !userData?.user) {
      return false
    }

    const lastSyncedAt = userData.user.app_metadata?.last_gmail_sync_at as string | undefined

    // If never synced, should sync
    if (!lastSyncedAt) {
      return true
    }

    // Check if last sync was more than threshold ago
    const lastSyncDate = new Date(lastSyncedAt)
    const now = new Date()
    const minutesSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60)

    return minutesSinceSync >= thresholdMinutes
  } catch (error) {
    console.error("[Sync Helper] Error checking sync status:", error)
    // On error, allow sync (better to sync than skip)
    return true
  }
}

/**
 * Update last sync timestamp in user metadata
 */
export async function updateLastSyncTime(userId: string): Promise<void> {
  try {
    const serviceSupabase = createServiceClient()
    
    const { data: existingUser } = await serviceSupabase.auth.admin.getUserById(userId)
    const existingMetadata = existingUser?.user?.app_metadata || {}
    
    const metadataUpdate = {
      ...existingMetadata,
      last_gmail_sync_at: new Date().toISOString(),
    }
    
    await serviceSupabase.auth.admin.updateUserById(userId, {
      app_metadata: metadataUpdate,
    })
  } catch (error) {
    console.error("[Sync Helper] Error updating last sync time:", error)
  }
}

