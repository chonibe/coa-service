export type PrintFulfillmentLineItem = {
  sku: string
  title: string
  variantTitle?: string | null
  quantity: number
}

export type PrintFulfillmentOrder = {
  id: string
  name: string
  orderNumber?: string | number | null
  createdAt?: string | null
  lineItems: PrintFulfillmentLineItem[]
}

export type PrintFulfillmentDrivePackage = {
  orderFolderId: string
  orderFolderUrl: string
  labelsFolderId: string
  artworksFolderId: string
  sheetId: string
  sheetUrl: string
}

export type PrintFulfillmentAssetCopy = {
  sku: string
  sourceFileId: string
  copiedFileId: string
  name: string
  target: "Labels" | "Artworks"
}

export type PrintFulfillmentResult = {
  order: {
    id: string
    name: string
  }
  drivePackage: PrintFulfillmentDrivePackage
  copiedAssets: PrintFulfillmentAssetCopy[]
  missingAssets: Array<{
    sku: string
    target: "Labels" | "Artworks"
  }>
  chinaDivision: {
    status: "skipped" | "pending" | "submitted"
    message: string
    receivingOrderId?: string
    shippingSlipFileId?: string
    shippingSlipUrl?: string
  }
  whatsapp: {
    status: "skipped" | "sent" | "failed"
    message: string
    to?: string
    body?: string
    providerMessageId?: string
    providerResponse?: unknown
  }
  telegram: {
    status: "skipped" | "sent" | "failed"
    message: string
    chatId?: string
    body?: string
    providerMessageId?: string
    providerResponse?: unknown
  }
  dryRun: boolean
}
