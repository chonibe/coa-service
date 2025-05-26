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
        console.log('Current hostname:', hostname)

        // Handle different domains
        switch (hostname) {
          case 'dashboard.thestreetlamp.com':
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
            break

          case 'admin.thestreetlamp.com':
            console.log('Redirecting to admin portal')
            router.replace('/admin')
            break

          case 'artist.thestreetlamp.com':
            console.log('Redirecting to artist portal')
            router.replace('/artist')
            break

          default:
            console.log('Redirecting to main site')
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