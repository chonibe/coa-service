'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main site if somehow we reach this page
    window.location.href = 'https://www.thestreetlamp.com'
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Redirecting...</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please wait while we redirect you to the main site.
        </p>
      </div>
    </div>
  )
} 