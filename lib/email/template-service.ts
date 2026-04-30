/**
 * Email Template Service
 * 
 * Loads email templates from the database with fallback to code defaults.
 * Supports variable interpolation using {{variableName}} syntax.
 */

import { createClient } from '@/lib/supabase/server'

export interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  category: string
  subject: string
  html_body: string
  variables: TemplateVariable[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  name: string
  description: string
  example: string
}

export interface RenderedTemplate {
  subject: string
  html: string
  fromTemplate: boolean
}

// Default templates (fallback when DB template not found or disabled)
const DEFAULT_TEMPLATES: Record<string, { subject: string; html: string }> = {
  order_confirmation: {
    subject: 'Order Confirmed - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #8217ff;">Thank You for Your Order!</h1>
  <p>Hi {{customerName}}, your order {{orderName}} has been confirmed.</p>
  <p><a href="{{trackingUrl}}" style="background: #8217ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Your Order</a></p>
</body>
</html>`,
  },
  shipping_shipped: {
    subject: 'Your order has shipped - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f4f4f2; margin:0; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e7e5df; border-radius:12px; padding:28px;">
    <p style="margin:0 0 8px; letter-spacing:0.08em; text-transform:uppercase; color:#6b6b6b; font-size:11px;">Shipping Update</p>
    <h1 style="margin:0 0 14px; color:#111111; font-size:26px;">Your order has shipped</h1>
    <p style="color:#2a2a2a;">Order <strong>{{orderName}}</strong> is now on its way to {{recipientName}}.</p>
    <div style="background:#f7f7f5; border:1px solid #eceae5; border-radius:10px; padding:14px; margin:14px 0;">
      <p style="margin:0; color:#1f1f1f;"><strong>Tracking number:</strong> {{trackingNumber}}</p>
    </div>
    <a href="{{trackingUrl}}" style="background:#111111; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block;">Track your order</a>
  </div>
</body>
</html>`,
  },
  shipping_in_transit: {
    subject: 'Your package is in transit - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #8217ff;">🚚 Your Package Is In Transit</h1>
  <p>Your package for order {{orderName}} is moving through the delivery network.</p>
  <p>Tracking: {{trackingNumber}}</p>
  <p><a href="{{trackingUrl}}" style="background: #8217ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Your Order</a></p>
</body>
</html>`,
  },
  shipping_out_for_delivery: {
    subject: 'Out for delivery today - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #f59e0b;">🏃 Out for Delivery Today!</h1>
  <p>Exciting news! Your order {{orderName}} is out for delivery.</p>
  <p>Tracking: {{trackingNumber}}</p>
  <p><a href="{{trackingUrl}}" style="background: #8217ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Your Order</a></p>
</body>
</html>`,
  },
  shipping_delivered: {
    subject: 'Your package has been delivered - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #22c55e;">✅ Your Package Has Been Delivered!</h1>
  <p>Your order {{orderName}} has arrived. We hope you love it!</p>
  <p><a href="{{trackingUrl}}" style="background: #8217ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order Details</a></p>
</body>
</html>`,
  },
  shipping_alert: {
    subject: 'Delivery alert - action may be required - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #ef4444;">⚠️ Delivery Alert</h1>
  <p>There's an update about your order {{orderName}} that may require your attention.</p>
  <p>Tracking: {{trackingNumber}}</p>
  <p><a href="{{trackingUrl}}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a></p>
</body>
</html>`,
  },
  post_purchase_preparing_day2: {
    subject: 'Your order is in preparation - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f4f4f2; margin:0; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e7e5df; border-radius:12px; padding:28px;">
    <p style="margin:0 0 8px; letter-spacing:0.08em; text-transform:uppercase; color:#6b6b6b; font-size:11px;">Order Update</p>
    <h1 style="margin:0 0 14px; color:#111111; font-size:26px;">Your artwork is in preparation</h1>
    <p style="color:#2a2a2a;">Hi {{customerName}}, we have started preparing <strong>{{artworkTitle}}</strong> from order <strong>{{orderName}}</strong>.</p>
    <p style="color:#2a2a2a;">Current stage: <strong>{{warehouseStage}}</strong>. Next update window: {{nextUpdateWindow}}.</p>
    <div style="background:#f7f7f5; border:1px solid #eceae5; border-radius:10px; padding:14px; margin:14px 0;">
      <p style="margin:0; color:#1f1f1f;"><strong>Artwork:</strong> {{artworkTitle}}</p>
      <p style="margin:6px 0 0; color:#1f1f1f;"><strong>Artist:</strong> {{artistName}}</p>
    </div>
    <img src="{{lampArtImageUrl}}" alt="Lamp with {{artworkTitle}}" style="max-width:100%; border-radius:10px; border:1px solid #eceae5; margin:8px 0 12px;" />
    <p style="color:#7a7a7a; font-size:12px; margin:0 0 14px;">Preview of your lamp + artwork pairing</p>
    <a href="{{trackingUrl}}" style="background:#111111; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block;">View Live Order Status</a>
  </div>
</body>
</html>`,
  },
  post_purchase_artist_story_day5: {
    subject: 'The story of the artist behind {{artworkTitle}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f4f4f2; margin:0; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e7e5df; border-radius:12px; padding:28px;">
    <p style="margin:0 0 8px; letter-spacing:0.08em; text-transform:uppercase; color:#6b6b6b; font-size:11px;">Artist Story</p>
    <h1 style="margin:0 0 14px; color:#111111; font-size:26px;">The story of the artist behind your artwork</h1>
    <p style="color:#2a2a2a;">Hi {{customerName}}, while your order <strong>{{orderName}}</strong> moves through the studio, here is the story of the artist behind <strong>{{artworkTitle}}</strong>.</p>
    <img src="{{lampArtImageUrl}}" alt="Lamp with {{artworkTitle}}" style="max-width:100%; border-radius:10px; border:1px solid #eceae5; margin:8px 0 10px;" />
    <p style="color:#1f1f1f; margin:0 0 8px;"><strong>{{artistName}}</strong></p>
    <p style="color:#2a2a2a; margin:0 0 12px;">{{artistStorySnippet}}</p>
    <p style="color:#2a2a2a; margin:0 0 12px;">{{artistPressSnippet}}</p>
    <p style="color:#2a2a2a; margin:0 0 16px;">{{artworkNarrative}}</p>
    <a href="{{collectionUrl}}" style="background:#111111; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block; margin-right:8px;">View your collection</a>
    <a href="{{instagramUrl}}" style="background:#f2f2f0; color:#111111; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block;">Follow {{artistName}} on Instagram</a>
  </div>
</body>
</html>`,
  },
  post_purchase_almost_ready: {
    subject: 'Almost ready to ship - {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f4f4f2; margin:0; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e7e5df; border-radius:12px; padding:28px;">
    <h1 style="margin:0 0 14px; color:#111111; font-size:26px;">Almost ready to ship</h1>
    <p style="color:#2a2a2a;">Hi {{customerName}}, order <strong>{{orderName}}</strong> is now in <strong>{{warehouseStage}}</strong>.</p>
    <p style="color:#2a2a2a;">Expected shipping window: <strong>{{shippingWindow}}</strong>.</p>
    <p style="color:#2a2a2a;">As soon as it leaves the warehouse, we will send full tracking details.</p>
    <img src="{{lampArtImageUrl}}" alt="Lamp with {{artworkTitle}}" style="max-width:100%; border-radius:10px; border:1px solid #eceae5; margin:8px 0 12px;" />
    <p style="color:#7a7a7a; font-size:12px; margin:0 0 14px;">Your selected artwork in lamp format</p>
    <a href="{{trackingUrl}}" style="background:#111111; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block;">Track Preparation Progress</a>
  </div>
</body>
</html>`,
  },
  post_purchase_post_delivery_activation: {
    subject: 'Delivered: {{orderName}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f4f4f2; margin:0; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e7e5df; border-radius:12px; padding:28px;">
    <h1 style="margin:0 0 14px; color:#111111; font-size:26px;">Your order has arrived</h1>
    <p style="color:#2a2a2a;">Hi {{customerName}}, your order <strong>{{orderName}}</strong> was delivered.</p>
    <ol style="color:#2a2a2a;">
      <li>Set up your lamp in your space</li>
      <li>View and manage your artworks in the dashboard</li>
      <li>Swap artworks and explore more artist drops</li>
    </ol>
    <p style="color:#2a2a2a;">Please check everything is in good condition and let us know if you need anything.</p>
    <img src="{{lampArtImageUrl}}" alt="Delivered artwork preview" style="max-width:100%; border-radius:10px; border:1px solid #eceae5; margin:8px 0 12px;" />
    <p style="color:#7a7a7a; font-size:12px; margin:0 0 14px;">Delivered artwork preview</p>
    <div style="margin:14px 0;">
      <video controls autoplay muted loop playsinline poster="{{lampVideoPosterUrl}}" style="width:100%; max-width:100%; border-radius:10px; border:1px solid #eceae5; background:#000;">
        <source src="{{lampVideoUrl}}" type="video/mp4" />
      </video>
      <p style="margin:8px 0 0; color:#2a2a2a; font-size:13px;">
        If the video doesn't play in your email client, open it here:
        <a href="{{lampVideoUrl}}" style="color:#111111;">Watch the Street Lamp video</a>
      </p>
    </div>
    <a href="{{dashboardUrl}}" style="background:#111111; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block;">Open collector dashboard</a>
  </div>
</body>
</html>`,
  },
  post_purchase_feedback_followup: {
    subject: 'How is your new setup?',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f4f4f2; margin:0; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e7e5df; border-radius:12px; padding:28px;">
    <p style="margin:0 0 8px; letter-spacing:0.08em; text-transform:uppercase; color:#6b6b6b; font-size:11px;">Feedback</p>
    <h1 style="margin:0 0 14px; color:#111111; font-size:26px;">How is your lamp and artwork setup?</h1>
    <p style="color:#2a2a2a;">Hi {{customerName}}, now that you've had time with <strong>{{artworkTitle}}</strong>, we'd love to hear what you think.</p>
    <img src="{{artworkImageUrl}}" alt="{{artworkTitle}} artwork image" style="max-width:100%; border-radius:10px; border:1px solid #eceae5; margin:8px 0 12px;" />
    <p style="color:#7a7a7a; font-size:12px; margin:0 0 14px;">Artwork image</p>
    <p style="color:#2a2a2a;">Reply to this email with your feedback, or share a photo of your setup.</p>
    <img src="{{lampArtImageUrl}}" alt="Lamp and artwork in space" style="max-width:100%; border-radius:10px; border:1px solid #eceae5; margin:8px 0 12px;" />
    <p style="color:#7a7a7a; font-size:12px; margin:0 0 14px;">A look at the lamp and artwork in your space</p>
    <a href="{{dashboardUrl}}" style="background:#111111; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block; margin-top:14px;">Open collector dashboard</a>
  </div>
</body>
</html>`,
  },
  payout_processed: {
    subject: 'Payout Processed - {{reference}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #22c55e;">💰 Payout Processed!</h1>
  <p>Hi {{vendorName}}, your payout of {{amount}} has been processed.</p>
  <p>Reference: {{reference}}</p>
</body>
</html>`,
  },
  payout_failed: {
    subject: 'Payout Failed - {{reference}}',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #ef4444;">❌ Payout Failed</h1>
  <p>Hi {{vendorName}}, your payout of {{amount}} could not be processed.</p>
  <p>Reason: {{reason}}</p>
</body>
</html>`,
  },
  collector_welcome: {
    subject: 'Welcome to Street Collector!',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #8217ff;">🎨 Welcome to Street Collector!</h1>
  <p>Hi {{customerName}}, welcome to the Street Collector community!</p>
  <p><a href="{{dashboardUrl}}" style="background: #8217ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Collection</a></p>
</body>
</html>`,
  },
}

