/**
 * Validate redirect path to prevent open redirects.
 * Only allows relative paths starting with / (not // or protocol-relative).
 */
export function isValidRedirectPath(path: string | null): path is string {
  if (!path || typeof path !== "string") return false
  try {
    const decoded = decodeURIComponent(path).trim()
    return decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes("://")
  } catch {
    return false
  }
}
