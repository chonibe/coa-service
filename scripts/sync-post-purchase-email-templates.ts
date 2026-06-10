import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import { getDefaultTemplate } from '@/lib/email/template-service'

const TEMPLATE_KEYS = [
  'post_purchase_preparing_day2',
  'post_purchase_artist_story_day5',
  'shipping_shipped',
  'post_purchase_feedback_followup',
] as const

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const key of TEMPLATE_KEYS) {
    const template = getDefaultTemplate(key)
    if (!template) {
      console.warn(`[sync] missing default template for ${key}`)
      continue
    }

    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('template_key', key)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: template.subject,
          html_body: template.html,
          enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('template_key', key)
      if (error) throw error
      console.log(`[sync] updated ${key}`)
      continue
    }

    const { error } = await supabase.from('email_templates').insert({
      template_key: key,
      name: key,
      description: `Auto-managed template for ${key}`,
      category: 'order',
      subject: template.subject,
      html_body: template.html,
      variables: [],
      enabled: true,
    })
    if (error) throw error
    console.log(`[sync] inserted ${key}`)
  }
}

main().catch((error) => {
  console.error('[sync] failed', error)
  process.exit(1)
})

