#!/usr/bin/env node

/**
 * Membership MCP Server
 * 
 * Provides tools for AI agents to interact with the membership and credits system
 * through a controlled interface with business rules validation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { z } from 'zod'

// ============================================
// Configuration
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const stripeKey = process.env.STRIPE_SECRET_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null

// ============================================
// Business Rules
// ============================================

const MEMBERSHIP_TIERS = {
  collector: { monthlyCredits: 100, priceMonthly: 10 },
  curator: { monthlyCredits: 280, priceMonthly: 22 },
  founding: { monthlyCredits: 750, priceMonthly: 50 },
}

const MAX_MANUAL_CREDIT_ADJUSTMENT = 10000 // Max credits per manual adjustment
const MIN_CREDIT_BALANCE = 0 // Can't go negative

// ============================================
// Tool Schemas
// ============================================

const GetMemberStatusSchema = z.object({
  collector_identifier: z.string().email().describe('Collector email address'),
})

const GetCreditBalanceSchema = z.object({
  collector_identifier: z.string().email().describe('Collector email address'),
})

const DepositCreditsSchema = z.object({
  collector_identifier: z.string().email().describe('Collector email address'),
  amount: z.number().int().positive().max(MAX_MANUAL_CREDIT_ADJUSTMENT)
    .describe('Number of credits to deposit (max 10,000)'),
  reason: z.string().min(10).max(500).describe('Reason for deposit (min 10 chars)'),
  source: z.enum(['bonus', 'refund', 'adjustment', 'promotion'])
    .describe('Source of the credits'),
})

const RedeemCreditsSchema = z.object({
  collector_identifier: z.string().email().describe('Collector email address'),
  amount: z.number().int().positive().describe('Number of credits to redeem'),
  description: z.string().min(5).max(500).describe('Description of redemption'),
  reference_id: z.string().optional().describe('Optional reference ID (order, etc)'),
})

const GetTransactionHistorySchema = z.object({
  collector_identifier: z.string().email().describe('Collector email address'),
  limit: z.number().int().min(1).max(100).default(20).describe('Number of transactions to return'),
})

const GetSubscriptionDetailsSchema = z.object({
  collector_identifier: z.string().email().describe('Collector email address'),
})

const GetMembershipAnalyticsSchema = z.object({
  days: z.number().int().min(1).max(365).default(30).describe('Number of days to analyze'),
})

// ============================================
// Server Implementation
// ============================================

const server = new Server(
  {
    name: 'membership-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_member_status',
        description: 'Get a collector\'s membership status including tier, subscription status, and basic credit info',
        inputSchema: {
          type: 'object',
          properties: {
            collector_identifier: { type: 'string', description: 'Collector email address' },
          },
          required: ['collector_identifier'],
        },
      },
      {
        name: 'get_credit_balance',
        description: 'Get detailed credit balance and breakdown for a collector',
        inputSchema: {
          type: 'object',
          properties: {
            collector_identifier: { type: 'string', description: 'Collector email address' },
          },
          required: ['collector_identifier'],
        },
      },
      {
        name: 'deposit_credits',
        description: 'Deposit credits to a collector\'s account (for bonuses, refunds, adjustments). Requires a reason.',
        inputSchema: {
          type: 'object',
          properties: {
            collector_identifier: { type: 'string', description: 'Collector email address' },
            amount: { type: 'number', description: 'Number of credits to deposit (max 10,000)' },
            reason: { type: 'string', description: 'Reason for deposit (min 10 chars)' },
            source: { type: 'string', enum: ['bonus', 'refund', 'adjustment', 'promotion'], description: 'Source of credits' },
          },
          required: ['collector_identifier', 'amount', 'reason', 'source'],
        },
      },
      {
        name: 'redeem_credits',
        description: 'Redeem/deduct credits from a collector\'s account for a purchase or service',
        inputSchema: {
          type: 'object',
          properties: {
            collector_identifier: { type: 'string', description: 'Collector email address' },
            amount: { type: 'number', description: 'Number of credits to redeem' },
            description: { type: 'string', description: 'Description of redemption' },
            reference_id: { type: 'string', description: 'Optional reference ID' },
          },
          required: ['collector_identifier', 'amount', 'description'],
        },
      },
      {
        name: 'get_transaction_history',
        description: 'Get credit transaction history for a collector',
        inputSchema: {
          type: 'object',
          properties: {
            collector_identifier: { type: 'string', description: 'Collector email address' },
            limit: { type: 'number', description: 'Number of transactions to return (default 20, max 100)' },
          },
          required: ['collector_identifier'],
        },
      },
      {
        name: 'get_subscription_details',
        description: 'Get detailed subscription information including Stripe data',
        inputSchema: {
          type: 'object',
          properties: {
            collector_identifier: { type: 'string', description: 'Collector email address' },
          },
          required: ['collector_identifier'],
        },
      },
      {
        name: 'get_membership_analytics',
        description: 'Get aggregate membership analytics and metrics',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to analyze (default 30)' },
          },
        },
      },
    ],
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'get_member_status':
        return await getMemberStatus(args)
      case 'get_credit_balance':
        return await getCreditBalance(args)
      case 'deposit_credits':
        return await depositCredits(args)
      case 'redeem_credits':
        return await redeemCredits(args)
      case 'get_transaction_history':
        return await getTransactionHistory(args)
      case 'get_subscription_details':
        return await getSubscriptionDetails(args)
      case 'get_membership_analytics':
        return await getMembershipAnalytics(args)
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
    }
  } catch (error: any) {
    if (error instanceof McpError) throw error
    console.error(`Error in tool ${name}:`, error)
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message || 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    }
  }
})

// ============================================
// Tool Implementations
// ============================================

async function getMemberStatus(args: unknown) {
  const { collector_identifier } = GetMemberStatusSchema.parse(args)

  const { data: collector } = await supabase
    .from('collectors')
    .select('id, email, first_name, last_name, stripe_customer_id')
    .eq('email', collector_identifier)
    .maybeSingle()

  if (!collector) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ isMember: false, message: 'Collector not found' }) }],
    }
  }

  const { data: subscription } = await supabase
    .from('collector_credit_subscriptions')
    .select('tier, status, monthly_credit_amount, current_period_end, cancel_at_period_end')
    .eq('collector_id', collector.id)
    .in('status', ['active', 'past_due', 'trialing'])
    .maybeSingle()

  const { data: account } = await supabase
    .from('collector_accounts')
    .select('credits_balance')
    .eq('collector_id', collector.id)
    .maybeSingle()

  const result = {
    isMember: subscription?.status === 'active',
    collector: {
      email: collector.email,
      name: `${collector.first_name || ''} ${collector.last_name || ''}`.trim(),
    },
    subscription: subscription ? {
      tier: subscription.tier,
      status: subscription.status,
      monthlyCredits: subscription.monthly_credit_amount,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    } : null,
    credits: {
      balance: account?.credits_balance || 0,
      valueUsd: (account?.credits_balance || 0) * 0.10,
    },
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  }
}

async function getCreditBalance(args: unknown) {
  const { collector_identifier } = GetCreditBalanceSchema.parse(args)

  const { data: collector } = await supabase
    .from('collectors')
    .select('id')
    .eq('email', collector_identifier)
    .maybeSingle()

  if (!collector) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Collector not found' }) }],
      isError: true,
    }
  }

  const { data: account } = await supabase
    .from('collector_accounts')
    .select('credits_balance, usd_balance')
    .eq('collector_id', collector.id)
    .maybeSingle()

  // Get breakdown by source
  const { data: breakdown } = await supabase
    .from('collector_ledger_entries')
    .select('credit_source, credits_amount')
    .eq('collector_identifier', collector_identifier)
    .gt('credits_amount', 0)

  const sourceBreakdown: Record<string, number> = {}
  for (const entry of breakdown || []) {
    const source = entry.credit_source || 'unknown'
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + entry.credits_amount
  }

  const result = {
    balance: account?.credits_balance || 0,
    valueUsd: (account?.credits_balance || 0) * 0.10,
    breakdown: sourceBreakdown,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  }
}

async function depositCredits(args: unknown) {
  const validated = DepositCreditsSchema.parse(args)
  const { collector_identifier, amount, reason, source } = validated

  // Get collector
  const { data: collector } = await supabase
    .from('collectors')
    .select('id')
    .eq('email', collector_identifier)
    .maybeSingle()

  if (!collector) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Collector not found' }) }],
      isError: true,
    }
  }

  // Create ledger entry
  const { error: insertError } = await supabase
    .from('collector_ledger_entries')
    .insert({
      collector_identifier,
      transaction_type: 'deposit',
      credits_amount: amount,
      usd_amount: amount * 0.10,
      description: reason,
      credit_source: source,
      reference_type: 'mcp_adjustment',
      metadata: { source: 'mcp-server', reason },
    })

  if (insertError) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: insertError.message }) }],
      isError: true,
    }
  }

  // Update account balance
  const { data: account } = await supabase
    .from('collector_accounts')
    .select('id, credits_balance')
    .eq('collector_id', collector.id)
    .maybeSingle()

  if (account) {
    await supabase
      .from('collector_accounts')
      .update({ credits_balance: account.credits_balance + amount })
      .eq('id', account.id)
  } else {
    await supabase.from('collector_accounts').insert({
      collector_id: collector.id,
      credits_balance: amount,
      usd_balance: 0,
    })
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        deposited: amount,
        newBalance: (account?.credits_balance || 0) + amount,
        reason,
        source,
      }, null, 2),
    }],
  }
}

async function redeemCredits(args: unknown) {
  const validated = RedeemCreditsSchema.parse(args)
  const { collector_identifier, amount, description, reference_id } = validated

  // Get collector
  const { data: collector } = await supabase
    .from('collectors')
    .select('id')
    .eq('email', collector_identifier)
    .maybeSingle()

  if (!collector) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Collector not found' }) }],
      isError: true,
    }
  }

  // Check balance
  const { data: account } = await supabase
    .from('collector_accounts')
    .select('id, credits_balance')
    .eq('collector_id', collector.id)
    .maybeSingle()

  const currentBalance = account?.credits_balance || 0

  if (currentBalance < amount) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Insufficient credits',
          requested: amount,
          available: currentBalance,
        }),
      }],
      isError: true,
    }
  }

  // Create ledger entry
  await supabase.from('collector_ledger_entries').insert({
    collector_identifier,
    transaction_type: 'redemption',
    credits_amount: -amount,
    usd_amount: -(amount * 0.10),
    description,
    credit_source: 'purchase',
    reference_type: 'mcp_redemption',
    reference_id,
  })

  // Update balance
  await supabase
    .from('collector_accounts')
    .update({ credits_balance: currentBalance - amount })
    .eq('id', account!.id)

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        redeemed: amount,
        previousBalance: currentBalance,
        newBalance: currentBalance - amount,
        description,
      }, null, 2),
    }],
  }
}

async function getTransactionHistory(args: unknown) {
  const { collector_identifier, limit } = GetTransactionHistorySchema.parse(args)

  const { data: transactions, error } = await supabase
    .from('collector_ledger_entries')
    .select('id, transaction_type, credits_amount, usd_amount, description, credit_source, created_at')
    .eq('collector_identifier', collector_identifier)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
      isError: true,
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(transactions || [], null, 2) }],
  }
}

async function getSubscriptionDetails(args: unknown) {
  const { collector_identifier } = GetSubscriptionDetailsSchema.parse(args)

  const { data: collector } = await supabase
    .from('collectors')
    .select('id, stripe_customer_id')
    .eq('email', collector_identifier)
    .maybeSingle()

  if (!collector) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Collector not found' }) }],
      isError: true,
    }
  }

  const { data: subscription } = await supabase
    .from('collector_credit_subscriptions')
    .select('*')
    .eq('collector_id', collector.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get Stripe subscription details if available
  let stripeDetails = null
  if (stripe && subscription?.stripe_subscription_id) {
    try {
      stripeDetails = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    } catch (e) {
      console.error('Failed to fetch Stripe subscription:', e)
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        localSubscription: subscription,
        stripeSubscription: stripeDetails ? {
          status: stripeDetails.status,
          currentPeriodEnd: new Date(stripeDetails.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: stripeDetails.cancel_at_period_end,
          items: stripeDetails.items.data.map(i => ({
            priceId: i.price.id,
            productId: i.price.product,
          })),
        } : null,
      }, null, 2),
    }],
  }
}

async function getMembershipAnalytics(args: unknown) {
  const { days } = GetMembershipAnalyticsSchema.parse(args)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get active subscriptions count by tier
  const { data: tierCounts } = await supabase
    .from('collector_credit_subscriptions')
    .select('tier')
    .eq('status', 'active')

  const tierBreakdown: Record<string, number> = {}
  for (const sub of tierCounts || []) {
    tierBreakdown[sub.tier || 'unknown'] = (tierBreakdown[sub.tier || 'unknown'] || 0) + 1
  }

  // Get total active members
  const totalActive = Object.values(tierBreakdown).reduce((a, b) => a + b, 0)

  // Get total credits in circulation
  const { data: totalCredits } = await supabase
    .from('collector_accounts')
    .select('credits_balance')

  const creditsInCirculation = (totalCredits || []).reduce((sum, a) => sum + (a.credits_balance || 0), 0)

  // Calculate MRR
  const mrr = Object.entries(tierBreakdown).reduce((sum, [tier, count]) => {
    const tierConfig = MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS]
    return sum + (tierConfig?.priceMonthly || 0) * count
  }, 0)

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period: `Last ${days} days`,
        totalActiveMembers: totalActive,
        tierBreakdown,
        creditsInCirculation,
        creditsValueUsd: creditsInCirculation * 0.10,
        mrr,
        arr: mrr * 12,
      }, null, 2),
    }],
  }
}

// ============================================
// Start Server
// ============================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Membership MCP server running on stdio')
}

main().catch(console.error)
