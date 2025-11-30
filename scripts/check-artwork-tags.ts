import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkArtworkTags() {
  try {
    console.log('🔍 Checking artwork tags in database...\n')

    // Get all vendor product submissions
    const { data: allSubmissions, error: fetchError } = await supabase
      .from('vendor_product_submissions')
      .select('id, vendor_id, vendor_name, product_data, status')
      .in('status', ['pending', 'approved', 'published'])

    if (fetchError) {
      console.error('❌ Error fetching submissions:', fetchError)
      process.exit(1)
    }

    if (!allSubmissions || allSubmissions.length === 0) {
      console.log('✅ No submissions found!')
      return
    }

    console.log(`📊 Found ${allSubmissions.length} submissions\n`)

    // Collect all unique tags
    const allTags = new Set<string>()
    const tagsByArtwork: Array<{ id: string; title: string; tags: string[] }> = []

    for (const submission of allSubmissions) {
      const productData = submission.product_data as any
      const tags = productData?.tags || []
      
      if (Array.isArray(tags) && tags.length > 0) {
        tags.forEach(tag => allTags.add(tag))
        tagsByArtwork.push({
          id: submission.id,
          title: productData?.title || 'Untitled',
          tags: tags
        })
      }
    }

    console.log(`📋 Found ${allTags.size} unique tags across ${tagsByArtwork.length} artworks\n`)
    
    // Show tags that might be related to Kickstarter
    const kickstarterRelated = Array.from(allTags).filter(tag => 
      tag.toLowerCase().includes('kickstarter') || 
      tag.toLowerCase().includes('artist')
    )

    console.log('🎨 Tags related to "Kickstarter" or "Artist":')
    if (kickstarterRelated.length > 0) {
      kickstarterRelated.forEach(tag => console.log(`   - "${tag}"`))
    } else {
      console.log('   (none found)')
    }

    console.log('\n📋 All unique tags:')
    Array.from(allTags).sort().forEach(tag => console.log(`   - "${tag}"`))

    // Show artworks with Kickstarter-related tags
    if (kickstarterRelated.length > 0) {
      console.log('\n🎨 Artworks with Kickstarter-related tags:')
      tagsByArtwork
        .filter(art => art.tags.some(tag => kickstarterRelated.includes(tag)))
        .forEach(art => {
          console.log(`\n   "${art.title}" (${art.id})`)
          console.log(`   Tags: ${art.tags.filter(t => kickstarterRelated.includes(t)).join(', ')}`)
        })
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

checkArtworkTags()

