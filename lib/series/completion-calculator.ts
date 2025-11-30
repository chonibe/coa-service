/**
 * Series Completion Calculator
 * Calculates series completion status by matching artworks to sales via order_line_items_v2
 */

import { createClient } from '@/lib/supabase/server'
import type { CompletionProgress, MilestoneConfig } from '@/types/artwork-series'

/**
 * Calculate completion progress for a series
 * Matches artwork_series_members.shopify_product_id to order_line_items_v2.product_id
 * Counts fulfilled orders to determine sold count
 */
export async function calculateSeriesCompletion(seriesId: string): Promise<CompletionProgress> {
  const supabase = createClient()

  // Get all artworks in series
  const { data: members, error: membersError } = await supabase
    .from('artwork_series_members')
    .select('shopify_product_id')
    .eq('series_id', seriesId)

  if (membersError) {
    console.error('Error fetching series members:', membersError)
    throw new Error(`Failed to fetch series members: ${membersError.message}`)
  }

  const totalArtworks = members?.length || 0

  if (totalArtworks === 0) {
    return {
      total_artworks: 0,
      sold_artworks: 0,
      percentage_complete: 0,
    }
  }

  // Get unique product IDs that are not null
  const productIds = members
    ?.map((m) => m.shopify_product_id)
    .filter((id): id is string => id !== null && id !== undefined)

  if (productIds.length === 0) {
    return {
      total_artworks: totalArtworks,
      sold_artworks: 0,
      percentage_complete: 0,
    }
  }

  // Count distinct sold artworks by matching product_id to fulfilled orders
  // Using a query that counts distinct product_ids that have fulfilled orders
  const { data: soldItems, error: soldError } = await supabase
    .from('order_line_items_v2')
    .select('product_id')
    .in('product_id', productIds)
    .eq('status', 'fulfilled')

  if (soldError) {
    console.error('Error fetching sold items:', soldError)
    throw new Error(`Failed to fetch sold items: ${soldError.message}`)
  }

  // Count unique product IDs that were sold
  const uniqueSoldProductIds = new Set(
    soldItems?.map((item) => item.product_id?.toString()).filter(Boolean) || []
  )
  const soldArtworks = uniqueSoldProductIds.size

  // Calculate percentage
  const percentageComplete = totalArtworks > 0 
    ? Math.round((soldArtworks / totalArtworks) * 100 * 100) / 100 // Round to 2 decimal places
    : 0

  return {
    total_artworks: totalArtworks,
    sold_artworks: soldArtworks,
    percentage_complete: percentageComplete,
  }
}

/**
 * Check if series should be marked as completed based on milestone_config
 * Returns true if series was completed, false otherwise
 */
export async function checkAndCompleteSeries(seriesId: string): Promise<boolean> {
  const supabase = createClient()

  // Get series with milestone_config
  const { data: series, error: seriesError } = await supabase
    .from('artwork_series')
    .select('id, vendor_id, milestone_config, completed_at')
    .eq('id', seriesId)
    .single()

  if (seriesError || !series) {
    console.error('Error fetching series:', seriesError)
    throw new Error(`Failed to fetch series: ${seriesError?.message || 'Series not found'}`)
  }

  // If already completed, return false
  if (series.completed_at) {
    return false
  }

  // Get milestone config
  const milestoneConfig = (series.milestone_config as MilestoneConfig) || {
    completion_type: 'all_sold',
    auto_complete: true,
  }

  // If auto_complete is false, don't auto-complete
  if (!milestoneConfig.auto_complete) {
    // Still update progress
    const progress = await calculateSeriesCompletion(seriesId)
    await supabase
      .from('artwork_series')
      .update({ completion_progress: progress })
      .eq('id', seriesId)
    return false
  }

  // Calculate current progress
  const progress = await calculateSeriesCompletion(seriesId)

  // Determine if should complete based on completion_type
  let shouldComplete = false
  const completionType = milestoneConfig.completion_type || 'all_sold'

  switch (completionType) {
    case 'all_sold':
      shouldComplete = progress.sold_artworks >= progress.total_artworks && progress.total_artworks > 0
      break
    case 'percentage_sold':
      const threshold = milestoneConfig.completion_threshold || 100
      shouldComplete = progress.percentage_complete >= threshold
      break
    case 'manual':
      shouldComplete = false // Manual completion only
      break
    default:
      shouldComplete = false
  }

  // If should complete, mark as completed
  if (shouldComplete) {
    const now = new Date().toISOString()

    // Update series
    const { error: updateError } = await supabase
      .from('artwork_series')
      .update({
        completed_at: now,
        completion_progress: progress,
      })
      .eq('id', seriesId)

    if (updateError) {
      console.error('Error updating series completion:', updateError)
      throw new Error(`Failed to update series completion: ${updateError.message}`)
    }

    // Record in completion history
    const { error: historyError } = await supabase
      .from('series_completion_history')
      .insert({
        series_id: seriesId,
        vendor_id: series.vendor_id,
        completed_at: now,
        completion_type: completionType,
        final_stats: progress,
      })

    if (historyError) {
      console.error('Error recording completion history:', historyError)
      // Don't throw - completion was successful, history is just for tracking
    }

    return true
  } else {
    // Just update progress without completing
    const { error: updateError } = await supabase
      .from('artwork_series')
      .update({ completion_progress: progress })
      .eq('id', seriesId)

    if (updateError) {
      console.error('Error updating series progress:', updateError)
      // Don't throw - progress update failure is not critical
    }

    return false
  }
}

/**
 * Recalculate completion for all series (useful for batch updates)
 */
export async function recalculateAllSeriesCompletion(vendorId?: number): Promise<void> {
  const supabase = createClient()

  let query = supabase
    .from('artwork_series')
    .select('id')

  if (vendorId) {
    query = query.eq('vendor_id', vendorId)
  }

  const { data: seriesList, error } = await query

  if (error) {
    console.error('Error fetching series list:', error)
    throw new Error(`Failed to fetch series list: ${error.message}`)
  }

  if (!seriesList || seriesList.length === 0) {
    return
  }

  // Process each series
  for (const series of seriesList) {
    try {
      await checkAndCompleteSeries(series.id)
    } catch (err) {
      console.error(`Error processing series ${series.id}:`, err)
      // Continue with other series even if one fails
    }
  }
}
