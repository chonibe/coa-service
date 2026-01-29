import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

/**
 * Generates a unique barcode for a product variant
 * Uses a combination of timestamp, random bytes, and optional product ID for uniqueness
 */
export function generateUniqueBarcode(productId?: string): string {
  // Get current timestamp in milliseconds
  const timestamp = Date.now().toString()

  // Generate 8 random bytes and convert to hex
  const randomBytes = crypto.randomBytes(8).toString('hex').toUpperCase()

  // If productId is provided, include first 8 chars for additional uniqueness
  const productPrefix = productId ? productId.substring(0, 8).toUpperCase() : ''

  // Create barcode by combining components
  // Format: PREFIX-TIMESTAMP-RANDOM (e.g., PROD123-1703123456789-A1B2C3D4E5F6789)
  const barcode = `${productPrefix ? productPrefix + '-' : ''}${timestamp}-${randomBytes}`

  return barcode
}

/**
 * Generates a barcode for a product variant based on product and variant information
 * Ensures uniqueness across all variants of a product
 */
export function generateProductVariantBarcode(
  productId: string,
  variantIndex: number,
  existingBarcodes: string[] = []
): string {
  let barcode: string
  let attempts = 0
  const maxAttempts = 100

  do {
    // Generate base barcode
    barcode = generateUniqueBarcode(productId)

    // Add variant index to ensure uniqueness within product
    if (variantIndex > 0) {
      barcode = `${barcode}-V${variantIndex}`
    }

    attempts++
    if (attempts >= maxAttempts) {
      // Fallback to UUID if we can't generate a unique barcode
      barcode = uuidv4().toUpperCase()
      break
    }
  } while (existingBarcodes.includes(barcode))

  return barcode
}

/**
 * Validates a barcode format
 * Basic validation to ensure barcode follows expected pattern
 */
export function isValidBarcode(barcode: string): boolean {
  if (!barcode || barcode.length < 10) {
    return false
  }

  // Check for basic structure: contains hyphens and alphanumeric characters
  const barcodeRegex = /^[A-Z0-9]+(-[A-Z0-9]+)*$/
  return barcodeRegex.test(barcode)
}

/**
 * Generates barcodes for all variants of a product
 * Ensures each variant gets a unique barcode
 */
export function generateBarcodesForProductVariants(
  productId: string,
  variantCount: number
): string[] {
  const barcodes: string[] = []

  for (let i = 0; i < variantCount; i++) {
    const barcode = generateProductVariantBarcode(productId, i, barcodes)
    barcodes.push(barcode)
  }

  return barcodes
}