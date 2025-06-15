"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export default function CustomerLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    // Get redirect path from URL query parameter
    const redirect = searchParams.get('redirect')
    if (redirect) {
      setRedirectPath(redirect)
    }
  }, [searchParams])

  const handleShopifyLogin = async () => {
    try {
      // Redirect to Shopify authentication
      const authUrl = `/api/auth/shopify${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`
      router.push(authUrl)
    } catch (error) {
      toast({
        title: 'Login Error',
        description: 'Unable to initiate Shopify login',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Street Collector Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your digital art collection
          </p>
        </div>
        <div>
          <Button 
            onClick={handleShopifyLogin} 
            className="w-full"
          >
            Login with Shopify
          </Button>
        </div>
      </div>
    </div>
  )
} 