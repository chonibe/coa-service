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

async function check2023EditionSeries() {
  try {
    console.log('🔍 Checking for "2023 Edition" series...\n')

    // Get all series
    const { data: allSeries, error: fetchError } = await supabase
      .from('artwork_series')
      .select('id, name, vendor_id, vendor_name, is_active')
      .order('vendor_name')
      .order('name')

    if (fetchError) {
      console.error('❌ Error fetching series:', fetchError)
      process.exit(1)
    }

    if (!allSeries || allSeries.length === 0) {
      console.log('✅ No series found!')
      return
    }

    console.log(`📊 Found ${allSeries.length} total series\n`)

    // Find "2023 Edition" series
    const edition2023 = allSeries.filter(s => 
      s.name.toLowerCase().includes('2023') && 
      s.name.toLowerCase().includes('edition')
    )

    if (edition2023.length === 0) {
      console.log('⚠️  No "2023 Edition" series found\n')
      console.log('📋 All series names:')
      const uniqueNames = new Set(allSeries.map(s => s.name))
      Array.from(uniqueNames).sort().forEach(name => console.log(`   - "${name}"`))
    } else {
      console.log(`✅ Found ${edition2023.length} series matching "2023 Edition":\n`)
      edition2023.forEach(series => {
        console.log(`   Series: "${series.name}"`)
        console.log(`   ID: ${series.id}`)
        console.log(`   Vendor: ${series.vendor_name} (ID: ${series.vendor_id})`)
        console.log(`   Active: ${series.is_active}`)
        console.log(`   Members: ${series.member_count || 0}`)
        console.log('')
      })
    }

    // Show all series for reference
    console.log('\n📋 All series in database:')
    const seriesByVendor = new Map<number, typeof allSeries>()
    for (const series of allSeries) {
      if (!seriesByVendor.has(series.vendor_id)) {
        seriesByVendor.set(series.vendor_id, [])
      }
      seriesByVendor.get(series.vendor_id)!.push(series)
    }

    for (const [vendorId, vendorSeries] of seriesByVendor.entries()) {
      const vendorName = vendorSeries[0].vendor_name
      console.log(`\n   Vendor: ${vendorName} (ID: ${vendorId})`)
      vendorSeries.forEach(s => {
        console.log(`      - "${s.name}" (${s.id}) - ${s.member_count || 0} members`)
      })
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

check2023EditionSeries()

