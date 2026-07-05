import { google } from "googleapis"
import type { PrintFulfillmentConfig } from "./config"
import { uploadDriveFile } from "./google-drive"
import type { PrintFulfillmentOrder, PrintFulfillmentResult } from "./types"

type ChinaDivisionJson<T = unknown> = {
  error_code?: number
  code?: number
  msg?: string
  message?: string
  content?: T
  data?: T
}

type ChinaDivisionSkuInfo = {
  batch_number?: string
  product_id?: string
  sku: string
  sn?: string
  product_name?: string
  product_color?: string
  product_size?: string
  product_url?: string
  customer_id?: number | string
  sku_alias?: string
  qty?: number
  qty_per_box?: number
}

type CreateReceivingParams = {
  order: PrintFulfillmentOrder
  config: PrintFulfillmentConfig
  drive?: ReturnType<typeof google.drive>
  orderFolderId?: string
}

const SHIPPING_SLIP_NAME = "ChinaDivision shipping slip.pdf"

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

function assertChinaDivisionSuccess<T>(json: ChinaDivisionJson<T>, context: string): T {
  const code = json.error_code ?? json.code ?? 0
  if (code !== 0) {
    throw new Error(`${context} failed: ${json.msg || json.message || `ChinaDivision code ${code}`}`)
  }

  return (json.content ?? json.data ?? {}) as T
}

