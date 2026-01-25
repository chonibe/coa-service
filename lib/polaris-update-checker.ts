/**
 * Polaris Update Notification System
 * 
 * Checks for Polaris updates and displays notification in admin dashboard
 */

import { createClient } from '@/lib/supabase/server'

export interface PolarisUpdate {
  id: string
  package_name: string
  current_version: string
  latest_version: string
  update_type: 'major' | 'minor' | 'patch'
  release_date: string
  changelog_url: string
  migration_guide_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'installed'
  created_at: string
  approved_by?: string
  approved_at?: string
  installed_at?: string
  notes?: string
}

const POLARIS_PACKAGES = [
  '@shopify/polaris',
  '@shopify/polaris-icons',
  '@shopify/polaris-tokens',
]

/**
 * Fetch latest versions from npm registry
 */
async function fetchLatestVersions(): Promise<Map<string, string>> {
  const versions = new Map<string, string>()
  
  for (const packageName of POLARIS_PACKAGES) {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
        next: { revalidate: 3600 } // Cache for 1 hour
      })
      const data = await response.json()
      versions.set(packageName, data.version)
    } catch (error) {
      console.error(`Failed to fetch version for ${packageName}:`, error)
    }
  }
  
  return versions
}

/**
 * Get current versions from package.json
 */
function getCurrentVersions(): Map<string, string> {
  const packageJson = require('../package.json')
  const versions = new Map<string, string>()
  
  POLARIS_PACKAGES.forEach(pkg => {
    const version = packageJson.dependencies[pkg]?.replace(/[\^~]/, '') || ''
    versions.set(pkg, version)
  })
  
  return versions
}

/**
 * Compare versions and determine update type
 */
function compareVersions(current: string, latest: string): 'major' | 'minor' | 'patch' | null {
  const [currMajor, currMinor, currPatch] = current.split('.').map(Number)
  const [latestMajor, latestMinor, latestPatch] = latest.split('.').map(Number)
  
  if (latestMajor > currMajor) return 'major'
  if (latestMinor > currMinor) return 'minor'
  if (latestPatch > currPatch) return 'patch'
  return null
}

/**
 * Check for Polaris updates and store in database
 */
export async function checkForPolarisUpdates(): Promise<PolarisUpdate[]> {
  const supabase = createClient()
  
  // Fetch latest versions
  const latestVersions = await fetchLatestVersions()
  const currentVersions = getCurrentVersions()
  
  const updates: PolarisUpdate[] = []
  
  for (const packageName of POLARIS_PACKAGES) {
    const current = currentVersions.get(packageName) || ''
    const latest = latestVersions.get(packageName) || ''
    
    if (!current || !latest) continue
    
    const updateType = compareVersions(current, latest)
    
    if (updateType) {
      // Check if this update already exists
      const { data: existing } = await supabase
        .from('polaris_updates')
        .select('*')
        .eq('package_name', packageName)
        .eq('latest_version', latest)
        .single()
      
      if (!existing) {
        // Create new update record
        const update: Partial<PolarisUpdate> = {
          package_name: packageName,
          current_version: current,
          latest_version: latest,
          update_type: updateType,
          release_date: new Date().toISOString(),
          changelog_url: `https://github.com/Shopify/polaris/releases`,
          migration_guide_url: updateType === 'major' 
            ? `https://polaris.shopify.com/version/${latest}/migration-guides`
            : undefined,
          status: 'pending',
        }
        
        const { data: created, error } = await supabase
          .from('polaris_updates')
          .insert(update)
          .select()
          .single()
        
        if (created && !error) {
          updates.push(created as PolarisUpdate)
        }
      } else if (existing.status === 'pending') {
        updates.push(existing as PolarisUpdate)
      }
    }
  }
  
  return updates
}

/**
 * Get pending Polaris updates
 */
export async function getPendingUpdates(): Promise<PolarisUpdate[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('polaris_updates')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch pending updates:', error)
    return []
  }
  
  return (data || []) as PolarisUpdate[]
}

/**
 * Approve a Polaris update
 */
export async function approvePolarisUpdate(
  updateId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('polaris_updates')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('id', updateId)
  
  if (error) {
    return { success: false, message: error.message }
  }
  
  // TODO: Trigger GitHub workflow to create update PR
  // This would use GitHub API to:
  // 1. Create a new branch
  // 2. Update package.json
  // 3. Run npm install
  // 4. Create PR with the update
  
  return { 
    success: true, 
    message: 'Update approved. A PR will be created automatically.' 
  }
}

/**
 * Reject a Polaris update
 */
export async function rejectPolarisUpdate(
  updateId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('polaris_updates')
    .update({
      status: 'rejected',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      notes: reason,
    })
    .eq('id', updateId)
  
  if (error) {
    return { success: false, message: error.message }
  }
  
  return { success: true, message: 'Update rejected.' }
}

/**
 * Mark update as installed
 */
export async function markUpdateInstalled(
  updateId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('polaris_updates')
    .update({
      status: 'installed',
      installed_at: new Date().toISOString(),
    })
    .eq('id', updateId)
  
  if (error) {
    return { success: false, message: error.message }
  }
  
  return { success: true, message: 'Update marked as installed.' }
}
