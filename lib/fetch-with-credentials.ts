/**
 * Utility function to ensure fetch requests include credentials (cookies)
 * This is necessary for httpOnly cookies to be sent with requests
 */
export async function fetchWithCredentials(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
  })
}