async function chinaDivisionFetch<T>(
  config: PrintFulfillmentConfig,
  path: string,
  init: RequestInit = {}
) {
  if (!config.chinaDivisionApiKey) {
    throw new Error("PRINT_CHINADIVISION_API_KEY or CHINADIVISION_API_KEY is required")
  }

  const baseUrl = trimTrailingSlash(config.chinaDivisionUcenterBaseUrl)
  const headers = new Headers(init.headers)
  headers.set("apikey", config.chinaDivisionApiKey)
  headers.set("token", config.chinaDivisionApiKey)
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ChinaDivision ${path} failed: ${response.status} ${body.slice(0, 300)}`)
  }

  return response as Response & { json(): Promise<ChinaDivisionJson<T>> }
}

async function getJson<T>(
  config: PrintFulfillmentConfig,
  path: string,
  context: string
) {
  const response = await chinaDivisionFetch<T>(config, path)
  const json = await response.json()
  return assertChinaDivisionSuccess<T>(json, context)
}

async function postJson<T>(
  config: PrintFulfillmentConfig,
  path: string,
  body: unknown,
  context: string
) {
  const response = await chinaDivisionFetch<T>(config, path, {
    method: "POST",
    body: JSON.stringify(body),
  })
  const json = await response.json()
  return assertChinaDivisionSuccess<T>(json, context)
}

function requireReceivingConfig(config: PrintFulfillmentConfig) {
  const missing = [
    !config.chinaDivisionApiKey ? "PRINT_CHINADIVISION_API_KEY" : "",
    !config.chinaDivisionCustomerId ? "PRINT_CHINADIVISION_CUSTOMER_ID" : "",
    !config.chinaDivisionWarehouseId ? "PRINT_CHINADIVISION_WAREHOUSE_ID" : "",
  ].filter(Boolean)

  if (missing.length) {
    return `ChinaDivision receiving is enabled, but ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} missing.`
  }

  return null
}

async function resolveSkuInfo(config: PrintFulfillmentConfig, sku: string) {
  const params = new URLSearchParams({
    customer_id: config.chinaDivisionCustomerId || "",
    sku,
    warehouse_id: config.chinaDivisionWarehouseId || "",
  })

  return getJson<ChinaDivisionSkuInfo>(
    config,
    `/api/oms/product/sku/getSkuInfo?${params.toString()}`,
    `ChinaDivision SKU lookup for ${sku}`
  )
}

function extractReserveId(content: unknown) {
  if (!content || typeof content !== "object") return undefined
  const record = content as Record<string, unknown>
  return String(
    record.reserve_id ||
    record.id ||
    (record.reserve_info as Record<string, unknown> | undefined)?.reserve_id ||
    (record.info as Record<string, unknown> | undefined)?.reserve_id ||
    ""
  ) || undefined
}

async function downloadShippingSlip(config: PrintFulfillmentConfig, reserveId: string) {
  const params = new URLSearchParams({ reserve_id: reserveId })
  const response = await chinaDivisionFetch<unknown>(
    config,
    `/api/ucenter/reservation/exportReserveShippingMark?${params.toString()}`
  )

  const contentType = response.headers.get("content-type") || "application/pdf"
  if (!contentType.includes("application/json")) {
    return {
      content: Buffer.from(await response.arrayBuffer()),
      mimeType: contentType,
    }
  }

  const json = await response.json()
  const content = assertChinaDivisionSuccess<unknown>(json, "ChinaDivision shipping slip export")
  if (typeof content === "string") {
    if (content.startsWith("http")) {
      const fileResponse = await fetch(content)
      return {
        content: Buffer.from(await fileResponse.arrayBuffer()),
        mimeType: fileResponse.headers.get("content-type") || "application/pdf",
      }
    }

    return {
      content: Buffer.from(content, "base64"),
      mimeType: "application/pdf",
    }
  }

  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>
    const url = String(record.url || record.file_url || record.download_url || "")
    if (url) {
      const fileResponse = await fetch(url)
      return {
        content: Buffer.from(await fileResponse.arrayBuffer()),
        mimeType: fileResponse.headers.get("content-type") || "application/pdf",
      }
    }
  }

  throw new Error("ChinaDivision shipping slip export did not return a downloadable file")
}

export async function createChinaDivisionReceivingHandoff({
  order,
  config,
  drive,
  orderFolderId,
}: CreateReceivingParams): Promise<PrintFulfillmentResult["chinaDivision"]> {
  if (!config.chinaDivisionEnabled) {
    return {
      status: "pending",
      message: "ChinaDivision receiving-order automation is disabled. Set PRINT_CHINADIVISION_ENABLED=true after confirming the warehouse settings.",
    }
  }

  const missingConfigMessage = requireReceivingConfig(config)
  if (missingConfigMessage) {
    return {
      status: "pending",
      message: missingConfigMessage,
    }
  }

  if (config.dryRun) {
    return {
      status: "skipped",
      message: `Dry run: would create ChinaDivision receiving order for ${order.name} and upload ${SHIPPING_SLIP_NAME}.`,
    }
  }

  const skuList = await Promise.all(
    order.lineItems.map(async (item) => {
      const skuInfo = await resolveSkuInfo(config, item.sku)
      return {
        ...skuInfo,
        sku: skuInfo.sku || item.sku,
        qty: item.quantity,
        qty_per_box: item.quantity,
      }
    })
  )

  const receiving = await postJson<unknown>(
    config,
    "/api/ucenter/reservation/bulidReserve",
    {
      warehouse_id: Number(config.chinaDivisionWarehouseId),
      reserve_id: "",
      sku_list: skuList,
    },
    `ChinaDivision receiving order creation for ${order.name}`
  )
  const reserveId = extractReserveId(receiving)
  if (!reserveId) {
    throw new Error("ChinaDivision did not return a receiving order ID")
  }

  await postJson<unknown>(
    config,
    "/api/ucenter/reservation/updateReserveStep",
    {
      reserve_id: reserveId,
      step: 2,
    },
    `ChinaDivision receiving order ${reserveId} step update`
  )

  await postJson<unknown>(
    config,
    "/api/ucenter/reservation/packing",
    {
      reserve_id: reserveId,
      remark: `Shopify print order ${order.name}`,
      packing_type: config.chinaDivisionPackingType,
      packing_configs: [
        {
          items: skuList.map((item) => ({
            ...item,
            qty: item.qty_per_box || item.qty || 1,
          })),
          qty: 1,
        },
      ],
    },
    `ChinaDivision receiving order ${reserveId} packing`
  )

  await postJson<unknown>(
    config,
    "/api/ucenter/reservation/generateReservePackage",
    {
      reserve_id: reserveId,
    },
    `ChinaDivision receiving order ${reserveId} package generation`
  )

  const slip = await downloadShippingSlip(config, reserveId)
  let shippingSlipFileId: string | undefined
  let shippingSlipUrl: string | undefined

  if (drive && orderFolderId) {
    const uploaded = await uploadDriveFile(
      drive,
      orderFolderId,
      SHIPPING_SLIP_NAME,
      slip.mimeType,
      slip.content,
      config.dryRun
    )
    shippingSlipFileId = uploaded.id || undefined
    shippingSlipUrl = uploaded.webViewLink || undefined
  }

  return {
    status: "submitted",
    message: `Created ChinaDivision receiving order ${reserveId} and uploaded ${SHIPPING_SLIP_NAME}.`,
    receivingOrderId: reserveId,
    shippingSlipFileId,
    shippingSlipUrl,
  }
}