// Sample data for previewing templates
export const SAMPLE_DATA: Record<string, Record<string, string>> = {
  order_confirmation: {
    orderName: '#1234',
    customerName: 'John Smith',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
  },
  shipping_shipped: {
    orderName: '#1234',
    recipientName: 'John Smith',
    trackingNumber: '1Z999AA10123456784',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
  },
  shipping_in_transit: {
    orderName: '#1234',
    recipientName: 'John Smith',
    trackingNumber: '1Z999AA10123456784',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
  },
  shipping_out_for_delivery: {
    orderName: '#1234',
    recipientName: 'John Smith',
    trackingNumber: '1Z999AA10123456784',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
  },
  shipping_delivered: {
    orderName: '#1234',
    trackingNumber: '1Z999AA10123456784',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
  },
  shipping_alert: {
    orderName: '#1234',
    trackingNumber: '1Z999AA10123456784',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
  },
  post_purchase_preparing_day2: {
    orderName: '#1234',
    customerName: 'John',
    warehouseStage: 'Quality Check',
    nextUpdateWindow: '24-48 hours',
    artworkTitle: 'Midnight Echoes',
    artistName: 'A. Smith',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
    lampArtImageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Instagram_post_-_11.png?v=1766164695',
  },
  post_purchase_artist_story_day5: {
    orderName: '#1234',
    customerName: 'John',
    artworkTitle: 'Midnight Echoes',
    artistName: 'A. Smith',
    artistStorySnippet: 'A contemporary street artist exploring identity through layered textures.',
    artistPressSnippet: 'Featured in editorial coverage and collector highlights for bold visual storytelling.',
    artworkNarrative: 'This piece reflects movement, resilience, and late-night city energy.',
    artworkImageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
    lampArtImageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Instagram_post_-_11.png?v=1766164695',
    collectionUrl: 'https://app.thestreetcollector.com/collector/dashboard',
    instagramUrl: 'https://instagram.com/streetcollector',
  },
  post_purchase_almost_ready: {
    orderName: '#1234',
    customerName: 'John',
    warehouseStage: 'Final Packaging',
    shippingWindow: 'May 2 - May 4',
    trackingUrl: 'https://app.thestreetcollector.com/track/sample123',
    artworkTitle: 'Midnight Echoes',
    lampArtImageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Instagram_post_-_11.png?v=1766164695',
  },
  post_purchase_post_delivery_activation: {
    orderName: '#1234',
    customerName: 'John',
    dashboardUrl: 'https://app.thestreetcollector.com/collector/dashboard',
    lampArtImageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Instagram_post_-_11.png?v=1766164695',
    lampVideoUrl: 'https://cdn.shopify.com/videos/c/o/v/2b189c367ed04f3f86dce86d120a40d6.mp4',
    lampVideoPosterUrl: 'https://cdn.shopify.com/s/files/1/0858/7828/6798/files/street-collector-hero-poster.jpg',
  },
  post_purchase_feedback_followup: {
    customerName: 'John',
    artworkTitle: 'Midnight Echoes',
    artworkImageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
    lampArtImageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Instagram_post_-_11.png?v=1766164695',
    lampVideoUrl: 'https://cdn.shopify.com/videos/c/o/v/2b189c367ed04f3f86dce86d120a40d6.mp4',
    lampVideoPosterUrl: 'https://cdn.shopify.com/s/files/1/0858/7828/6798/files/street-collector-hero-poster.jpg',
    dashboardUrl: 'https://app.thestreetcollector.com/collector/dashboard',
  },
  payout_processed: {
    vendorName: 'Acme Art Co',
    amount: '$1,234.56',
    reference: 'PAY-2024-001234',
  },
  payout_failed: {
    vendorName: 'Acme Art Co',
    amount: '$1,234.56',
    reference: 'PAY-2024-001234',
    reason: 'Invalid bank account details',
  },
  collector_welcome: {
    customerName: 'John',
    dashboardUrl: 'https://app.thestreetcollector.com/collector/dashboard',
  },
}

