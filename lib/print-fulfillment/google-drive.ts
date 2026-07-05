import { google } from "googleapis"
import { Readable } from "node:stream"
import type { PrintFulfillmentConfig } from "./config"
import type { PrintFulfillmentOrder } from "./types"

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"
const SHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet"

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

function createGoogleAuth(config: PrintFulfillmentConfig) {
  if (config.googleCredentialsJson) {
    const credentials = JSON.parse(config.googleCredentialsJson)
    return new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    })
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: config.googleClientEmail,
      private_key: config.googlePrivateKey?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  })
}

export function createGoogleDriveClients(config: PrintFulfillmentConfig) {
  const auth = createGoogleAuth(config)
  return {
    drive: google.drive({ version: "v3", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  }
}

export async function findDriveFileByName(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
  mimeType?: string
) {
  const query = [
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    `name = '${escapeDriveQueryValue(name)}'`,
    "trashed = false",
    mimeType ? `mimeType = '${escapeDriveQueryValue(mimeType)}'` : "",
  ].filter(Boolean).join(" and ")

  const response = await drive.files.list({
    q: query,
    fields: "files(id,name,mimeType,webViewLink)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  return response.data.files?.[0] || null
}

export async function ensureDriveFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
  dryRun: boolean
) {
  const existing = await findDriveFileByName(drive, parentId, name, FOLDER_MIME_TYPE)
  if (existing?.id) return existing
  if (dryRun) return { id: `dry-run-folder-${name}`, name }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parentId],
    },
    fields: "id,name,webViewLink",
    supportsAllDrives: true,
  })

  return created.data
}

export async function ensureOrderPrintSheet(
  sheets: ReturnType<typeof google.sheets>,
  drive: ReturnType<typeof google.drive>,
  orderFolderId: string,
  order: PrintFulfillmentOrder,
  dryRun: boolean
) {
  const existing = await findDriveFileByName(drive, orderFolderId, order.name, SHEET_MIME_TYPE)
  const rows = [
    ["Order", order.name],
    ["Shopify Order ID", order.id],
    ["Created", order.createdAt || ""],
    [],
    ["SKU", "QTY to print"],
    ...order.lineItems.map((item) => [
      item.sku,
      item.quantity,
    ]),
  ]

  if (dryRun) {
    return {
      id: existing?.id || `dry-run-sheet-${order.name}`,
      webViewLink: existing?.webViewLink,
    }
  }

  let spreadsheetId = existing?.id
  if (!spreadsheetId) {
    const created = await drive.files.create({
      requestBody: {
        name: order.name,
        mimeType: SHEET_MIME_TYPE,
        parents: [orderFolderId],
      },
      fields: "id,webViewLink",
      supportsAllDrives: true,
    })
    spreadsheetId = created.data.id || undefined
  }

  if (!spreadsheetId) throw new Error("Could not create Google Sheet for print order")

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: "A:Z",
  })
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  })

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 4,
              endRowIndex: 5,
              startColumnIndex: 0,
              endColumnIndex: 2,
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: true,
                },
              },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
      ],
    },
  })

  const file = await drive.files.get({
    fileId: spreadsheetId,
    fields: "id,webViewLink",
    supportsAllDrives: true,
  })

  return file.data
}

export async function shareDriveFileWithHeidi(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
  heidiEmail: string | undefined,
  dryRun: boolean
) {
  if (!heidiEmail || dryRun) return

  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: heidiEmail,
      },
      sendNotificationEmail: false,
      supportsAllDrives: true,
    })
  } catch (error) {
    const code = (error as { code?: number }).code
    if (code !== 409) throw error
  }
}

export async function searchPdfAssetsForSku(
  drive: ReturnType<typeof google.drive>,
  folderId: string | undefined,
  sku: string
) {
  const safeSku = escapeDriveQueryValue(sku)
  const parentClause = folderId ? `'${escapeDriveQueryValue(folderId)}' in parents` : ""
  const response = await drive.files.list({
    q: [
      parentClause.trim(),
      "trashed = false",
      "mimeType = 'application/pdf'",
      `name contains '${safeSku}'`,
    ].filter(Boolean).join(" and "),
    fields: "files(id,name,mimeType,size,webViewLink)",
    pageSize: 50,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  return response.data.files || []
}

export function splitSkuPdfsBySize(files: Array<{ id?: string | null; name?: string | null; size?: string | null }>) {
  const sorted = files
    .filter((file) => file.id && file.name)
    .sort((a, b) => Number(a.size || 0) - Number(b.size || 0))

  if (!sorted.length) return { labels: [], artworks: [] }
  if (sorted.length === 1) return { labels: [sorted[0]], artworks: [] }

  const smallest = sorted[0]
  const largest = sorted[sorted.length - 1]

  return {
    labels: [smallest],
    artworks: largest.id === smallest.id ? [] : [largest],
  }
}

export async function copyDriveFile(
  drive: ReturnType<typeof google.drive>,
  sourceFileId: string,
  targetFolderId: string,
  name: string,
  dryRun: boolean
) {
  const existing = await findDriveFileByName(drive, targetFolderId, name)
  if (existing?.id) return existing
  if (dryRun) return { id: `dry-run-copy-${sourceFileId}`, name }

  const copied = await drive.files.copy({
    fileId: sourceFileId,
    requestBody: {
      name,
      parents: [targetFolderId],
    },
    fields: "id,name,webViewLink",
    supportsAllDrives: true,
  })

  return copied.data
}

export async function uploadDriveFile(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
  mimeType: string,
  content: Buffer,
  dryRun: boolean
) {
  const existing = await findDriveFileByName(drive, parentId, name)
  if (existing?.id) return existing
  if (dryRun) return { id: `dry-run-upload-${name}`, name }

  const uploaded = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
    },
    media: {
      mimeType,
      body: Readable.from(content),
    },
    fields: "id,name,webViewLink",
    supportsAllDrives: true,
  })

  return uploaded.data
}

export function driveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`
}

export function driveSheetUrl(sheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
}
