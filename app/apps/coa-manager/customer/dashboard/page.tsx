import { headers } from 'next/headers'

export default async function DashboardPage() {
  const headersList = await headers()
  const customerId = headersList.get('X-Customer-ID')

  if (!customerId) {
    return new Response('Unauthorized', { status: 401 })
  }

  return (
    <div id="coa-dashboard-app">
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    </div>
  )
} 