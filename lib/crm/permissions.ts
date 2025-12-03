/**
 * CRM Permissions Helper
 * Utilities for checking and managing workspace permissions
 */

export type PermissionScope =
  | 'people.read'
  | 'people.write'
  | 'people.delete'
  | 'companies.read'
  | 'companies.write'
  | 'companies.delete'
  | 'activities.read'
  | 'activities.write'
  | 'fields.manage'
  | 'lists.manage'
  | 'webhooks.manage'
  | 'settings.manage'
  | 'members.manage'

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  permissions: Record<string, boolean>
  is_active: boolean
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  supabase: any,
  userId: string,
  permission: PermissionScope,
  workspaceId?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_workspace_permission', {
      p_user_id: userId,
      p_permission_name: permission,
      p_workspace_id: workspaceId || null,
    })

    if (error) {
      console.error('[Permissions] Error checking permission:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('[Permissions] Unexpected error:', error)
    return false
  }
}

/**
 * Get user's role in workspace
 */
export async function getUserRole(
  supabase: any,
  userId: string,
  workspaceId?: string
): Promise<WorkspaceRole | 'none'> {
  try {
    const { data, error } = await supabase.rpc('get_workspace_member_role', {
      p_user_id: userId,
      p_workspace_id: workspaceId || null,
    })

    if (error) {
      console.error('[Permissions] Error getting role:', error)
      return 'none'
    }

    return (data as WorkspaceRole) || 'none'
  } catch (error) {
    console.error('[Permissions] Unexpected error:', error)
    return 'none'
  }
}

/**
 * Get workspace member record
 */
export async function getWorkspaceMember(
  supabase: any,
  userId: string,
  workspaceId?: string
): Promise<WorkspaceMember | null> {
  try {
    let query = supabase
      .from('crm_workspace_members')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      role: data.role as WorkspaceRole,
      permissions: (data.permissions as Record<string, boolean>) || {},
      is_active: data.is_active,
    }
  } catch (error) {
    console.error('[Permissions] Error getting workspace member:', error)
    return null
  }
}

/**
 * Require permission - throws error if user doesn't have permission
 */
export async function requirePermission(
  supabase: any,
  userId: string,
  permission: PermissionScope,
  workspaceId?: string
): Promise<void> {
  const hasPermission = await checkPermission(supabase, userId, permission, workspaceId)
  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  supabase: any,
  userId: string,
  permissions: PermissionScope[],
  workspaceId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (await checkPermission(supabase, userId, permission, workspaceId)) {
      return true
    }
  }
  return false
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  supabase: any,
  userId: string,
  permissions: PermissionScope[],
  workspaceId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await checkPermission(supabase, userId, permission, workspaceId))) {
      return false
    }
  }
  return true
}


