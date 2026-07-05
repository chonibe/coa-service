export type PrintFulfillmentConfig = {
  enabled: boolean
  dryRun: boolean
  driveParentFolderId: string
  heidiEmail?: string
  labelAssetFolderId?: string
  artworkAssetFolderId?: string
  fallbackAssetFolderId?: string
  nonPrintableSkus: string[]
  googleCredentialsJson?: string
  googleClientEmail?: string
  googlePrivateKey?: string
  chinaDivisionEnabled: boolean
  chinaDivisionApiKey?: string
  chinaDivisionUcenterBaseUrl: string
  chinaDivisionCustomerId?: string
  chinaDivisionWarehouseId?: string
  chinaDivisionPackingType: "packing_one_box"
  whatsappEnabled: boolean
  whatsappDryRun: boolean
  whatsappAccessToken?: string
  whatsappPhoneNumberId?: string
  whatsappApiVersion: string
  heidiWhatsAppTo?: string
  whatsappTemplateName?: string
  whatsappTemplateLanguage: string
  telegramEnabled: boolean
  telegramDryRun: boolean
  telegramBotToken?: string
  telegramChatId?: string
}

const envBool = (value: string | undefined, defaultValue: boolean) => {
  if (value == null || value === "") return defaultValue
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

export function getPrintFulfillmentConfig(overrides: Partial<PrintFulfillmentConfig> = {}): PrintFulfillmentConfig {
  const cleanOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined)
  ) as Partial<PrintFulfillmentConfig>

  return {
    enabled: envBool(process.env.PRINT_FULFILLMENT_ENABLED, false),
    dryRun: envBool(process.env.PRINT_FULFILLMENT_DRY_RUN, true),
    driveParentFolderId: process.env.PRINT_DRIVE_PARENT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || "",
    heidiEmail: process.env.PRINT_HEIDI_EMAIL || undefined,
    labelAssetFolderId: process.env.PRINT_LABEL_ASSET_FOLDER_ID || undefined,
    artworkAssetFolderId: process.env.PRINT_ARTWORK_ASSET_FOLDER_ID || undefined,
    fallbackAssetFolderId: process.env.PRINT_ASSET_LIBRARY_FOLDER_ID || undefined,
    nonPrintableSkus: (process.env.PRINT_NON_PRINTABLE_SKUS || "StreetLamp001,StreetLamp002")
      .split(",")
      .map((sku) => sku.trim().toLowerCase())
      .filter(Boolean),
    googleCredentialsJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || undefined,
    googleClientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || undefined,
    googlePrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || undefined,
    chinaDivisionEnabled: envBool(process.env.PRINT_CHINADIVISION_ENABLED, false),
    chinaDivisionApiKey: process.env.PRINT_CHINADIVISION_API_KEY || process.env.CHINADIVISION_API_KEY || undefined,
    chinaDivisionUcenterBaseUrl: process.env.PRINT_CHINADIVISION_UCENTER_BASE_URL || "https://stapi.cnstorm.com",
    chinaDivisionCustomerId: process.env.PRINT_CHINADIVISION_CUSTOMER_ID || process.env.CHINADIVISION_CUSTOMER_ID || undefined,
    chinaDivisionWarehouseId: process.env.PRINT_CHINADIVISION_WAREHOUSE_ID || undefined,
    chinaDivisionPackingType: "packing_one_box",
    whatsappEnabled: envBool(process.env.PRINT_WHATSAPP_ENABLED, false),
    whatsappDryRun: envBool(process.env.PRINT_WHATSAPP_DRY_RUN, true),
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || undefined,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || undefined,
    whatsappApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0",
    heidiWhatsAppTo: process.env.PRINT_HEIDI_WHATSAPP_TO || process.env.HEIDI_WHATSAPP_TO || undefined,
    whatsappTemplateName: process.env.PRINT_WHATSAPP_TEMPLATE_NAME || undefined,
    whatsappTemplateLanguage: process.env.PRINT_WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
    telegramEnabled: envBool(process.env.PRINT_TELEGRAM_ENABLED, false),
    telegramDryRun: envBool(process.env.PRINT_TELEGRAM_DRY_RUN, true),
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || undefined,
    telegramChatId: process.env.PRINT_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || undefined,
    ...cleanOverrides,
  }
}

export function assertPrintFulfillmentConfig(config: PrintFulfillmentConfig) {
  if (!config.driveParentFolderId) {
    throw new Error("PRINT_DRIVE_PARENT_FOLDER_ID is required")
  }

  if (!config.googleCredentialsJson && (!config.googleClientEmail || !config.googlePrivateKey)) {
    throw new Error(
      "Google service account credentials are required. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL plus GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    )
  }
}

export function hasGoogleDriveCredentials(config: PrintFulfillmentConfig) {
  return Boolean(
    config.googleCredentialsJson ||
    (config.googleClientEmail && config.googlePrivateKey)
  )
}
