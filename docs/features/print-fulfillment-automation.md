# Print Fulfillment Automation

This workflow prepares the Drive handoff folder for Heidi when a Shopify order is ready for print fulfillment.

## What it does

1. Reads a Shopify order and aggregates line items by SKU.
2. Creates or reuses `PRINT_DRIVE_PARENT_FOLDER_ID/<order-name>`.
3. Creates or reuses `Labels` and `Artworks` subfolders.
4. Creates or updates a manifest named after the order with printable SKU and quantity only.
5. Copies matching PDF assets for each SKU into the matching subfolder.
6. Shares the order folder with `PRINT_HEIDI_EMAIL` when not in dry run.
7. Sends a Telegram and/or WhatsApp handoff message when enabled.
8. Creates a ChinaDivision receiving order when enabled, generates the shipping slip, and uploads the slip to the main order Drive folder.

## Environment

Required:

- `PRINT_DRIVE_PARENT_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

Or instead of `GOOGLE_SERVICE_ACCOUNT_JSON`:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Existing aliases are also supported:

- `GOOGLE_DRIVE_FOLDER_ID` as the Drive parent folder
- `GOOGLE_CLIENT_EMAIL` as the Google service account email
- `GOOGLE_PRIVATE_KEY` as the Google service account private key

Recommended:

- `PRINT_FULFILLMENT_ENABLED=false`
- `PRINT_FULFILLMENT_DRY_RUN=true`
- `PRINT_HEIDI_EMAIL=heidi@example.com`
- `PRINT_LABEL_ASSET_FOLDER_ID`
- `PRINT_ARTWORK_ASSET_FOLDER_ID`
- `PRINT_NON_PRINTABLE_SKUS=StreetLamp001,StreetLamp002`

Fallback asset search:

- `PRINT_ASSET_LIBRARY_FOLDER_ID`

ChinaDivision:

- `PRINT_CHINADIVISION_ENABLED=false`
- `PRINT_CHINADIVISION_API_KEY` or `CHINADIVISION_API_KEY`
- `PRINT_CHINADIVISION_CUSTOMER_ID=14051`
- `PRINT_CHINADIVISION_WAREHOUSE_ID=2`
- `PRINT_CHINADIVISION_UCENTER_BASE_URL=https://stapi.cnstorm.com`

`PRINT_CHINADIVISION_WAREHOUSE_ID=2` is Shenzhen China. Use `3` for Yiwu China. Keep `PRINT_FULFILLMENT_DRY_RUN=true` until the first receiving order is confirmed because this step creates a live ChinaDivision receiving order when both fulfillment dry run is off and `PRINT_CHINADIVISION_ENABLED=true`.

WhatsApp notification to Heidi:

- `PRINT_WHATSAPP_ENABLED=false`
- `PRINT_WHATSAPP_DRY_RUN=true`
- `PRINT_HEIDI_WHATSAPP_TO=15551234567`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_API_VERSION=v23.0`

Optional WhatsApp template mode:

- `PRINT_WHATSAPP_TEMPLATE_NAME=print_order_ready`
- `PRINT_WHATSAPP_TEMPLATE_LANGUAGE=en_US`

If `PRINT_WHATSAPP_TEMPLATE_NAME` is not set, the automation sends a normal text message. Meta Cloud API only allows free-form text inside an open customer service window; for reliable proactive messages to Heidi, create and approve a utility template in WhatsApp Manager, then set `PRINT_WHATSAPP_TEMPLATE_NAME`.

Telegram notification:

- `PRINT_TELEGRAM_ENABLED=false`
- `PRINT_TELEGRAM_DRY_RUN=true`
- `TELEGRAM_BOT_TOKEN`
- `PRINT_TELEGRAM_CHAT_ID`

For Telegram, create a bot with BotFather, add it to a private group with Heidi, send any message in the group, then call `getUpdates` or use the admin test response to confirm the chat ID. Telegram does not require templates for proactive operational messages.

## Manual Test

Use the admin endpoint:

```bash
curl -X POST "https://app.thestreetcollector.com/api/admin/print-fulfillment/orders/<shopify-order-id>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

Set `"dryRun":false` only after the Drive parent, asset folders, and Heidi share email are confirmed.

To test WhatsApp without sending:

```bash
curl -X POST "https://app.thestreetcollector.com/api/admin/print-fulfillment/orders/<shopify-order-id>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":false,"whatsappEnabled":true,"whatsappDryRun":true,"heidiWhatsAppTo":"15551234567"}'
```

To test Telegram without sending:

```bash
curl -X POST "https://app.thestreetcollector.com/api/admin/print-fulfillment/orders/<shopify-order-id>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":false,"telegramEnabled":true,"telegramDryRun":true,"telegramChatId":"<chat-id>"}'
```

To test ChinaDivision without submitting a receiving order:

```bash
curl -X POST "https://app.thestreetcollector.com/api/admin/print-fulfillment/orders/<shopify-order-id>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"chinaDivisionEnabled":true,"chinaDivisionCustomerId":"14051","chinaDivisionWarehouseId":"2"}'
```

To submit the ChinaDivision receiving order and upload the slip, set `"dryRun":false` only after confirming the warehouse and SKU quantities:

```bash
curl -X POST "https://app.thestreetcollector.com/api/admin/print-fulfillment/orders/<shopify-order-id>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":false,"chinaDivisionEnabled":true,"chinaDivisionCustomerId":"14051","chinaDivisionWarehouseId":"2"}'
```

## Shopify Webhook

The existing Shopify order webhook calls this automation for paid orders only when:

```txt
PRINT_FULFILLMENT_ENABLED=true
```

Keep `PRINT_FULFILLMENT_DRY_RUN=true` for the first live webhook test.
