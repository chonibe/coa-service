import {
  assertPrintFulfillmentConfig,
  getPrintFulfillmentConfig,
  hasGoogleDriveCredentials,
  type PrintFulfillmentConfig,
} from "./config"
import {
  copyDriveFile,
  createGoogleDriveClients,
  driveFolderUrl,
  driveSheetUrl,
  ensureDriveFolder,
  ensureOrderPrintSheet,
  searchPdfAssetsForSku,
  shareDriveFileWithHeidi,
  splitSkuPdfsBySize,
} from "./google-drive"
import { createChinaDivisionReceivingHandoff } from "./chinadivision"
import { fetchShopifyOrderForPrintFulfillment } from "./shopify"
import { notifyHeidiOnTelegram } from "./telegram"
import { notifyHeidiOnWhatsApp } from "./whatsapp"
import type { PrintFulfillmentAssetCopy, PrintFulfillmentOrder, PrintFulfillmentResult } from "./types"

async function copySkuAssets(params: {
  order: PrintFulfillmentOrder
  config: PrintFulfillmentConfig
  drive: ReturnType<typeof createGoogleDriveClients>["drive"]
  labelsFolderId: string
  artworksFolderId: string
}) {
  const copiedAssets: PrintFulfillmentAssetCopy[] = []
  const missingAssets: PrintFulfillmentResult["missingAssets"] = []

  for (const item of params.order.lineItems) {
    if (params.config.nonPrintableSkus.includes(item.sku.toLowerCase())) continue

    let labelAssets: Array<{ id?: string | null; name?: string | null; size?: string | null }> = []
    let artworkAssets: Array<{ id?: string | null; name?: string | null; size?: string | null }> = []

    if (params.config.labelAssetFolderId || params.config.artworkAssetFolderId) {
      labelAssets = await searchPdfAssetsForSku(
        params.drive,
        params.config.labelAssetFolderId,
        item.sku
      )
      artworkAssets = await searchPdfAssetsForSku(
        params.drive,
        params.config.artworkAssetFolderId,
        item.sku
      )
    } else {
      const allSkuPdfs = await searchPdfAssetsForSku(
        params.drive,
        params.config.fallbackAssetFolderId,
        item.sku
      )
      const split = splitSkuPdfsBySize(allSkuPdfs)
      labelAssets = split.labels
      artworkAssets = split.artworks
    }

    if (!labelAssets.length) missingAssets.push({ sku: item.sku, target: "Labels" })
    if (!artworkAssets.length) missingAssets.push({ sku: item.sku, target: "Artworks" })

    for (const asset of labelAssets) {
      if (!asset.id || !asset.name) continue
      const copied = await copyDriveFile(
        params.drive,
        asset.id,
        params.labelsFolderId,
        `${item.sku}.pdf`,
        params.config.dryRun
      )
      if (!copied.id) continue
      copiedAssets.push({
        sku: item.sku,
        sourceFileId: asset.id,
        copiedFileId: copied.id,
        name: `${item.sku}.pdf`,
        target: "Labels",
      })
    }

    for (const asset of artworkAssets) {
      if (!asset.id || !asset.name) continue
      const copied = await copyDriveFile(
        params.drive,
        asset.id,
        params.artworksFolderId,
        `${item.sku}.pdf`,
        params.config.dryRun
      )
      if (!copied.id) continue
      copiedAssets.push({
        sku: item.sku,
        sourceFileId: asset.id,
        copiedFileId: copied.id,
        name: `${item.sku}.pdf`,
        target: "Artworks",
      })
    }
  }

  return { copiedAssets, missingAssets }
}

async function buildDryRunPlan(order: PrintFulfillmentOrder, config: PrintFulfillmentConfig): Promise<PrintFulfillmentResult> {
  const chinaDivision = await createChinaDivisionReceivingHandoff({
    order,
    config: {
      ...config,
      dryRun: true,
    },
  })

  return {
    order: {
      id: order.id,
      name: order.name,
    },
    drivePackage: {
      orderFolderId: `dry-run-folder-${order.name}`,
      orderFolderUrl: driveFolderUrl(`dry-run-folder-${order.name}`),
      labelsFolderId: `dry-run-folder-${order.name}-Labels`,
      artworksFolderId: `dry-run-folder-${order.name}-Artworks`,
      sheetId: `dry-run-sheet-${order.name}`,
      sheetUrl: driveSheetUrl(`dry-run-sheet-${order.name}`),
    },
    copiedAssets: [],
    missingAssets: order.lineItems.flatMap((item) => [
      { sku: item.sku, target: "Labels" as const },
      { sku: item.sku, target: "Artworks" as const },
    ]),
    chinaDivision,
    whatsapp: {
      status: "skipped",
      message: "WhatsApp notification is skipped in Drive dry-run plan.",
    },
    telegram: {
      status: "skipped",
      message: "Telegram notification is skipped in Drive dry-run plan.",
    },
    dryRun: true,
  }
}

