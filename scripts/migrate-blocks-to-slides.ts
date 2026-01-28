/**
 * Migration Script: Convert existing content blocks to slides
 * 
 * This script migrates data from the collector_benefits_content table
 * to the new artwork_slides format.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-blocks-to-slides.ts
 *   or
 *   npx tsx scripts/migrate-blocks-to-slides.ts
 * 
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --product-id Migrate specific product only
 */

import { createClient } from '@supabase/supabase-js'
import type { Slide, SlideBackground, CanvasElement } from '../lib/slides/types'

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Parse command line args
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const productIdIndex = args.indexOf('--product-id')
const specificProductId = productIdIndex !== -1 ? args[productIdIndex + 1] : null

interface ContentBlock {
  id: number
  product_id: string
  benefit_type_id: number
  title: string
  description?: string
  content_url?: string
  block_config?: any
  display_order: number
  block_type?: string
}

// Map benefit_type_id to block types
const BENEFIT_TYPE_MAP: Record<number, string> = {
  1: 'text',
  2: 'image',
  3: 'video',
  4: 'audio',
  5: 'soundtrack',
  6: 'voice_note',
  7: 'process_gallery',
  8: 'inspiration_board',
  9: 'artist_note',
}

// Convert a content block to a slide
function blockToSlide(block: ContentBlock, order: number): Partial<Slide> {
  const elements: CanvasElement[] = []
  let background: SlideBackground = {
    type: 'gradient',
    value: 'dark',
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }

  // Add title as text element
  if (block.title) {
    elements.push({
      id: `title-${block.id}`,
      type: 'text',
      content: block.title,
      x: 50,
      y: 30,
      scale: 1,
      rotation: 0,
      style: {
        fontSize: 'xlarge',
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
      },
    })
  }

  // Handle different block types
  const blockType = block.block_type || BENEFIT_TYPE_MAP[block.benefit_type_id] || 'text'

  switch (blockType) {
    case 'text':
    case 'artist_note':
      if (block.description) {
        elements.push({
          id: `desc-${block.id}`,
          type: 'text',
          content: block.description,
          x: 50,
          y: 55,
          scale: 1,
          rotation: 0,
          style: {
            fontSize: 'medium',
            fontWeight: 'normal',
            color: '#ffffff',
            textAlign: 'center',
          },
        })
      }
      break

    case 'image':
      if (block.content_url) {
        // Use image as background
        background = {
          type: 'image',
          url: block.content_url,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
        }
      }
      break

    case 'video':
      if (block.content_url) {
        background = {
          type: 'video',
          url: block.content_url,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
        }
      }
      break

    case 'audio':
    case 'soundtrack':
    case 'voice_note':
      // These become slides with audio attached
      break

    case 'process_gallery':
    case 'inspiration_board':
      // These would need multiple slides - create one with description
      if (block.description) {
        elements.push({
          id: `desc-${block.id}`,
          type: 'text',
          content: block.description,
          x: 50,
          y: 55,
          scale: 1,
          rotation: 0,
          style: {
            fontSize: 'medium',
            color: '#ffffff',
          },
        })
      }
      break
  }

  return {
    product_id: block.product_id,
    display_order: order,
    background,
    elements,
    title: block.title,
    caption: block.description?.substring(0, 200),
    is_locked: false,
    is_published: true,
  }
}

async function migrate() {
  console.log('='.repeat(60))
  console.log('Content Blocks to Slides Migration')
  console.log('='.repeat(60))
  
  if (isDryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n')
  }

  // Get all products with content blocks
  let query = supabase
    .from('collector_benefits_content')
    .select('*')
    .order('product_id')
    .order('display_order')

  if (specificProductId) {
    query = query.eq('product_id', specificProductId)
    console.log(`\nFiltering to product: ${specificProductId}`)
  }

  const { data: blocks, error: blocksError } = await query

  if (blocksError) {
    console.error('Error fetching blocks:', blocksError)
    process.exit(1)
  }

  if (!blocks || blocks.length === 0) {
    console.log('\nNo content blocks found to migrate.')
    return
  }

  console.log(`\nFound ${blocks.length} content blocks to migrate`)

  // Group blocks by product
  const blocksByProduct = blocks.reduce((acc, block) => {
    if (!acc[block.product_id]) {
      acc[block.product_id] = []
    }
    acc[block.product_id].push(block)
    return acc
  }, {} as Record<string, ContentBlock[]>)

  const productIds = Object.keys(blocksByProduct)
  console.log(`Across ${productIds.length} products\n`)

  let totalMigrated = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const productId of productIds) {
    const productBlocks = blocksByProduct[productId]
    console.log(`\nProduct: ${productId}`)
    console.log(`  Blocks: ${productBlocks.length}`)

    // Check if slides already exist for this product
    const { data: existingSlides, error: checkError } = await supabase
      .from('artwork_slides')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (checkError) {
      console.error(`  Error checking existing slides:`, checkError)
      totalErrors++
      continue
    }

    if (existingSlides && existingSlides.length > 0) {
      console.log(`  ⏭️  Skipped - slides already exist`)
      totalSkipped += productBlocks.length
      continue
    }

    // Convert blocks to slides
    const slides = productBlocks.map((block, index) => blockToSlide(block, index))

    if (isDryRun) {
      console.log(`  Would create ${slides.length} slides:`)
      slides.forEach((slide, i) => {
        console.log(`    ${i + 1}. ${slide.title || '(no title)'} - ${slide.background?.type}`)
      })
    } else {
      // Insert slides
      const { data: insertedSlides, error: insertError } = await supabase
        .from('artwork_slides')
        .insert(slides)
        .select()

      if (insertError) {
        console.error(`  Error inserting slides:`, insertError)
        totalErrors += productBlocks.length
        continue
      }

      console.log(`  ✅ Created ${insertedSlides?.length || 0} slides`)
      totalMigrated += insertedSlides?.length || 0
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Migration Summary')
  console.log('='.repeat(60))
  console.log(`Total blocks processed: ${blocks.length}`)
  if (isDryRun) {
    console.log(`Would migrate: ${blocks.length - totalSkipped} blocks`)
    console.log(`Would skip: ${totalSkipped} blocks (slides exist)`)
  } else {
    console.log(`Migrated: ${totalMigrated} blocks`)
    console.log(`Skipped: ${totalSkipped} blocks (slides exist)`)
    console.log(`Errors: ${totalErrors} blocks`)
  }
  console.log('='.repeat(60))
}

// Run migration
migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
