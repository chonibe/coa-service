/**
 * Generates a certificate URL for a given line item
 */
export async function generateCertificateUrl(lineItemId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  return `${baseUrl}/certificate/${lineItemId}`
} 