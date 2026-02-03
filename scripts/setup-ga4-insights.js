#!/usr/bin/env node

/**
 * GA4 Insights Setup Script
 * Automatically configures Google Analytics 4 for art marketplace insights
 *
 * This script uses the Google Analytics Admin API to create:
 * - Custom dimensions
 * - Custom metrics
 * - Audiences
 * - Explorations
 *
 * Prerequisites:
 * 1. Google Cloud Project with Analytics Admin API enabled
 * 2. Service account with GA4 admin permissions
 * 3. GA4 property ID in environment variables
 *
 * Usage: npm run setup:ga4
 */

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

// Configuration from environment
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || 'properties/252918461'
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const SERVICE_ACCOUNT_KEY_PATH = process.env.GA_SERVICE_ACCOUNT_KEY_PATH || './ga-service-account.json'

// GA4 Configurations
const CUSTOM_DIMENSIONS = [
  {
    name: 'artist_name',
    displayName: 'Artist Name',
    description: 'Artist or vendor name for each product',
    scope: 'EVENT',
    parameterName: 'item_brand'
  },
  {
    name: 'collection_name',
    displayName: 'Collection Name',
    description: 'Collection name (Season 1, Season 2, Kickstarter, etc.)',
    scope: 'EVENT',
    parameterName: 'item_category'
  },
  {
    name: 'product_type',
    displayName: 'Product Type',
    description: 'Product type (Print, Lamp, Accessory, etc.)',
    scope: 'EVENT',
    parameterName: 'item_category2'
  },
  {
    name: 'customer_type',
    displayName: 'Customer Type',
    description: 'New vs Returning customer',
    scope: 'USER',
    parameterName: 'customer_status'
  },
  {
    name: 'traffic_source_detail',
    displayName: 'Traffic Source Detail',
    description: 'Detailed traffic source',
    scope: 'EVENT',
    parameterName: 'source'
  },
  {
    name: 'device_type',
    displayName: 'Device Type',
    description: 'Desktop, Mobile, or Tablet',
    scope: 'EVENT',
    parameterName: 'device_category'
  },
  {
    name: 'user_country',
    displayName: 'User Country',
    description: 'Customer country',
    scope: 'USER',
    parameterName: 'country'
  }
]

const CUSTOM_METRICS = [
  {
    name: 'items_per_order',
    displayName: 'Items Per Order',
    description: 'Number of items in each order',
    scope: 'EVENT',
    parameterName: 'items',
    unitOfMeasurement: 'STANDARD'
  },
  {
    name: 'shipping_cost',
    displayName: 'Shipping Cost',
    description: 'Shipping amount charged',
    scope: 'EVENT',
    parameterName: 'shipping',
    unitOfMeasurement: 'CURRENCY_USD'
  }
]

