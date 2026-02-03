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
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #8217ff;">📦 Your Order Has Shipped!</h1>
  <p>Your order {{orderName}} is on its way to {{recipientName}}.</p>
  <p>Tracking: {{trackingNumber}}</p>
  <p><a href="{{trackingUrl}}" style="background: #8217ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Your Order</a></p>
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
