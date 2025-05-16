const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProductSchema() {
  try {
    // Check products table
    console.log('\nChecking products table...')
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', '8684737560803')
      .limit(1)

    if (productsError) {
      console.error('Error querying products table:', productsError)
    } else {
      console.log('Products table data:', productsData)
    }

    // Check order_line_items_v2 table
    console.log('\nChecking order_line_items_v2 table...')
    const { data: lineItemsData, error: lineItemsError } = await supabase
      .from('order_line_items_v2')
      .select('*')
      .eq('product_id', '8684737560803')
      .limit(1)

    if (lineItemsError) {
      console.error('Error querying order_line_items_v2 table:', lineItemsError)
    } else {
      console.log('Line items data:', lineItemsData)
    }

    // Get table information
    console.log('\nGetting table information...')
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .in('table_name', ['products', 'order_line_items_v2'])
      .in('column_name', ['product_id'])

    if (tableInfoError) {
      console.error('Error getting table information:', tableInfoError)
    } else {
      console.log('Table schema information:', tableInfo)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

async function insertTestLineItem() {
  try {
    console.log('\nInserting test line item into order_line_items_v2...')
    const { data, error } = await supabase.from('order_line_items_v2').insert([
      {
        order_id: 'test-order-001',
        order_name: 'Test Order',
        line_item_id: 'test-line-item-001',
        product_id: '8684737560803',
        variant_id: 'test-variant-001',
        name: 'Test Product',
        description: 'Test line item for debugging',
        price: 99.99,
        vendor_name: 'Marylou Faure',
        fulfillment_status: 'pending',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    if (error) {
      console.error('Error inserting test line item:', error)
    } else {
      console.log('Inserted test line item:', data)
    }
  } catch (error) {
    console.error('Unexpected error inserting test line item:', error)
  }
}

checkProductSchema().then(insertTestLineItem) 