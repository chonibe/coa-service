#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSlidesAPI() {
  console.log('🧪 Testing slides API...\n')

  // Get a product ID to test with
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .limit(1)

  if (productsError || !products || products.length === 0) {
    console.error('❌ No products found to test with:', productsError)
    return
  }

  const testProductId = products[0].id
  console.log(`📦 Testing with product: ${products[0].name} (${testProductId})`)

  // Test creating a slide
  console.log('\n📝 Testing slide creation...')
  const { data: newSlide, error: createError } = await supabase
    .from('artwork_slides')
    .insert({
      product_id: testProductId,
      title: 'Test Slide',
      caption: 'This is a test slide created by the migration script'
    })
    .select()
    .single()

  if (createError) {
    console.error('❌ Error creating slide:', createError)
    return
  }

  console.log('✅ Slide created successfully:', newSlide.id)

  // Test reading slides
  console.log('\n📖 Testing slide retrieval...')
  const { data: slides, error: readError } = await supabase
    .from('artwork_slides')
    .select('*')
    .eq('product_id', testProductId)

  if (readError) {
    console.error('❌ Error reading slides:', readError)
    return
  }

  console.log(`✅ Retrieved ${slides.length} slides for product`)

  // Test story post creation
  console.log('\n📝 Testing story post creation...')
  const { data: newPost, error: postError } = await supabase
    .from('artwork_story_posts')
    .insert({
      product_id: testProductId,
      author_type: 'artist',
      author_id: 'test@example.com',
      author_name: 'Test Artist',
      content_type: 'text',
      text_content: 'This is a test story post!'
    })
    .select()
    .single()

  if (postError) {
    console.error('❌ Error creating story post:', postError)
  } else {
    console.log('✅ Story post created successfully:', newPost.id)
  }

  console.log('\n🎉 All API tests completed!')
  console.log('\nThe slides feature should now work in your application!')
}

testSlidesAPI().catch(console.error)
