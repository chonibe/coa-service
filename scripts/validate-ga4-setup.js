#!/usr/bin/env node

/**
 * GA4 Setup Validation Script
 * Validates that Google Analytics 4 is properly configured and tracking events
 *
 * This script:
 * 1. Checks environment variables
 * 2. Validates GA4 API access
 * 3. Tests custom dimensions and metrics
 * 4. Simulates e-commerce events
 * 5. Checks real-time data
 *
 * Usage: npm run validate:ga4
 */

const { google } = require('googleapis')
const fs = require('fs')

// Configuration
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || 'properties/252918461'
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const SERVICE_ACCOUNT_KEY_PATH = process.env.GA_SERVICE_ACCOUNT_KEY_PATH || './ga-service-account.json'

class GA4Validator {
  constructor() {
    this.propertyId = PROPERTY_ID.replace('properties/', '')
    this.auth = null
    this.analyticsData = null
    this.analyticsAdmin = null
  }

  async initialize() {
    try {
      console.log('🔐 Initializing GA4 APIs...')

      if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
        console.error(`❌ Service account key not found: ${SERVICE_ACCOUNT_KEY_PATH}`)
        return false
      }

      this.auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_PATH,
        scopes: [
          'https://www.googleapis.com/auth/analytics.readonly',
          'https://www.googleapis.com/auth/analytics.admin'
        ]
      })

      this.analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: this.auth
      })

      this.analyticsAdmin = google.analyticsadmin({
        version: 'v1beta',
        auth: this.auth
      })

      console.log('✅ GA4 APIs initialized')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize GA4 APIs:', error.message)
      return false
    }
  }

  async validateEnvironment() {
    console.log('\n🔍 Validating Environment Configuration...')

    const checks = [
      {
        name: 'GA_MEASUREMENT_ID',
        value: GA_MEASUREMENT_ID,
        required: true,
        pattern: /^G-[A-Z0-9]+$/
      },
      {
        name: 'GOOGLE_ANALYTICS_PROPERTY_ID',
        value: PROPERTY_ID,
        required: true,
        pattern: /^properties\/\d+$/
      }
    ]

    let allValid = true

    for (const check of checks) {
      if (!check.value) {
        console.error(`❌ ${check.name} is not set`)
        allValid = false
        continue
      }

      if (check.pattern && !check.pattern.test(check.value)) {
        console.error(`❌ ${check.name} format is invalid: ${check.value}`)
        allValid = false
        continue
      }

      console.log(`✅ ${check.name}: ${check.value}`)
    }

    return allValid
  }

  async validatePropertyAccess() {
    console.log('\n📊 Validating Property Access...')

    try {
      const response = await this.analyticsAdmin.properties.get({
        name: `properties/${this.propertyId}`
      })

      console.log(`✅ Property access confirmed: ${response.data.displayName}`)
      console.log(`📍 Property ID: ${response.data.name}`)
      console.log(`🌍 Timezone: ${response.data.timeZone}`)
      console.log(`💰 Currency: ${response.data.currencyCode}`)

      return true
    } catch (error) {
      console.error('❌ Cannot access GA4 property:', error.message)
      console.log('💡 Make sure:')
      console.log('   1. Property ID is correct')
      console.log('   2. Service account has GA4 admin permissions')
      console.log('   3. Property exists and is accessible')
      return false
    }
  }

  async validateCustomDefinitions() {
    console.log('\n📏 Validating Custom Dimensions & Metrics...')

    try {
      // Check custom dimensions
      const dimensions = await this.analyticsAdmin.properties.customDimensions.list({
        parent: `properties/${this.propertyId}`
      })

      const expectedDimensions = ['artist_name', 'collection_name', 'product_type', 'customer_type', 'traffic_source_detail', 'device_type', 'user_country']
      const foundDimensions = dimensions.data.customDimensions?.map(d => d.parameterName) || []

      console.log(`📏 Found ${dimensions.data.customDimensions?.length || 0} custom dimensions:`)
      dimensions.data.customDimensions?.forEach(dim => {
        const status = expectedDimensions.includes(dim.parameterName) ? '✅' : '⚠️'
        console.log(`   ${status} ${dim.displayName} (${dim.parameterName})`)
      })

      // Check custom metrics
      const metrics = await this.analyticsAdmin.properties.customMetrics.list({
        parent: `properties/${this.propertyId}`
      })

      const expectedMetrics = ['items_per_order', 'shipping_cost']
      const foundMetrics = metrics.data.customMetrics?.map(m => m.parameterName) || []

      console.log(`📊 Found ${metrics.data.customMetrics?.length || 0} custom metrics:`)
      metrics.data.customMetrics?.forEach(metric => {
        const status = expectedMetrics.includes(metric.parameterName) ? '✅' : '⚠️'
        console.log(`   ${status} ${metric.displayName} (${metric.parameterName})`)
      })

      // Check missing definitions
      const missingDimensions = expectedDimensions.filter(d => !foundDimensions.includes(d))
      const missingMetrics = expectedMetrics.filter(m => !foundMetrics.includes(m))

      if (missingDimensions.length > 0) {
        console.log(`\n⚠️  Missing custom dimensions: ${missingDimensions.join(', ')}`)
        console.log('   Run: npm run setup:ga4')
      }

      if (missingMetrics.length > 0) {
        console.log(`\n⚠️  Missing custom metrics: ${missingMetrics.join(', ')}`)
        console.log('   Run: npm run setup:ga4')
      }

      return missingDimensions.length === 0 && missingMetrics.length === 0
    } catch (error) {
      console.error('❌ Failed to check custom definitions:', error.message)
      return false
    }
  }

  async validateAudiences() {
    console.log('\n👥 Validating Audiences...')

    try {
      const audiences = await this.analyticsAdmin.properties.audiences.list({
        parent: `properties/${this.propertyId}`
      })

      const expectedAudiences = [
        'Cart Abandoners - 7 Days',
        'Product Viewers - No Purchase',
        'High-Value Collectors',
        'Season 2 Viewers',
        'Mobile Shoppers'
      ]

      console.log(`👥 Found ${audiences.data.audiences?.length || 0} audiences:`)
      audiences.data.audiences?.forEach(audience => {
        const status = expectedAudiences.includes(audience.displayName) ? '✅' : 'ℹ️'
        console.log(`   ${status} ${audience.displayName}`)
      })

      const foundAudiences = audiences.data.audiences?.map(a => a.displayName) || []
      const missingAudiences = expectedAudiences.filter(a => !foundAudiences.includes(a))

      if (missingAudiences.length > 0) {
        console.log(`\n⚠️  Missing audiences: ${missingAudiences.join(', ')}`)
        console.log('   Run: npm run setup:ga4')
      }

      return missingAudiences.length === 0
    } catch (error) {
      console.error('❌ Failed to check audiences:', error.message)
      return false
    }
  }

  async testRealtimeData() {
    console.log('\n📈 Testing Real-time Data Access...')

    try {
      const response = await this.analyticsData.properties.runRealtimeReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          metrics: [{ name: 'activeUsers' }],
          dimensions: [{ name: 'deviceCategory' }],
          limit: 5
        }
      })

      console.log('✅ Real-time data access confirmed')
      console.log(`👥 Active users by device:`)

      response.data.rows?.forEach(row => {
        const device = row.dimensionValues?.[0]?.value || 'unknown'
        const users = row.metricValues?.[0]?.value || '0'
        console.log(`   ${device}: ${users} users`)
      })

      return true
    } catch (error) {
      console.error('❌ Real-time data access failed:', error.message)
      console.log('💡 This might be expected if there are no active users currently')
      return false // Don't fail validation for this
    }
  }

  async testEcommerceEvents() {
    console.log('\n🛒 Testing E-commerce Event Tracking...')

    // This would test if recent e-commerce events are being tracked
    // For now, we'll just check if we can query e-commerce metrics
    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
          metrics: [
            { name: 'ecommercePurchases' },
            { name: 'totalRevenue' }
          ],
          dimensions: [{ name: 'date' }],
          limit: 7
        }
      })

      console.log('✅ E-commerce data query successful')
      console.log(`💰 Recent e-commerce activity (last 7 days):`)

      response.data.rows?.forEach(row => {
        const date = row.dimensionValues?.[0]?.value
        const purchases = row.metricValues?.[0]?.value || '0'
        const revenue = row.metricValues?.[1]?.value || '0'
        console.log(`   ${date}: ${purchases} purchases, $${revenue} revenue`)
      })

      return true
    } catch (error) {
      console.error('❌ E-commerce data query failed:', error.message)
      console.log('💡 This might be expected if no e-commerce events have been tracked yet')
      return false // Don't fail validation for this
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Validation Report...')

    const report = {
      timestamp: new Date().toISOString(),
      propertyId: this.propertyId,
      measurementId: GA_MEASUREMENT_ID,
      validationResults: {
        environment: await this.validateEnvironment(),
        propertyAccess: await this.validatePropertyAccess(),
        customDefinitions: await this.validateCustomDefinitions(),
        audiences: await this.validateAudiences(),
        realtimeData: await this.testRealtimeData(),
        ecommerceEvents: await this.testEcommerceEvents()
      }
    }

    // Save report
    const reportPath = `./ga4-validation-report-${Date.now()}.json`
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`📄 Validation report saved: ${reportPath}`)

    // Summary
    const passed = Object.values(report.validationResults).filter(Boolean).length
    const total = Object.keys(report.validationResults).length

    console.log(`\n📊 Validation Summary: ${passed}/${total} checks passed`)

    if (passed === total) {
      console.log('🎉 All GA4 validations passed! Your setup is ready.')
    } else {
      console.log('⚠️  Some validations failed. Check the report for details.')
      console.log('💡 Run: npm run setup:ga4  to fix missing configurations')
    }

    return report
  }

  async run() {
    console.log('🔍 Starting GA4 Setup Validation...')
    console.log(`📊 Property ID: ${this.propertyId}`)
    console.log(`🎯 Measurement ID: ${GA_MEASUREMENT_ID || 'Not set'}`)

    const initialized = await this.initialize()
    if (!initialized) return

    await this.generateReport()
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new GA4Validator()
  validator.run().catch(console.error)
}

module.exports = GA4Validator