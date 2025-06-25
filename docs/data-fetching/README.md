# Data Fetching Strategies in COA Service

## 🌐 Overview
This document outlines the data fetching strategies for different portals in the COA Service platform.

## 🔍 Fetching Patterns

### 1. Client-Side Fetching
```typescript
// Common pattern for client-side data retrieval
const fetchData = async () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFromAPI = async () => {
      try {
        const response = await fetch('/api/endpoint')
        if (!response.ok) throw new Error('Fetch failed')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchFromAPI()
  }, [])
}
```

### 2. Server-Side Fetching
```typescript
// Server component data fetching
async function ServerComponent() {
  const supabase = createServerComponentClient()
  
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('condition', 'value')
}
```

## 📊 Portal-Specific Fetching Strategies

### Customer Portal
#### Data Sources
- **Orders**: Fetched from Supabase `orders` table
- **Artwork Collection**: Retrieved via custom API endpoint
- **NFC Tag Status**: Real-time updates from Supabase

```typescript
// Customer Dashboard Data Fetching
const fetchCustomerOrders = async () => {
  const supabase = createClientComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      name,
      created_at,
      line_items (
        line_item_id,
        title,
        quantity,
        nfc_tag_id,
        certificate_url
      )
    `)
    .eq('customer_id', session?.user.id)
}
```

### Vendor Portal
#### Data Sources
- **Product Inventory**: Supabase `products` table
- **Sales Analytics**: Aggregated from orders and transactions
- **Payout Information**: Custom calculation based on sales

```typescript
// Vendor Dashboard Data Fetching
const fetchVendorAnalytics = async (vendorId) => {
  const supabase = createServerComponentClient()
  
  // Aggregate sales data
  const { data: salesData } = await supabase
    .from('orders')
    .select(`
      total_amount,
      created_at,
      line_items (
        product_id,
        quantity
      )
    `)
    .eq('vendor_id', vendorId)
    .gte('created_at', '2024-01-01')
}
```

### Admin Portal
#### Data Sources
- **User Management**: Supabase Auth and custom `users` table
- **Platform Analytics**: Aggregated from multiple sources
- **Certification Tracking**: NFC tag and artwork certification tables

```typescript
// Admin Dashboard Data Fetching
const fetchPlatformMetrics = async () => {
  const supabase = createServerComponentClient()
  
  // Complex aggregation across multiple tables
  const userCount = await supabase
    .from('users')
    .select('*', { count: 'exact' })
  
  const artworkCertifications = await supabase
    .from('artwork_certifications')
    .select('status, count')
    .groupBy('status')
}
```

## 🛡️ Security Considerations

### Authentication Checks
```typescript
// Universal authentication check
const validateUserAccess = async (requiredRole) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()
  
  if (userRole.role !== requiredRole) {
    throw new Error('Insufficient Permissions')
  }
}
```

## 🔄 Real-Time Updates
```typescript
// Real-time subscription example
const subscribeToUpdates = (table, callback) => {
  const supabase = createClientComponentClient()
  
  const subscription = supabase
    .from(table)
    .on('*', (payload) => {
      callback(payload)
    })
    .subscribe()
  
  return () => {
    supabase.removeSubscription(subscription)
  }
}
```

## 📝 Best Practices
1. Always validate user authentication
2. Use server-side fetching for sensitive data
3. Implement proper error handling
4. Use real-time subscriptions sparingly
5. Cache frequently accessed, rarely changing data

## 🔍 Debugging Strategies
- Log all data fetching attempts
- Implement comprehensive error tracking
- Use Supabase and Vercel logging
- Monitor performance of data retrieval

## Version
**Data Fetching Documentation**: 1.0.0
**Last Updated**: [Current Date]

## Related Documentation
- [Authentication Flows](/docs/authentication/README.md)
- [Portal Architecture](/docs/architecture/README.md)
- [Performance Optimization](/docs/performance/optimization.md) 