/**
 * Replace {{variable}} placeholders with actual values
 */
export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match
  })
}

/**
 * Get a template from the database by key
 */
export async function getTemplate(templateKey: string): Promise<EmailTemplate | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data as EmailTemplate
  } catch (error) {
    console.error(`[Template Service] Error fetching template ${templateKey}:`, error)
    return null
  }
}

/**
 * Get all templates from the database
 */
export async function getAllTemplates(): Promise<EmailTemplate[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) {
      console.error('[Template Service] Error fetching templates:', error)
      return []
    }
    
    return (data || []) as EmailTemplate[]
  } catch (error) {
    console.error('[Template Service] Error fetching templates:', error)
    return []
  }
}

/**
 * Update a template in the database
 */
export async function updateTemplate(
  templateKey: string,
  updates: Partial<Pick<EmailTemplate, 'subject' | 'html_body' | 'enabled'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('email_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('template_key', templateKey)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Render a template with variables
 * Uses database template if available and enabled, otherwise falls back to code default
 */
export async function renderTemplate(
  templateKey: string,
  variables: Record<string, string>
): Promise<RenderedTemplate> {
  // Try to get template from database
  const dbTemplate = await getTemplate(templateKey)
  
  if (dbTemplate && dbTemplate.enabled) {
    return {
      subject: interpolateTemplate(dbTemplate.subject, variables),
      html: interpolateTemplate(dbTemplate.html_body, variables),
      fromTemplate: true,
    }
  }
  
  // Fall back to code default
  const defaultTemplate = DEFAULT_TEMPLATES[templateKey]
  
  if (defaultTemplate) {
    return {
      subject: interpolateTemplate(defaultTemplate.subject, variables),
      html: interpolateTemplate(defaultTemplate.html, variables),
      fromTemplate: false,
    }
  }
  
  // No template found - return empty (caller should handle this)
  console.warn(`[Template Service] No template found for key: ${templateKey}`)
  return {
    subject: '',
    html: '',
    fromTemplate: false,
  }
}

/**
 * Preview a template with sample data
 */
export async function previewTemplate(templateKey: string): Promise<RenderedTemplate> {
  const sampleData = SAMPLE_DATA[templateKey] || {}
  return renderTemplate(templateKey, sampleData)
}

/**
 * Get the default template for a key (code-based)
 */
export function getDefaultTemplate(templateKey: string): { subject: string; html: string } | null {
  return DEFAULT_TEMPLATES[templateKey] || null
}

/**
 * Reset a template to its default values
 */
export async function resetTemplateToDefault(
  templateKey: string
): Promise<{ success: boolean; error?: string }> {
  const defaultTemplate = getDefaultTemplate(templateKey)
  
  if (!defaultTemplate) {
    return { success: false, error: 'No default template found for this key' }
  }
  
  return updateTemplate(templateKey, {
    subject: defaultTemplate.subject,
    html_body: defaultTemplate.html,
  })
}

// Map shipping stages to template keys
export const SHIPPING_STAGE_TO_TEMPLATE: Record<number, string> = {
  3: 'shipping_shipped',      // Warehouse status: Shipped
  101: 'shipping_in_transit', // Track status: In Transit
  111: 'shipping_in_transit', // Track status: Pick Up (use same as in transit)
  112: 'shipping_out_for_delivery', // Track status: Out for Delivery
  121: 'shipping_delivered',  // Track status: Delivered
  131: 'shipping_alert',      // Track status: Alert
  132: 'shipping_alert',      // Track status: Expired (use alert template)
}
