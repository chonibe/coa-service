"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'

export function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    // Extract redirect path from search parameters
    const redirect = searchParams.get('redirect')
    if (redirect) {
      setRedirectPath(decodeURIComponent(redirect))
      console.log('Login Page Redirect Path:', redirect)
    }
  }, [searchParams])

  const handleShopifyLogin = async () => {
    try {
      setIsLoading(true)
      
      // Construct Shopify login URL with redirect
      const loginUrl = new URL('/api/auth/shopify', window.location.origin)
      
      // Include redirect path if available
      if (redirectPath) {
        loginUrl.searchParams.set('redirect', redirectPath)
      }

      // Redirect to Shopify authentication
      window.location.href = loginUrl.toString()
    } catch (error) {
      console.error('Login Error:', error)
      toast({
        title: 'Authentication Error',
        description: 'Unable to initiate login. Please try again.',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Street Collector Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {redirectPath 
                ? `Please log in to access: ${redirectPath}` 
                : 'Log in to access your Street Collector dashboard'}
            </p>
            
            <Button 
              onClick={handleShopifyLogin} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Authenticating...' : 'Log in with Shopify'}
            </Button>

            {redirectPath && (
              <div className="text-sm text-muted-foreground text-center mt-2">
                You will be redirected to {redirectPath} after authentication
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 