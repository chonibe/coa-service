import type { PrintFulfillmentConfig } from "./config"
import type { PrintFulfillmentOrder, PrintFulfillmentResult } from "./types"
import { buildPrintFulfillmentMessage, formatMissingAssets } from "./message-format"

type WhatsAppNotificationResult = PrintFulfillmentResult["whatsapp"]

function buildTextPayload(to: string, body: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: true,
      body,
    },
  }
}

function buildTemplatePayload(params: {
  to: string
  templateName: string
  languageCode: string
  order: PrintFulfillmentOrder
  result: Pick<PrintFulfillmentResult, "drivePackage" | "copiedAssets" | "missingAssets">
}) {
  return {
    messaging_product: "whatsapp",
    to: params.to,
    type: "template",
    template: {
      name: params.templateName,
      language: {
        code: params.languageCode,
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.order.name },
            {
              type: "text",
              text: params.order.lineItems.map((item) => `${item.sku} x ${item.quantity}`).join(", ") || "none",
            },
            { type: "text", text: params.result.drivePackage.orderFolderUrl },
            { type: "text", text: formatMissingAssets(params.result.missingAssets) },
          ],
        },
      ],
    },
  }
}

export async function notifyHeidiOnWhatsApp(params: {
  order: PrintFulfillmentOrder
  config: PrintFulfillmentConfig
  result: Pick<PrintFulfillmentResult, "drivePackage" | "copiedAssets" | "missingAssets">
}): Promise<WhatsAppNotificationResult> {
  if (!params.config.whatsappEnabled) {
    return {
      status: "skipped",
      message: "WhatsApp notification is disabled. Set PRINT_WHATSAPP_ENABLED=true to send Heidi print-order messages.",
    }
  }

  if (!params.config.heidiWhatsAppTo) {
    return {
      status: "failed",
      message: "PRINT_HEIDI_WHATSAPP_TO is required to notify Heidi on WhatsApp.",
    }
  }

  const body = buildPrintFulfillmentMessage(params.order, params.result)
  if (params.config.whatsappDryRun) {
    return {
      status: "skipped",
      message: "WhatsApp dry run enabled; message was not sent.",
      to: params.config.heidiWhatsAppTo,
      body,
    }
  }

  if (!params.config.whatsappAccessToken || !params.config.whatsappPhoneNumberId) {
    return {
      status: "failed",
      message: "WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required to send WhatsApp messages.",
      to: params.config.heidiWhatsAppTo,
      body,
    }
  }

  const payload = params.config.whatsappTemplateName
    ? buildTemplatePayload({
        to: params.config.heidiWhatsAppTo,
        templateName: params.config.whatsappTemplateName,
        languageCode: params.config.whatsappTemplateLanguage,
        order: params.order,
        result: params.result,
      })
    : buildTextPayload(params.config.heidiWhatsAppTo, body)

  try {
    const response = await fetch(
      `https://graph.facebook.com/${params.config.whatsappApiVersion}/${params.config.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.config.whatsappAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )

    const responseBody = await response.json().catch(async () => ({ raw: await response.text() }))
    if (!response.ok) {
      return {
        status: "failed",
        message: `WhatsApp send failed with ${response.status}.`,
        to: params.config.heidiWhatsAppTo,
        body,
        providerResponse: responseBody,
      }
    }

    const messageId = responseBody?.messages?.[0]?.id
    return {
      status: "sent",
      message: "WhatsApp notification sent to Heidi.",
      to: params.config.heidiWhatsAppTo,
      body,
      providerMessageId: messageId,
      providerResponse: responseBody,
    }
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "WhatsApp send failed.",
      to: params.config.heidiWhatsAppTo,
      body,
    }
  }
}
