import type { PrintFulfillmentOrder, PrintFulfillmentResult } from "./types"

export function formatMissingAssets(missingAssets: PrintFulfillmentResult["missingAssets"]) {
  if (!missingAssets.length) return "No missing assets."

  const bySku = new Map<string, string[]>()
  for (const asset of missingAssets) {
    const existing = bySku.get(asset.sku) || []
    existing.push(asset.target)
    bySku.set(asset.sku, existing)
  }

  return Array.from(bySku.entries())
    .map(([sku, targets]) => `${sku}: missing ${targets.join(" and ")}`)
    .join("; ")
}

export function buildPrintFulfillmentMessage(
  order: PrintFulfillmentOrder,
  result: Pick<PrintFulfillmentResult, "drivePackage" | "copiedAssets" | "missingAssets">
) {
  const lines = [
    `Hi Heidi, here is the new order folder for ${order.name}:`,
    `Drive folder: ${result.drivePackage.orderFolderUrl}`,
    "",
    "Please send the files to print, and when you can, send me the payment link.",
    "",
    "Thank you :)",
  ]

  return lines.join("\n")
}
