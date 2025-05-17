'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AssignEditionNumbersButtonProps {
  productId: string
  onSuccess?: () => void
  forceSync?: boolean
}

export function AssignEditionNumbersButton({ productId, onSuccess, forceSync }: AssignEditionNumbersButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAssign = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/assign-edition-numbers?productId=${productId}&forceSync=${forceSync ? '1' : '0'}`)
      if (!res.ok) throw new Error('Failed to assign edition numbers')
      toast.success('Edition numbers assigned successfully')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign edition numbers')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleAssign} 
      disabled={isLoading}
    >
      {isLoading ? 'Assigning...' : 'Assign Edition Numbers'}
    </Button>
  )
}

interface RevokeEditionButtonProps {
  lineItemId: number
  onSuccess?: () => void
}

export function RevokeEditionButton({ lineItemId, onSuccess }: RevokeEditionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRevoke = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/editions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineItemId }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke edition number')
      }
      
      toast.success('Edition number revoked and reassigned successfully')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke edition number')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleRevoke} 
      disabled={isLoading}
      variant="destructive"
    >
      {isLoading ? 'Revoking...' : 'Revoke Edition'}
    </Button>
  )
} 