export async function preparePrintFulfillmentForOrder(
  order: PrintFulfillmentOrder,
  overrides: Partial<PrintFulfillmentConfig> = {}
): Promise<PrintFulfillmentResult> {
  const config = getPrintFulfillmentConfig(overrides)
  const printableLineItems = order.lineItems.filter(
    (item) => !config.nonPrintableSkus.includes(item.sku.toLowerCase())
  )
  const printableOrder = {
    ...order,
    lineItems: printableLineItems,
  }

  if (config.dryRun && (!config.driveParentFolderId || !hasGoogleDriveCredentials(config))) {
    return buildDryRunPlan(printableOrder, config)
  }

  assertPrintFulfillmentConfig(config)

  if (!printableOrder.lineItems.length) {
    throw new Error(`Order ${order.name} has no printable line items with SKUs`)
  }

  const { drive, sheets } = createGoogleDriveClients(config)
  const orderFolder = await ensureDriveFolder(
    drive,
    config.driveParentFolderId,
    printableOrder.name,
    config.dryRun
  )
  if (!orderFolder.id) throw new Error(`Could not create or find Drive folder for ${printableOrder.name}`)
  if (config.dryRun && orderFolder.id.startsWith("dry-run-folder-")) {
    return buildDryRunPlan(printableOrder, config)
  }

  const labelsFolder = await ensureDriveFolder(drive, orderFolder.id, "Labels", config.dryRun)
  const artworksFolder = await ensureDriveFolder(drive, orderFolder.id, "Artworks", config.dryRun)
  if (!labelsFolder.id || !artworksFolder.id) {
    throw new Error(`Could not create Labels/Artworks folders for ${order.name}`)
  }

  await shareDriveFileWithHeidi(drive, orderFolder.id, config.heidiEmail, config.dryRun)

  const sheet = await ensureOrderPrintSheet(sheets, drive, orderFolder.id, printableOrder, config.dryRun)
  if (!sheet.id) throw new Error(`Could not create print sheet for ${printableOrder.name}`)

  const { copiedAssets, missingAssets } = await copySkuAssets({
    order: printableOrder,
    config,
    drive,
    labelsFolderId: labelsFolder.id,
    artworksFolderId: artworksFolder.id,
  })

  const chinaDivision = await createChinaDivisionReceivingHandoff({
    order: printableOrder,
    config,
    drive,
    orderFolderId: orderFolder.id,
  })

  const partialResult = {
    drivePackage: {
      orderFolderId: orderFolder.id,
      orderFolderUrl: driveFolderUrl(orderFolder.id),
      labelsFolderId: labelsFolder.id,
      artworksFolderId: artworksFolder.id,
      sheetId: sheet.id,
      sheetUrl: driveSheetUrl(sheet.id),
    },
    copiedAssets,
    missingAssets,
  }
  const whatsapp = await notifyHeidiOnWhatsApp({
    order: printableOrder,
    config,
    result: partialResult,
  })
  const telegram = await notifyHeidiOnTelegram({
    order: printableOrder,
    config,
    result: partialResult,
  })

  return {
    order: {
      id: printableOrder.id,
      name: printableOrder.name,
    },
    drivePackage: partialResult.drivePackage,
    copiedAssets,
    missingAssets,
    chinaDivision,
    whatsapp,
    telegram,
    dryRun: config.dryRun,
  }
}

export async function preparePrintFulfillmentForShopifyOrderId(
  orderId: string,
  overrides: Partial<PrintFulfillmentConfig> = {}
) {
  const order = await fetchShopifyOrderForPrintFulfillment(orderId)
  return preparePrintFulfillmentForOrder(order, overrides)
}
