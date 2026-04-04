/**
 * Post a message to Slack via Incoming Webhook.
 * @see https://api.slack.com/messaging/webhooks
 */

export type SlackWebhookPayload =
  | { text: string }
  | { blocks: unknown[]; text?: string }

export async function postSlackWebhook(
  payload: SlackWebhookPayload,
  webhookUrl?: string
): Promise<void> {
  const url = webhookUrl ?? process.env.SLACK_WEBHOOK_URL
  if (!url) {
    throw new Error('SLACK_WEBHOOK_URL is not set')
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Slack webhook failed: ${res.status} ${res.statusText} ${body.slice(0, 500)}`)
  }

  const text = await res.text()
  const trimmed = text.trim()
  if (trimmed === 'ok') return
  if (trimmed === 'invalid_payload' || trimmed === 'no_service' || trimmed === 'channel_not_found') {
    throw new Error(`Slack webhook rejected: ${trimmed}`)
  }
  try {
    if (!trimmed) return
    const j = JSON.parse(trimmed) as { ok?: boolean; error?: string }
    if (j.ok === false) {
      throw new Error(j.error || 'Slack returned ok=false')
    }
  } catch (e) {
    if (e instanceof SyntaxError) return
    throw e
  }
}
