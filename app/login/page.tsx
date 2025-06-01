"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Function to get the correct redirect URI based on environment
function getRedirectUri() {
  // Use the current Vercel deployment URL
  return 'https://street-collector-jzt95pwqa-chonibes-projects.vercel.app/auth/callback'
}

export default function LoginPage() {
  const router = useRouter()
  const redirectUri = getRedirectUri()

  useEffect(() => {
    // Check if user is already logged in
    const checkLoginStatus = async () => {
      try {
        // Check for existing Street Lamp token
        const streetLampToken = document.cookie.includes('street_lamp_token')
        
        if (streetLampToken) {
          // Fetch user info to get customer ID
          const response = await fetch('https://account.thestreetlamp.com/oauth/userinfo', {
            headers: {
              'Authorization': `Bearer ${getCookie('street_lamp_token')}`
            }
          })

          if (response.ok) {
            const userInfo = await response.json()
            
            // Redirect to dashboard using customer ID
            router.push(`/customer/dashboard/${userInfo.customer_id || userInfo.sub}`)
            return
          }
        }

        // If not logged in, proceed with login
        handleLogin()
      } catch (error) {
        console.error('Login check failed:', error)
        handleLogin()
      }
    }

    checkLoginStatus()
  }, [router])

  // Helper function to get cookie value
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }

  const handleLogin = () => {
    const clientId = '594cf36a-179f-4227-821d-1dd00f778900'
    const scope = encodeURIComponent('openid email customer-account-api:full')
    const state = crypto.randomUUID()
    const nonce = crypto.randomUUID()

    const authUrl = `https://account.thestreetlamp.com/authentication/login?` +
      `client_id=${clientId}` +
      `&locale=en` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&nonce=${nonce}`

    window.location.href = authUrl
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Street Collector</CardTitle>
          <CardDescription>Authenticating...</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Checking your login status and redirecting...</p>
          <Button onClick={handleLogin} className="w-full">
            Login with The Street Lamp
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 