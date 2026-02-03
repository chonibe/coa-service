/**
 * Check Street Lamp Product Template
 * 
 * Fetches product template and metafield information for street_lamp
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { shopifyAdmin } from '../lib/shopify/admin'

async function checkStreetLampTemplate() {
  console.log('🔍 Checking Street Lamp product template...\n')
  
  try {
    // First, get product by handle
    const handleQuery = `{
      productByHandle(handle: "street_lamp") {
        id
        title
        handle
        templateSuffix
        metafields(first: 50) {
          edges {
            node {
              namespace
              key
              value
              type
            }
          }
        }
      }
    }`
    
    const result = await shopifyAdmin(handleQuery)
    console.log('Product Info:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.data?.productByHandle) {
      const product = result.data.productByHandle
      console.log('\n📦 Product:', product.title)
      console.log('🔖 Template Suffix:', product.templateSuffix || '(default)')
      console.log('\n📋 Metafields:')
      product.metafields?.edges?.forEach((edge: any) => {
        const mf = edge.node
        console.log(`  - ${mf.namespace}.${mf.key}: ${mf.value.substring(0, 100)}${mf.value.length > 100 ? '...' : ''}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkStreetLampTemplate()
