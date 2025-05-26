'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export default function DashboardWelcomePage() {
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
        console.log('Dashboard Welcome - Current hostname:', hostname)

        // Only handle dashboard domain
        if (hostname === 'dashboard.thestreetlamp.com') {
          if (accountId) {
            console.log('Redirecting to dashboard with account ID:', accountId)
            router.replace(`/dashboard?customer_id=${accountId}`)
          } else {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.user_metadata?.customer_id) {
              console.log('Redirecting to dashboard with session customer ID')
              router.replace(`/dashboard?customer_id=${session.user.user_metadata.customer_id}`)
            } else {
              console.log('Redirecting to login')
              window.location.href = 'https://www.thestreetlamp.com/account/login'
            }
          }
        } else {
          // If not on dashboard domain, redirect to main site
          window.location.href = 'https://www.thestreetlamp.com'
        }
      } catch (error) {
        console.error('Auth check error:', error)
        window.location.href = 'https://www.thestreetlamp.com/account/login'
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
          <h2 className="text-lg font-medium text-gray-900">Welcome to Your Dashboard</h2>
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
        <h2 className="text-lg font-medium text-gray-900">Welcome to Your Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please wait while we redirect you to your dashboard.
        </p>
      </div>
    </div>
  )
} 