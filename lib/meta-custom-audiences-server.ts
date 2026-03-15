/**
 * Meta Custom Audiences API - Server-Side Implementation
 *
 * Adds users to Meta Custom Audiences for retargeting and lookalike audience building.
 * Automatically syncs buyers and leads to Meta Custom Audiences.
 *
 * Reference: https://developers.facebook.com/docs/marketing-api/reference/custom-audience/users
 */

import crypto from 'crypto'

const META_DATASET_API_KEY = process.env.META_DATASET_API_KEY
const META_CUSTOM_AUDIENCE_ID = process.env.META_CUSTOM_AUDIENCE_ID
const META_API_VERSION = process.env.META_API_VERSION || 'v22.0'

/**
 * Hash value using SHA-256 (for PII fields)
 */
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/**
 * Normalize phone number (remove non-digits except leading +)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Add user to Meta Custom Audience
 * 
 * @param email - User's email address (required)
 * @param phone - User's phone number (optional)
 * @param firstName - User's first name (optional)
 * @param lastName - User's last name (optional)
 * @returns Success status and result/error
 */
export async function addUserToAudience(
  email: string,
  options?: {
    phone?: string
    firstName?: string
    lastName?: string
  }
): Promise<{ success: boolean; result?: any; error?: any; skipped?: boolean }> {
  if (!META_DATASET_API_KEY || !META_CUSTOM_AUDIENCE_ID) {
    return {
      success: false,
      skipped: true,
      error: 'Missing META_DATASET_API_KEY or META_CUSTOM_AUDIENCE_ID',
    }
  }

  if (!email || !email.trim()) {
    return {
      success: false,
      error: 'Email is required',
    }
  }

  // Build user data with hashed PII
  const userData: Record<string, string> = {
    EMAIL: sha256(email),
  }

  if (options?.phone) {
    const normalized = normalizePhone(options.phone)
    if (normalized) {
      userData.PHONE = sha256(normalized)
    }
  }

  if (options?.firstName) {
    userData.FN = sha256(options.firstName.trim())
  }

  if (options?.lastName) {
    userData.LN = sha256(options.lastName.trim())
  }

  // Meta Custom Audiences API expects an array of user objects
  const payload = {
    data: [userData],
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_CUSTOM_AUDIENCE_ID}/users?access_token=${encodeURIComponent(META_DATASET_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result }
    }

    return { success: true, result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