const AUDIENCES = [
  {
    name: 'Cart Abandoners - 7 Days',
    displayName: 'Cart Abandoners (Last 7 Days)',
    description: 'Added to cart but didn\'t purchase in last 7 days',
    audienceFilter: {
      andGroup: {
        filterExpressions: [
          {
            eventFilter: {
              eventName: 'add_to_cart',
              eventParameterFilterExpression: {
                andGroup: {
                  filterExpressions: [
                    {
                      eventParameterFilter: {
                        eventParameterName: 'timestamp_micros',
                        stringFilter: {
                          matchType: 'BEGINS_WITH',
                          value: getTimestampFilter(7)
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          {
            notExpression: {
              eventFilter: {
                eventName: 'purchase',
                eventParameterFilterExpression: {
                  eventParameterFilter: {
                    eventParameterName: 'timestamp_micros',
                    stringFilter: {
                      matchType: 'BEGINS_WITH',
                      value: getTimestampFilter(7)
                    }
                  }
                }
              }
            }
          }
        ]
      }
    }
  },
  {
    name: 'Product Viewers - No Purchase',
    displayName: 'Product Browsers (No Purchase)',
    description: 'Viewed products but never purchased',
    audienceFilter: {
      andGroup: {
        filterExpressions: [
          {
            eventFilter: {
              eventName: 'view_item',
              eventParameterFilterExpression: {
                eventParameterFilter: {
                  eventParameterName: 'timestamp_micros',
                  stringFilter: {
                    matchType: 'BEGINS_WITH',
                    value: getTimestampFilter(14)
                  }
                }
              }
            }
          },
          {
            notExpression: {
              eventFilter: {
                eventName: 'purchase',
                eventParameterFilterExpression: {
                  eventParameterFilter: {
                    eventParameterName: 'timestamp_micros',
                    stringFilter: {
                      matchType: 'BEGINS_WITH',
                      value: getTimestampFilter(14)
                    }
                  }
                }
              }
            }
          }
        ]
      }
    }
  },
  {
    name: 'High-Value Collectors',
    displayName: 'High-Value Collectors',
    description: 'Customers who spent $200+ lifetime',
    audienceFilter: {
      eventFilter: {
        eventName: 'purchase',
        eventParameterFilterExpression: {
          eventParameterFilter: {
            eventParameterName: 'value',
            numericFilter: {
              operation: 'GREATER_THAN',
              value: { doubleValue: 200 }
            }
          }
        }
      }
    }
  },
  {
    name: 'Season 2 Viewers',
    displayName: 'Season 2 Enthusiasts',
    description: 'Viewed Season 2 products in last 30 days',
    audienceFilter: {
      eventFilter: {
        eventName: 'view_item',
        eventParameterFilterExpression: {
          andGroup: {
            filterExpressions: [
              {
                eventParameterFilter: {
                  eventParameterName: 'item_category',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'Season 2'
                  }
                }
              },
              {
                eventParameterFilter: {
                  eventParameterName: 'timestamp_micros',
                  stringFilter: {
                    matchType: 'BEGINS_WITH',
                    value: getTimestampFilter(30)
                  }
                }
              }
            ]
          }
        }
      }
    }
  },
  {
    name: 'Mobile Shoppers',
    displayName: 'Mobile Shoppers',
    description: 'Users who browse primarily on mobile',
    audienceFilter: {
      eventFilter: {
        eventName: 'session_start',
        eventParameterFilterExpression: {
          eventParameterFilter: {
            eventParameterName: 'device_category',
            stringFilter: {
              matchType: 'EXACT',
              value: 'mobile'
            }
          }
        }
      }
    }
  }
]

// Utility function to get timestamp filter for days ago
function getTimestampFilter(daysAgo) {
  const now = Date.now()
  const pastDate = now - (daysAgo * 24 * 60 * 60 * 1000)
  return pastDate.toString()
}

class GA4SetupManager {
  constructor() {
    this.propertyId = PROPERTY_ID.replace('properties/', '')
    this.auth = null
    this.analyticsAdmin = null
  }

  async initialize() {
    try {
      console.log('🔐 Initializing Google Analytics Admin API...')

      // Check if service account key exists
      if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
        console.error(`❌ Service account key not found at: ${SERVICE_ACCOUNT_KEY_PATH}`)
        console.log('📝 Please create a service account key and set GA_SERVICE_ACCOUNT_KEY_PATH')
        process.exit(1)
      }

      // Initialize auth
      this.auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_PATH,
        scopes: ['https://www.googleapis.com/auth/analytics.admin']
      })

      // Initialize Analytics Admin API
      this.analyticsAdmin = google.analyticsadmin({
        version: 'v1beta',
        auth: this.auth
      })

      console.log('✅ GA4 Admin API initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize GA4 Admin API:', error.message)
      process.exit(1)
    }
  }

  async createCustomDimensions() {
    console.log('\n📏 Creating Custom Dimensions...')

    for (const dimension of CUSTOM_DIMENSIONS) {
      try {
        const request = {
          parent: `properties/${this.propertyId}`,
          requestBody: {
            displayName: dimension.displayName,
            description: dimension.description,
            scope: dimension.scope,
            parameterName: dimension.parameterName
          }
        }

        const response = await this.analyticsAdmin.properties.customDimensions.create(request)
        console.log(`✅ Created dimension: ${dimension.displayName} (${response.data.name})`)
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Dimension already exists: ${dimension.displayName}`)
        } else {
          console.error(`❌ Failed to create dimension ${dimension.displayName}:`, error.message)
        }
      }
    }
  }

  async createCustomMetrics() {
    console.log('\n📊 Creating Custom Metrics...')

    for (const metric of CUSTOM_METRICS) {
      try {
        const request = {
          parent: `properties/${this.propertyId}`,
          requestBody: {
            displayName: metric.displayName,
            description: metric.description,
            scope: metric.scope,
            parameterName: metric.parameterName,
            measurementUnit: metric.unitOfMeasurement
          }
        }

        const response = await this.analyticsAdmin.properties.customMetrics.create(request)
        console.log(`✅ Created metric: ${metric.displayName} (${response.data.name})`)
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Metric already exists: ${metric.displayName}`)
        } else {
          console.error(`❌ Failed to create metric ${metric.displayName}:`, error.message)
        }
      }
    }
  }

  async createAudiences() {
    console.log('\n👥 Creating Audiences...')

    for (const audience of AUDIENCES) {
      try {
        const request = {
          parent: `properties/${this.propertyId}`,
          requestBody: {
            displayName: audience.displayName,
            description: audience.description,
            audienceFilter: audience.audienceFilter
          }
        }

        const response = await this.analyticsAdmin.properties.audiences.create(request)
        console.log(`✅ Created audience: ${audience.displayName} (${response.data.name})`)
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Audience already exists: ${audience.displayName}`)
        } else {
          console.error(`❌ Failed to create audience ${audience.displayName}:`, error.message)
        }
      }
    }
  }

  async validateSetup() {
    console.log('\n🔍 Validating GA4 Setup...')

    try {
      // Check property access
      const property = await this.analyticsAdmin.properties.get({
        name: `properties/${this.propertyId}`
      })
      console.log(`✅ Property access confirmed: ${property.data.displayName}`)

      // List custom dimensions
      const dimensions = await this.analyticsAdmin.properties.customDimensions.list({
        parent: `properties/${this.propertyId}`
      })
      console.log(`📏 Found ${dimensions.data.customDimensions?.length || 0} custom dimensions`)

      // List custom metrics
      const metrics = await this.analyticsAdmin.properties.customMetrics.list({
        parent: `properties/${this.propertyId}`
      })
      console.log(`📊 Found ${metrics.data.customMetrics?.length || 0} custom metrics`)

      // List audiences
      const audiences = await this.analyticsAdmin.properties.audiences.list({
        parent: `properties/${this.propertyId}`
      })
      console.log(`👥 Found ${audiences.data.audiences?.length || 0} audiences`)

    } catch (error) {
      console.error('❌ Validation failed:', error.message)
    }
  }

  async generateExplorationConfigs() {
    console.log('\n📋 Generating Exploration Configurations...')

    const explorations = {
      artistPerformance: {
        name: 'Artist Performance Dashboard',
        type: 'FREE_FORM',
        configuration: {
          dimensions: [
            { name: 'itemBrand' },
            { name: 'date' }
          ],
          metrics: [
            { name: 'eventCount', parameters: [{ name: 'eventName', value: 'view_item' }] },
            { name: 'eventCount', parameters: [{ name: 'eventName', value: 'add_to_cart' }] },
            { name: 'eventCount', parameters: [{ name: 'eventName', value: 'purchase' }] },
            { name: 'totalRevenue' }
          ],
          dateRange: { startDate: '90daysAgo', endDate: 'yesterday' },
          orderBys: [{ metric: { metricName: 'totalRevenue' }, desc: true }]
        }
      },
      conversionFunnel: {
        name: 'Purchase Funnel - Complete Journey',
        type: 'FUNNEL',
        configuration: {
          steps: [
            { name: 'session_start', isDirectlyFollowedBy: false },
            { name: 'view_item', isDirectlyFollowedBy: false },
            { name: 'add_to_cart', isDirectlyFollowedBy: false },
            { name: 'begin_checkout', isDirectlyFollowedBy: false },
            { name: 'add_payment_info', isDirectlyFollowedBy: false },
            { name: 'purchase', isDirectlyFollowedBy: false }
          ],
          dateRange: { startDate: '90daysAgo', endDate: 'yesterday' }
        }
      }
    }

    // Save exploration configs to file
    const configPath = path.join(__dirname, '..', 'ga4-explorations.json')
    fs.writeFileSync(configPath, JSON.stringify(explorations, null, 2))
    console.log(`📄 Exploration configurations saved to: ${configPath}`)
    console.log('📝 Copy these configurations to GA4 Explore → Create New Exploration')
  }

  async run() {
    console.log('🚀 Starting GA4 Insights Setup...')
    console.log(`📊 Property ID: ${this.propertyId}`)
    console.log(`🎯 Measurement ID: ${GA_MEASUREMENT_ID || 'Not set'}`)

    await this.initialize()
    await this.createCustomDimensions()
    await this.createCustomMetrics()
    await this.createAudiences()
    await this.validateSetup()
    await this.generateExplorationConfigs()

    console.log('\n🎉 GA4 Insights Setup Complete!')
    console.log('\n📋 Next Steps:')
    console.log('1. Go to GA4 → Explore and create explorations using the generated configs')
    console.log('2. Set up the Daily Dashboard as described in the documentation')
    console.log('3. Create alerts for revenue drops and conversion changes')
    console.log('4. Test e-commerce events by making a purchase on your site')
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new GA4SetupManager()
  setup.run().catch(console.error)
}

module.exports = GA4SetupManager