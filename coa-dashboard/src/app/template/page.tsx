'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TemplatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accountId = searchParams.get('account')

  useEffect(() => {
    if (accountId) {
      // Redirect to the dashboard with the customer ID
      router.push(`/dashboard?customer_id=${accountId}`)
    } else {
      // If no customer ID, redirect to the main store
      router.push('https://thestreetlamp.com/account')
    }
  }, [accountId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Redirecting...</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please wait while we redirect you to your dashboard.
        </p>
      </div>
    </div>
  )
} 