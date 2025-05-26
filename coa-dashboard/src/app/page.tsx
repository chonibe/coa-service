'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accountId = searchParams.get('account')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get the current hostname
        const hostname = window.location.hostname

        // Handle different domains
        if (hostname === 'dashboard.thestreetlamp.com') {
          // If account ID is provided, redirect to dashboard
          if (accountId) {
            router.push(`/dashboard?customer_id=${accountId}`)
            return
          }

          // Check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            // If authenticated, redirect to dashboard with their customer ID
            const customerId = session.user.user_metadata.customer_id
            if (customerId) {
              router.push(`/dashboard?customer_id=${customerId}`)
              return
            }
          }

          // If not authenticated, redirect to login
          router.push('https://www.thestreetlamp.com/account/login')
        } else if (hostname === 'admin.thestreetlamp.com') {
          router.push('/admin')
        } else if (hostname === 'artist.thestreetlamp.com') {
          router.push('/artist')
        } else {
          // Default fallback
          router.push('https://www.thestreetlamp.com')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('https://www.thestreetlamp.com/account/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [accountId, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Checking authentication...</h2>
          <p className="mt-1 text-sm text-gray-500">
            Please wait while we verify your login status.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Redirecting...</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please wait while we redirect you to the appropriate page.
        </p>
      </div>
    </div>
  )
} 