'use client'

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function RedirectButton() {
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    // Check for customer ID in URL
    const params = new URLSearchParams(window.location.search)
    const id = params.get('account') || params.get('customer_id')
    if (id) {
      setCustomerId(id)
      // Redirect to dashboard with customer ID
      window.location.href = `https://dashboard.thestreetlamp.com/dashboard?customer_id=${id}`
    }
  }, [])

  return (
    <Button
      onClick={() => window.location.href = 'https://www.thestreetlamp.com/pages/authenticate'}
      className="w-full md:w-auto"
    >
      {customerId ? 'Loading Dashboard...' : 'Go to My Account'}
    </Button>
  )
} 