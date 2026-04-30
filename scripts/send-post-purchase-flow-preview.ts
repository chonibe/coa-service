import 'dotenv/config'

import { sendEmail } from '@/lib/email/client'
import { getDefaultTemplate, interpolateTemplate, SAMPLE_DATA } from '@/lib/email/template-service'

const FLOW_TEMPLATE_KEYS = [
  'order_confirmation',
  'post_purchase_preparing_day2',
  'post_purchase_artist_story_day5',
  'post_purchase_almost_ready',
  'shipping_shipped',
  'post_purchase_post_delivery_activation',
] as const

function getRecipientFromArgs(): string {
  const emailArg = process.argv.find((arg) => arg.startsWith('--email='))
  if (emailArg) return emailArg.replace('--email=', '').trim()
  return 'chonibe@gmail.com'
}

async function main() {
  const recipient = getRecipientFromArgs()
  if (!recipient.includes('@')) {
    throw new Error(`Invalid recipient email: ${recipient}`)
  }

  for (const key of FLOW_TEMPLATE_KEYS) {
    const template = getDefaultTemplate(key)
    if (!template) {
      console.warn(`[preview] Missing default template for key: ${key}`)
      continue
    }

    const variables = SAMPLE_DATA[key] || {}
    const subject = `[FLOW PREVIEW] ${interpolateTemplate(template.subject, variables)}`
    const html = interpolateTemplate(template.html, variables)

    const result = await sendEmail({
      to: recipient,
      subject,
      html,
    })

    if (!result.success) {
      throw new Error(`Failed sending "${key}": ${result.error || 'Unknown error'}`)
    }

    console.log(`[preview] sent ${key} -> ${recipient} (${result.messageId || 'no-message-id'})`)
  }
}

main().catch((error) => {
  console.error('[preview] Failed to send flow preview emails:', error)
  process.exit(1)
})

