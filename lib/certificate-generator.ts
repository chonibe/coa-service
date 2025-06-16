import crypto from "crypto"

export async function generateCertificate(certificateData: any): Promise<string> {
  // Generate a unique certificate URL based on the line item ID
  const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  const certificateUrl = `${baseUrl}/certificate/${certificateData.lineItem.id}`

  return certificateUrl
} 