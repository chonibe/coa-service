import { headers } from 'next/headers'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const headersList = await headers()
  const shopifyCustomerId = headersList.get('X-Shopify-Customer-ID')

  return (
    <div id="coa-dashboard-app">
      <DashboardClient customerId={shopifyCustomerId || ''} />
    </div>
  )
} 