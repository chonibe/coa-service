import type { PrintFulfillmentConfig } from "./config"
import type { PrintFulfillmentOrder, PrintFulfillmentResult } from "./types"
import { buildPrintFulfillmentMessage } from "./message-format"

type TelegramNotificationResult = PrintFulfillmentResult["telegram"]

export async function notifyHeidiOnTelegram(params: {
  order: PrintFulfillmentOrder
  config: PrintFulfillmentConfig
  result: Pick<PrintFulfillmentResult, "drivePackage" | "copiedAssets" | "missingAssets">
}): Promise<TelegramNotificationResult> {
  if (!params.config.telegramEnabled) {
    return {
      status: "skipped",
      message: "Telegram notification is disabled. Set PRINT_TELEGRAM_ENABLED=true to send print-order messages.",
    }
  }

  const body = buildPrintFulfillmentMessage(params.order, params.result)
  if (!params.config.telegramChatId) {
    return {
      status: "failed",
      message: "PRINT_TELEGRAM_CHAT_ID is required to send Telegram print-order messages.",
      body,
    }
  }

  if (params.config.telegramDryRun) {
    return {
      status: "skipped",
      message: "Telegram dry run enabled; message was not sent.",
      chatId: params.config.telegramChatId,
      body,
    }
  }

  if (!params.config.telegramBotToken) {
    return {
      status: "failed",
      message: "TELEGRAM_BOT_TOKEN is required to send Telegram print-order messages.",
      chatId: params.config.telegramChatId,
      body,
    }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${params.config.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: params.config.telegramChatId,
          text: body,
          disable_web_page_preview: false,
        }),
      }
    )

    const responseBody = await response.json().catch(async () => ({ raw: await response.text() }))
    if (!response.ok || responseBody?.ok === false) {
      return {
        status: "failed",
        message: `Telegram send failed with ${response.status}.`,
        chatId: params.config.telegramChatId,
        body,
        providerResponse: responseBody,
      }
    }

    return {
      status: "sent",
      message: "Telegram notification sent.",
      chatId: params.config.telegramChatId,
      body,
      providerMessageId: responseBody?.result?.message_id ? String(responseBody.result.message_id) : undefined,
      providerResponse: responseBody,
    }
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Telegram send failed.",
      chatId: params.config.telegramChatId,
      body,
    }
  }
}
