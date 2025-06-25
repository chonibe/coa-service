import { createClient } from '@supabase/supabase-js'

// Webhook event types
export enum WebhookEventType {
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  VENDOR_STATUS_CHANGED = 'vendor.status_changed',
  CERTIFICATE_ISSUED = 'certificate.issued',
  PAYMENT_PROCESSED = 'payment.processed'
}

// Webhook payload interface
export interface WebhookPayload {
  event: WebhookEventType
  timestamp: number
  data: any
  source: string
}

// Webhook destination configuration
export interface WebhookDestination {
  id: string
  url: string
  secret: string
  events: WebhookEventType[]
  active: boolean
}

// Webhook delivery status
export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED'
}

// Webhook delivery attempt
export interface WebhookDeliveryAttempt {
  id: string
  destinationId: string
  event: WebhookEventType
  payload: WebhookPayload
  status: WebhookDeliveryStatus
  attempts: number
  lastAttemptAt: number
  responseCode?: number
  errorMessage?: string
}

export class WebhookManager {
  private supabase: ReturnType<typeof createClient>
  private static MAX_RETRIES = 3
  private static RETRY_DELAY_MS = 5000 // 5 seconds

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // Register a new webhook destination
  async registerWebhook(destination: Omit<WebhookDestination, 'id'>): Promise<WebhookDestination> {
    const { data, error } = await this.supabase
      .from('webhook_destinations')
      .insert({
        ...destination,
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to register webhook: ${error.message}`)
    }

    return data
  }

  // Unregister a webhook destination
  async unregisterWebhook(destinationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('webhook_destinations')
      .delete()
      .eq('id', destinationId)

    if (error) {
      throw new Error(`Failed to unregister webhook: ${error.message}`)
    }
  }

  // Trigger webhook event
  async triggerWebhook(event: WebhookEventType, payload: any): Promise<void> {
    // Fetch active webhook destinations for this event type
    const { data: destinations, error: fetchError } = await this.supabase
      .from('webhook_destinations')
      .select('*')
      .contains('events', [event])
      .eq('active', true)

    if (fetchError) {
      console.error('Failed to fetch webhook destinations:', fetchError)
      return
    }

    // Prepare webhook payload
    const webhookPayload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      data: payload,
      source: 'street-collector-platform'
    }

    // Send webhooks concurrently
    await Promise.all(
      destinations.map(destination => 
        this.sendWebhook(destination, webhookPayload)
      )
    )
  }

  // Send individual webhook
  private async sendWebhook(
    destination: WebhookDestination, 
    payload: WebhookPayload
  ): Promise<void> {
    let deliveryAttempt: WebhookDeliveryAttempt = {
      id: crypto.randomUUID(),
      destinationId: destination.id,
      event: payload.event,
      payload,
      status: WebhookDeliveryStatus.PENDING,
      attempts: 0,
      lastAttemptAt: Date.now()
    }

    try {
      for (let attempt = 0; attempt < WebhookManager.MAX_RETRIES; attempt++) {
        deliveryAttempt.attempts++
        deliveryAttempt.lastAttemptAt = Date.now()

        try {
          const response = await fetch(destination.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': destination.secret,
              'X-Webhook-Event': payload.event
            },
            body: JSON.stringify(payload)
          })

          if (response.ok) {
            deliveryAttempt.status = WebhookDeliveryStatus.SUCCESS
            break
          }

          // Non-successful response
          deliveryAttempt.responseCode = response.status
          deliveryAttempt.errorMessage = await response.text()

          // Wait before retry
          await new Promise(resolve => 
            setTimeout(resolve, WebhookManager.RETRY_DELAY_MS)
          )
        } catch (error) {
          deliveryAttempt.errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown network error'
        }
      }

      // Final status determination
      if (deliveryAttempt.status !== WebhookDeliveryStatus.SUCCESS) {
        deliveryAttempt.status = WebhookDeliveryStatus.RETRY_EXHAUSTED
      }
    } catch (error) {
      deliveryAttempt.status = WebhookDeliveryStatus.FAILED
      deliveryAttempt.errorMessage = error instanceof Error 
        ? error.message 
        : 'Unexpected webhook delivery error'
    } finally {
      // Log webhook delivery attempt
      await this.logWebhookDelivery(deliveryAttempt)
    }
  }

  // Log webhook delivery attempt
  private async logWebhookDelivery(
    attempt: WebhookDeliveryAttempt
  ): Promise<void> {
    const { error } = await this.supabase
      .from('webhook_delivery_logs')
      .insert(attempt)

    if (error) {
      console.error('Failed to log webhook delivery:', error)
    }
  }

  // Retrieve webhook delivery history
  async getWebhookDeliveryHistory(
    filters?: {
      destinationId?: string
      event?: WebhookEventType
      status?: WebhookDeliveryStatus
      startDate?: Date
      endDate?: Date
    }
  ): Promise<WebhookDeliveryAttempt[]> {
    let query = this.supabase
      .from('webhook_delivery_logs')
      .select('*')

    if (filters?.destinationId) {
      query = query.eq('destinationId', filters.destinationId)
    }

    if (filters?.event) {
      query = query.eq('event', filters.event)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.startDate) {
      query = query.gte('lastAttemptAt', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('lastAttemptAt', filters.endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to retrieve webhook history: ${error.message}`)
    }

    return data
  }
}

// Singleton instance
export const webhookManager = new WebhookManager() 