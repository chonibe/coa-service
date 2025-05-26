import { headers } from 'next/headers'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const headersList = await headers()
  const customerId = headersList.get('X-Customer-ID')

  if (!customerId) {
    return new Response('Unauthorized', { status: 401 })
  }

  return (
    <div id="coa-dashboard-app">
      <DashboardClient customerId={customerId} />
    </div>
  )
} 